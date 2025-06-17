// Panel de presidencia - Lista y abrir o consultar las leyes registradas

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppKitProvider } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';

export default function PresidencyPanel({ disconnect }) {
  const { walletProvider } = useAppKitProvider("eip155");
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState({});
  const navigate = useNavigate();
  const address = useAppKitAccount();
  
  useEffect(() => {
    fetch('http://localhost:3000/api/votes')
      .then(res => res.json())
      .then(data => {
        setVotes(data);
        setLoading(false);
      });
  }, [accion]);
    

  if (loading) return <p>Cargando leyes...</p>;

  return (
    <div className="card center">
      <h2>Panel de Presidencia</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {votes.map(vote => (
            <tr key={vote.id}>
              <td>{vote.title}</td>
              <td>{vote.status}</td>
              {/* Columna de acciones */}
              <td>
                <button onClick={() => navigate(`/details/${vote.id}`)}>
                  {vote.status === 'FINALIZADA'
                    ? 'Ver resultados (Blockchain)'
                    : 'Ver detalles'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}