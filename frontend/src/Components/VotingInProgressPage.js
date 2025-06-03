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

 // Mapea los votos por escaño
const votosPorAsiento = {};
votes.forEach(v => {
  votosPorAsiento[v.seat_number] = v.choice; // 'yes' o 'no'
});

const totalSeats = seats.length;
const radius = 220; // radio del semicírculo
const centerX = 300;
const centerY = 320;

console.log("Prop disconnect en VotingInProgressPage:", disconnect);
return (
  <div style={{ marginTop: 60, textAlign: 'center' }}>
    <h2>¡Votación abierta!</h2>
    <p>La votación <b>{vote?.title}</b> está en curso.</p>

    <button onClick={() => handleCerrar(vote)}>
      {accion[vote?.id] || 'Cerrar votación'}
    </button>

    <div style={{ color: '#444', minHeight: 24 }}>
      {accion[vote?.id] || ''}
    </div>

    {/* Semicírculo con escaños */}
    <div style={{ position: 'relative', width: 600, height: 400, margin: '40px auto' }}>
      <img
        src="/congreso-semicirculo.svg"
        alt="Hemiciclo Congreso"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 600,
          height: 400,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.7
        }}
      />
      <svg width={600} height={400} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        {seats.map((seat, i) => {
          const angle = Math.PI * (i / (totalSeats - 1));
          const centerX = 300;
          const centerY = 370; // Más abajo para que no se corte
          const radius = 220;
          const x = centerX + radius * Math.cos(angle - Math.PI);
          const y = centerY + radius * Math.sin(angle - Math.PI) - 30;
          let color = '#bbb';
          if (votosPorAsiento[seat.seat_number] === 'yes') color = 'limegreen';
          else if (votosPorAsiento[seat.seat_number] === 'no') color = 'crimson';
          return (
            <g key={seat.seat_number}>
              <circle
                cx={x}
                cy={y}
                r={22}
                fill={color}
                stroke="#222"
                strokeWidth={2}
              />
              <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                fontSize="16"
                fill="#222"
                fontWeight="bold"
              >
                {seat.seat_number}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
   <button
  onClick={() => {
    console.log("Botón desconectar pulsado");
    disconnect(); // Esto ejecuta handleDisconnect de App.js
  }}
  style={{ marginTop: 40 }}
>
  Desconectar
</button>
  </div>
);
}