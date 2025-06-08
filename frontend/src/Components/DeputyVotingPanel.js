import { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useAppKitProvider} from '@reown/appkit/react';
import { BrowserProvider } from "ethers";

export default function DeputyVotingPanel({vote, seat, disconnect }) {
  const [accion, setAccion] = useState('');
  const [votado, setVotado] = useState(false);
  const navigate = useNavigate();
  const { walletProvider } = useAppKitProvider("eip155");
 


  // Fuerza el cambio a Sepolia antes de firmar
  async function switchToSepolia() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xAA36A7' }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xAA36A7',
              chainName: 'Sepolia',
              rpcUrls: ['https://ethereum-sepolia.core.chainstack.com/'],
              nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
        }
      }
    }
  }

  async function votar(choice) {
    await switchToSepolia(); // <-- Fuerza Sepolia antes de firmar
    setAccion('Firmando tu voto...');

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const message = `Voto\nEscaño: ${seat.seat_number}\nOpcion: ${choice}`;
      const signature=  await signer?.signMessage(message);


      const res = await fetch(`http://localhost:3000/api/votes/${vote.id}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote_id: vote.id,
          seat_number: seat.seat_number,
          choice,
          signature,
        }),
      });



      if (res.ok) {
        setAccion('¡Voto registrado!');
        setVotado(true);
        setTimeout(() => navigate('/deputy'), 1200); // Redirige al panel de diputado
      } else {
        setAccion('Error al registrar el voto');
      }
    } catch (err) {
      setAccion('Firma cancelada o fallida');
    }
  }

  return (
    <div className="card center">
      <h2>Panel de Diputado</h2>
      <div style={{ marginTop: 100, textAlign: 'center' }}>
        <h2>Votación en curso</h2>
        <p><b>Título:</b> {vote.title}</p>
        <p><b>Escaño:</b> {seat.seat_number}</p>
        <div style={{ margin: '32px 0' }}>
          <button
            onClick={() =>votar('yes')}
            disabled={votado}
            style={{ marginRight: 24, padding: '10px 32px', fontWeight: 'bold', fontSize: 18 }}
          >
            Sí
          </button>
          <button
            onClick={() => votar('no')}
            disabled={votado}
            style={{ padding: '10px 32px', fontWeight: 'bold', fontSize: 18 }}
          >
            No
          </button>
        </div>
        <div style={{ color: '#444', minHeight: 24 }}>{accion}</div>
        <button onClick={disconnect} style={{ marginTop: 40 }}>Desconectar</button>
      </div>
    </div>
  );
}