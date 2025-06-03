import { useEffect, useState } from 'react';
import DeputyVotingPanel from './DeputyVotingPanel';

export default function DeputyPage({ address, disconnect }) {
  const [seat, setSeat] = useState(null);
  const [votes, setVotes] = useState([]);
  const [myVotes, setMyVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingNow, setVotingNow] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const seatRes = await fetch(`http://localhost:3000/api/seats/${address}`);
      const seatData = await seatRes.json();
      setSeat(seatData);

      const votesRes = await fetch('http://localhost:3000/api/votes');
      const votesData = await votesRes.json();
      setVotes(votesData);

      let myVotesData = [];
      if (seatData && seatData.seat_number !== undefined && seatData.seat_number !== null) {
        const myVotesRes = await fetch(`http://localhost:3000/api/votes/records/${seatData.seat_number}`);
        myVotesData = await myVotesRes.json();
        setMyVotes(myVotesData);
      }

      setLoading(false);
    }
    fetchData();
  }, [address]);

  if (loading) return <p>Cargando panel de diputado...</p>;

  if (!seat) {
    return (
      <div className="card center">
        <h2>No tienes escaño asignado</h2>
        <p>No puedes participar en la votación porque no tienes escaño.</p>
        <button onClick={disconnect} style={{ marginTop: 40 }}>Desconectar</button>
      </div>
    );
  }

  if (votingNow) {
    return (
      <DeputyVotingPanel
        seat={seat}
        vote={votingNow}
        onVoted={() => {
          setVotingNow(null);
          window.location.reload();
        }}
        disconnect={disconnect}
      />
    );
  }

  return (
    <div className="card center">
      <h2>Historial de votaciones</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Ley</th>
            <th>Estado</th>
            <th>Tu voto</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {votes.map(vote => {
            const miVoto = myVotes.find(mv => mv.vote_id === vote.id);
            const puedeVotar = vote.status === 'EN CURSO' && !miVoto;
            return (
              <tr key={vote.id}>
                <td>{vote.title}</td>
                <td>
                  <span className="status">{vote.status}</span>
                </td>
                <td>
                  {miVoto
                    ? (miVoto.choice === 'yes' ? 'Sí' : 'No')
                    : (vote.status === 'EN CURSO' ? 'Pendiente' : 'No votó')}
                </td>
                <td>
                  {puedeVotar && (
                    <button onClick={() => setVotingNow(vote)}>
                      Votar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={disconnect} style={{ marginTop: 40 }}>Desconectar</button>
    </div>
  );
}