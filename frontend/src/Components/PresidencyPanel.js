// Panel de presidencia - Lista y abrir o consultar las leyes registradas

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppKitProvider } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { BrowserProvider } from "ethers";

export default function PresidencyPanel() {
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

  if (loading) return <p>Cargando leyes...</p>;

  return (
    <div style={{ marginTop: 40 }}>
      <h3>Leyes registradas</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {votes.map(vote => (
          <li key={vote.id} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <span style={{ flex: 1 }}>{vote.title}</span>
            {vote.status === 'PENDIENTE' ? (
              <>
                <button onClick={() => handleAbrir(vote)}>
                  Empezar la votación
                </button>
                {accion[vote.id] && <span style={{ marginLeft: 10 }}>{accion[vote.id]}</span>}
              </>
            ) : (
              <button onClick={() => navigate(`/consulta/${vote.id}`)}>
                Consultar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}