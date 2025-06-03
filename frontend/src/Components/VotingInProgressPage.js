// Panel de presidencia - Página de votación en curso
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAppKitProvider } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { BrowserProvider } from "ethers";

export default function VotingInProgressPage({ disconnect }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState('');
  const { walletProvider } = useAppKitProvider("eip155");
  const address = useAppKitAccount();
  const [vote, setVote] = useState(null);

  const fetchData = async () => {
    const seatsRes = await fetch('http://localhost:3000/api/seats');
    const seatsData = await seatsRes.json();
    const votesRes = await fetch(`http://localhost:3000/api/votes/${id}/records`);
    const votesData = await votesRes.json();
    setSeats(seatsData);
    setVotes(votesData);
    setLoading(false);
  }; 

  useEffect(() => {
    fetch(`http://localhost:3000/api/votes`)
        .then(res => res.json())
        .then(data => {
            const found = data.find(v => String(v.id) === String(id));
            setVote(found);
            setLoading(false);
        });
    }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); //Este componente consulta los escaños y los votos de la votación cada 3 segundos para actualizar el estado.
    return () => clearInterval(interval);
  }, [id]);

  const votedSeats = new Set(votes.map(v => v.seat_number));

  async function handleCerrar(vote) {
    setAccion({ [vote.id]: 'Firmando para cerrar...' });
    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const message = `Cerrar votación\nID: ${vote.id}\nTítulo: ${vote.title}`;
      const signature = await signer?.signMessage(message);

      console.log('CERRAR VOTACIÓN ENVÍO:', {
        signature,
        address: String(address.address),
        title: vote.title
      });
      
      const res = await fetch(`http://localhost:3000/api/votes/${vote.id}/cerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, address: String(address.address), title: vote.title }),
      });

      if (res.ok) {
        setAccion({ [vote.id]: '¡Votación cerrada!' });
        setTimeout(() => navigate(`/`), 1000);
      } else {
        setAccion({ [vote.id]: 'Error al cerrar la votación' });
      }
    } catch (err) {
      setAccion({ [vote.id]: 'Firma cancelada o fallida' });
    }
  }

  if (loading) return <p>Cargando escaños...</p>;

 return (
    <div style={{ marginTop: 100, textAlign: 'center' }}>
      <h2>¡Votación abierta!</h2>
      <p>La votación con ID {id} está en curso.</p>

      <button onClick={() => handleCerrar(vote)}>
        {accion[vote.id] || 'Cerrar votación'}
      </button>

      <div style={{ color: '#444', minHeight: 24 }}>
        {accion[vote?.id] || ''}
      </div>

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