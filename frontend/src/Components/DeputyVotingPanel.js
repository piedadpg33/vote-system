import { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

export default function DeputyVotingPanel({ vote, seat, disconnect }) {
  const [accion, setAccion] = useState('');
  const [votado, setVotado] = useState(false);
  const navigate = useNavigate();

  async function votar(choice) {
    setAccion('Firmando tu voto...');
    if (!window.ethereum) {
      setAccion('No se detectó wallet compatible');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const message = `Voto\nVotación ID: ${vote.id}\nEscaño: ${seat.seat_number}\nOpción: ${choice}`;
      const signature = await signer.signMessage(message);

      const res = await fetch(`http://localhost:3000/api/votes/${vote.id}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seat_number: seat.seat_number,
          choice,
          signature,
        }),
      });

      /**EL BACKEND DEBE HACER LO SIGUIENTE:
       * 
       * Validar la firma (que corresponde al mensaje y al wallet del diputado).
        Verificar que ese escaño no haya votado ya en esa votación (por la restricción UNIQUE).
        Insertar el registro en vote_records. */

      if (res.ok) {
        setAccion('¡Voto registrado!');
        setVotado(true);
        setTimeout(() => navigate('/'), 1200); // Redirige al panel de diputado
      } else {
        setAccion('Error al registrar el voto');
      }
    } catch (err) {
      setAccion('Firma cancelada o fallida');
    }
  }

  return (
    <div style={{ marginTop: 100, textAlign: 'center' }}>
      <h2>Votación en curso</h2>
      <p><b>ID:</b> {vote.id}</p>
      <p><b>Título:</b> {vote.title}</p>
      <p><b>Escaño:</b> {seat.seat_number}</p>
      <div style={{ margin: '32px 0' }}>
        <button
          onClick={() => votar('yes')}
          disabled={votado}
          style={{ marginRight: 24, padding: '10px 32px', fontWeight: 'bold', fontSize: 18 }}
        >
          Sí
        </button>
        <button
          onClick={() => votar('no')}
          disabled={votado}
          style={{ padding: '10px 32px', fontWeight: 'bold', fontSize: 18 }}
        >
          No
        </button>
      </div>
      <div style={{ color: '#444', minHeight: 24 }}>{accion}</div>
      <button onClick={disconnect} style={{ marginTop: 40 }}>Desconectar</button>
    </div>
  );
}