import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import VotingInProgressPage from "./VotingInProgressPage";
import ConsultaPage from "./ConsultaPage";
import { useAppKitProvider } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { BrowserProvider } from "ethers";

export default function DetailsPage({ disconnect }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vote, setVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accion, setAccion] = useState({});
    const [boton, setBoton] = useState({});
    const { walletProvider } = useAppKitProvider("eip155");
    const address = useAppKitAccount();

    useEffect(() => {
        fetch(`http://localhost:3000/api/votes`)
            .then(res => res.json())
            .then(data => {
                const found = data.find(v => String(v.id) === String(id));
                setVote(found);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <p>Cargando detalles...</p>;
    if (!vote) return <p>Votación no encontrada</p>;

    if (vote.status === "EN CURSO") {
        return <VotingInProgressPage vote={vote} disconnect={disconnect} />;
    }
    if (vote.status === "FINALIZADA") {
        return <ConsultaPage vote={vote} />;
    }

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

    async function handleAbrir(vote) {
        await switchToSepolia(); // <-- Fuerza Sepolia antes de firmar
        setBoton({ [vote.id]: 'Firmando...' });
        setAccion({ [vote.id]: 'Por favor, firma la apertura de la votación en la wallet. Si usas WalletConnect, revisa tu app móvil.' });
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
                setBoton({ [vote.id]: 'Empezar votación' });
                setAccion({ [vote.id]: '¡Votación abierta!' });
                setTimeout(() => navigate(`/voting/${vote.id}`), 1000);
            } else {
                setBoton({ [vote.id]: 'Empezar votación' });
                setAccion({ [vote.id]: 'Error al abrir la votación' });
            }
        } catch (err) {
            setBoton({ [vote.id]: 'Empezar votación' });
            setAccion({ [vote.id]: 'Firma cancelada o fallida' });
        }
    }

    // Si está PENDIENTE
    return (
        <div className="card center">
            <h2>Detalles de la votación</h2>
            <p><b>Título:</b> {vote.title}</p>
            <p><b>Descripción:</b> {vote.description}</p>
            <p><b>Estado:</b> {vote.status}</p>
            <button onClick={() => handleAbrir(vote)}>
                {boton[vote.id] || 'Empezar votación'}
            </button>
            <div style={{ minHeight: 32, marginTop: 8 }}>
                {accion[vote.id]}
            </div>
        </div>
    );
}