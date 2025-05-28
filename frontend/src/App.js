import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { arbitrum, mainnet } from '@reown/appkit/networks'
import { useEffect, useState } from 'react';
import PresidencyPanel from './Components/PresidencyPanel';
import ConsultaPage from './Components/ConsultaPage';
import VotingInProgressPage from './Components/VotingInProgressPage';
import DeputyPage from './Components/DeputyPage';

const projectId = '175d627313dfd25721db852e140fed44';
const networks = [arbitrum, mainnet];

createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  projectId,
  features: { analytics: true }
})

export default function App() {
  const { isConnected, address } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const [authorized, setAuthorized] = useState(false);
  const [isPresidency, setIsPresidency] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      fetch(`http://localhost:3000/api/authorized/${address}`)
        .then(res => res.json())
        .then(data => {
           console.log('Auth data:', data);
          setAuthorized(data.authorized);
          setIsPresidency(data.isPresidency);
          setLoading(false);
        });
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
        <h2>Bienvenido al sistema de votación</h2>
        <p>Por favor, conecta tu wallet para continuar</p>
        <appkit-button />
      </div>
    );
  }

  if (loading) {
    return <p>Verificando permisos...</p>;
  }

  if (!authorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
        <h2>No estás autorizado para acceder.</h2>
        <button onClick={disconnect} style={{ marginBottom: 20 }}>Desconectar</button>
      </div>
    );
  }


  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isPresidency ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
                <h2>Panel de Presidencia</h2>
                <button onClick={disconnect} style={{ marginBottom: 20 }}>Desconectar</button>
                <p>Bienvenido, miembro de la presidencia.</p>
                <PresidencyPanel />
              </div>
            ) : (
              <DeputyPage address={address} disconnect={disconnect} />
            )
          }
        />
        <Route path="/consulta/:id" element={<ConsultaPage />} />
        <Route path="/voting/:id" element={<VotingInProgressPage />} />
        <Route path='/deputy' element={<DeputyPage address={address} disconnect={disconnect} />} />
      </Routes>
    </BrowserRouter>
  );
  
}