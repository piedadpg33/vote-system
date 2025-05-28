// Panel de presidencia - Lista y abrir o consultar las leyes registradas

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useAppKitAccount } from '@reown/appkit/react';

export default function PresidencyPanel() {
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

      const message = `Abrir votación\nID: ${vote.id}\nTítulo: ${vote.title}`;
      const signature = await address.signMessage(message);

      // Cambia el estado en el backend solo si la firma es válida
      const res = await fetch(`http://localhost:3000/api/votes/${vote.id}/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });

      /** 
       * Recibe la signature y comprueba que es válida.
       * en caso de éxito, el backend debería cambiar el estado de la votación a "open" y devolver un mensaje de éxito.
       * Si la firma es inválida o el usuario no está autorizado, debería devolver un error.
      */

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
            {vote.status === null ? (
              <>
                <button onClick={() => handleAbrir(vote)}>
                  Abrir
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