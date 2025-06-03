// Panel de presidencia - Lista y abrir o consultar las leyes registradas

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppKitProvider } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { BrowserProvider } from "ethers";

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


  async function handleAbrir(vote) {
    setAccion({ [vote.id]: 'Firmando...' });
    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const message = `Abrir votación\nID: ${vote.id}\nTítulo: ${vote.title}`;
      const signature = await signer?.signMessage(message);

      const res = await fetch(`http://localhost:3000/api/votes/${vote.id}/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, address: String(address.address), title: vote.title }),
      });

      if (res.ok) {
        setAccion({ [vote.id]: '¡Votación abierta!' });
        setTimeout(() => navigate(`/voting/${vote.id}`), 1000);
      } else {
        setAccion({ [vote.id]: 'Error al abrir la votación' });
      }
    } catch (err) {
      setAccion({ [vote.id]: 'Firma cancelada o fallida' });
    }
  }
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
    

  if (loading) return <p>Cargando leyes...</p>;

  return (
  <div className="card center">
    <h2>Panel de Presidencia</h2>
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Título</th>
          <th>Estado</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
      {votes.map(vote => (
        <tr key={vote.id}>
          <td>{vote.title}</td>
          <td>{vote.status}</td>
          {/* AQUÍ VA LA COLUMNA DE ACCIONES */}
          <td>
            {/* Aquí pega el bloque que te pasé */}
            {vote.status === 'PENDIENTE' ? (
              <button onClick={() => handleAbrir(vote)}>
                {accion[vote.id] || 'Empezar votación'}
              </button>
            ) : vote.status === 'EN CURSO' ? (
              <button onClick={() => handleCerrar(vote)}>
                {accion[vote.id] || 'Cerrar votación'}
              </button>
            ) : (
              <button onClick={() => navigate(`/voting/${vote.id}`)}>
                Ver
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
    </table>
    <button onClick={disconnect}>Desconectar</button>
  </div>
);
}