// Panel de presidencia - Consultar resultados de una votación específica

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ConsultaPage() {
  const { id } = useParams();
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:3000/api/votes/${id}/resultados`)
      .then(res => res.json())
      .then(data => {
        setResultados(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Cargando resultados...</p>;
  if (!resultados) return <p style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>No se encontraron resultados.</p>;

  return (
    <div className="card center" style={{ maxWidth: 480, margin: '100px auto', padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Resultados de la votación</h2>
      <p><b>Título:</b> {resultados.title}</p>
      <p><b>Estado:</b> {resultados.status}</p>
      <p><b>Votos a favor:</b> {resultados.yes}</p>
      <p><b>Votos en contra:</b> {resultados.no}</p>
      <p><b>Abstenciones:</b> {resultados.abstain}</p>
      <button onClick={() => navigate(`/`)} style={{ marginTop: 32 }}>Volver</button>
    </div>
  );
}