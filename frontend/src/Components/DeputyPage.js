import { useEffect, useState } from 'react';
import DeputyVotingPanel from './DeputyVotingPanel';

export default function DeputyPage({ address, disconnect }) {
  const [seat, setSeat] = useState(null);
  const [openVote, setOpenVote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const voteRes = await fetch('http://localhost:3000/api/votes/open');
      const voteData = await voteRes.json();
      setOpenVote(voteData);

      let seatData = null;
      if (voteData) {
        const seatRes = await fetch(`http://localhost:3000/api/seats/${address}`);
        seatData = await seatRes.json();
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

  return <DeputyVotingPanel address={address} vote={openVote} seat={seat} disconnect={disconnect} />;
}