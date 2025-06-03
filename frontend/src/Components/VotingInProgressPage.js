// Panel de presidencia - Página de votación en curso
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function VotingInProgressPage({ disconnect }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState('');

  const fetchData = async () => {
    const seatsRes = await fetch('http://localhost:3000/api/seats');
    const seatsData = await seatsRes.json();
    const votesRes = await fetch(`http://localhost:3000/api/votes/${id}/records`);
    const votesData = await votesRes.json();
    setSeats(seatsData);
    setVotes(votesData);
    setLoading(false);
  }; 
  /**Para /api/seats (array de escaños):
     * [
     {
        "seat_number": 1,
        "user_wallet": "0x1234abcd..." // o null si está vacío
    },
    {
        "seat_number": 2,
        "user_wallet": "0xabcd5678..."
    }
    // ...
    ]

    /api/votes/:id/records


    Para /api/votes/:id/records (array de votos emitidos):
            [
        {
            "seat_number": 1,
            "choice": "yes",
            "voted_at": "2024-05-28T12:34:56.000Z"
        },
        {
            "seat_number": 2,
            "choice": "no",
            "voted_at": "2024-05-28T12:35:10.000Z"
        }
        // ...
        ]
   * 
   */

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); //Este componente consulta los escaños y los votos de la votación cada 3 segundos para actualizar el estado.
    return () => clearInterval(interval);
  }, [id]);

  const votedSeats = new Set(votes.map(v => v.seat_number));

  async function handleCerrar() {
    setAccion('Firmando para cerrar...');
    if (!window.ethereum) {
      setAccion('No se detectó wallet compatible');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const message = `Cerrar votación\nID: ${id}`;
      const signature = await signer.signMessage(message);

      const res = await fetch(`http://localhost:3000/api/votes/${id}/cerrar`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });
      /** 
       * Recibe la signature y comprueba que es válida.
       * En caso de éxito, el backend debería cambiar el estado de la votación a "close" y devolver un mensaje de éxito.
       * Si la firma es inválida o el usuario no está autorizado, debería devolver un error.
       */

      if (res.ok) {
        setAccion('¡Votación cerrada!');
        setTimeout(() => navigate('/'), 1200); // Redirige al panel de presidencia
      } else {
        setAccion('Error al cerrar la votación');
      }
    } catch (err) {
      setAccion('Firma cancelada o fallida');
    }
  }

  if (loading) return <p>Cargando escaños...</p>;

 return (
    <div style={{ marginTop: 100, textAlign: 'center' }}>
      <h2>¡Votación abierta!</h2>
      <p>La votación con ID {id} está en curso.</p>
      <button onClick={handleCerrar} style={{ marginBottom: 24, padding: '8px 24px', fontWeight: 'bold' }}>
        Cerrar votación
      </button>
      <div style={{ color: '#444', minHeight: 24 }}>{accion}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginTop: 40 }}>
        {seats.map(seat => (
          <div key={seat.seat_number} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: votedSeats.has(seat.seat_number) ? 'limegreen' : '#bbb',
                border: '2px solid #888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: 18,
                color: '#222',
                marginBottom: 8,
                transition: 'background 0.3s'
              }}
              title={seat.user_wallet || 'Vacío'}
            >
              {seat.seat_number}
            </div>
            <span style={{ fontSize: 12 }}>
              {votedSeats.has(seat.seat_number) ? 'Votó' : 'Pendiente'}
            </span>
          </div>
        ))}
      </div>
      {/* Añade el botón aquí, antes de cerrar el div */}
      <button onClick={disconnect} style={{ marginTop: 40 }}>Desconectar</button>
    </div>
  );
}