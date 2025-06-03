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

  /**{ datos de la vote_records 
  "id": 1,
  "title": "Ley de ejemplo",
  "status": "close",
  "yes": 10,
  "no": 5
} */

  if (loading) return <p>Cargando resultados...</p>;
  if (!resultados) return <p>No se encontraron resultados.</p>;

  return (
    <div>
      <div style={{ marginTop: 100 }}>
        <h2>Resultados de la votación</h2>
        <p><b>Título:</b> {resultados.title}</p>
        <p><b>Estado:</b> {resultados.status}</p>
        <p><b>Votos a favor:</b> {resultados.yes}</p>
        <p><b>Votos en contra:</b> {resultados.no}</p>
      </div>

      <button onClick={() => navigate(-1)}> Volver </button>
    </div>
    
  );
}