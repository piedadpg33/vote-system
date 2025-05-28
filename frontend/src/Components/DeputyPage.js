import { useEffect, useState } from 'react';
import DeputyVotingPanel from './DeputyVotingPanel';

export default function DeputyPage({ address, disconnect }) {
  console.log('Pagina de Diputado, dirección:', address);
  const [seat, setSeat] = useState(null);
  const [openVote, setOpenVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const voteRes = await fetch('http://localhost:3000/api/votes/open');
      const voteData = await voteRes.json();
      setOpenVote(voteData);

      let seatData = null;
      if (voteData) {
        const seatRes = await fetch(`http://localhost:3000/api/seats/${address}`);
        seatData = await seatRes.json();
        
        // Comprobar si ya ha votado este escaño
      if (voteData && seatData.seat_number !== undefined && seatData.seat_number !== null) {    
          const votedRes = await fetch(`http://localhost:3000/api/votes/${voteData.id}/hasVoted/${seatData.seat_number}`);
          const votedData = await votedRes.json();
          console.log('Voted data:', votedData);
          setAlreadyVoted(votedData.hasVoted);
        }
      }
      setSeat(seatData);
      setLoading(false);
    }
    fetchData();
  }, [address]);

  if (loading) return <p>Cargando panel de diputado...</p>;

  if (!openVote) {
    return (
      <div style={{ marginTop: 100, textAlign: 'center' }}>
        <h2>No hay votaciones abiertas</h2>
        <button onClick={disconnect} style={{ marginTop: 40 }}>Desconectar</button>
      </div>
    );
  }

  if (!seat) {
    return (
      <div style={{ marginTop: 100, textAlign: 'center' }}>
        <h2>No tienes escaño asignado</h2>
        <p>No puedes participar en la votación porque no tienes escaño.</p>
        <button onClick={disconnect} style={{ marginTop: 40 }}>Desconectar</button>
      </div>
    );
  }

  if (alreadyVoted) {
    return (
      <div style={{ marginTop: 100, textAlign: 'center' }}>
        <h2>Ya has votado en esta votación</h2>
        <button onClick={disconnect} style={{ marginTop: 40 }}>Desconectar</button>
      </div>
    );
  }

  return <DeputyVotingPanel vote={openVote} seat={seat} disconnect={disconnect} />;
}