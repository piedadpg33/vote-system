import { Routes, Route, useNavigate } from 'react-router-dom';
import { createAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { arbitrum, mainnet, sepolia } from '@reown/appkit/networks'
import { useEffect, useState } from 'react';
import PresidencyPanel from './Components/PresidencyPanel';
import ConsultaPage from './Components/ConsultaPage';
import VotingInProgressPage from './Components/VotingInProgressPage';
import DeputyPage from './Components/DeputyPage';
import DetailsPage from './Components/DetailsPage';
import './App.css';
import Banner from './Components/Banner';

const projectId = '175d627313dfd25721db852e140fed44';
const networks = [arbitrum, mainnet, sepolia];

createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  projectId,
  features: { analytics: true }
})

export default function App() {
  const { isConnected, address } = useAppKitAccount();
  const disconnect = useDisconnect().disconnect;
  const [authorized, setAuthorized] = useState(false);
  const [isPresidency, setIsPresidency] = useState(false);
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();

  // Función para desconectar y limpiar estado + redirigir
  function handleDisconnect() {
    disconnect();
    setAuthorized(false);
    setIsPresidency(false);
    navigate("/");
  }

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      fetch(`http://localhost:3000/api/authorized/${address}`)
        .then(res => res.json())
        .then(data => {
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

  if (loading || authorized === null) {
    return <p>Verificando permisos...</p>;
  }

  if (!authorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
        <h2>No estás autorizado para acceder.</h2>
        <button onClick={handleDisconnect} style={{ marginBottom: 20 }}>Desconectar</button>
      </div>
    );
  }

  return (
    <>
      <Banner address={address} isPresidency={isPresidency} />
      <Routes>
        <Route
          path="/"
          element={
            isPresidency ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
                <h2>Panel de Presidencia</h2>
                <button onClick={handleDisconnect} style={{ marginBottom: 20 }}>Desconectar</button>
                <p>Bienvenido, miembro de la presidencia.</p>
                <PresidencyPanel />
              </div>
            ) : (
              <DeputyPage address={address} disconnect={handleDisconnect} />
            )
          }
        />
        <Route path="/consulta/:id" element={<ConsultaPage />} />
        <Route path="/voting/:id" element={<VotingInProgressPage disconnect={handleDisconnect} />} />
        <Route path='/deputy' element={
          isPresidency ? <div style={{ marginTop: 100, textAlign: 'center' }}><h2>Solo los diputados pueden acceder aquí.</h2></div>
            : <DeputyPage address={address} disconnect={handleDisconnect} />
          }
        />
        <Route path="/details/:id" element={<DetailsPage disconnect={handleDisconnect} />} />
      </Routes>
    </>
  );
}