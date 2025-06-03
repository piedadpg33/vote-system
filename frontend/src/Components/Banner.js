import React from 'react';

export default function Banner({ address, isPresidency }) {
  if (!address) return null;

  return (
    <div style={{
      width: '100%',
      background: 'linear-gradient(90deg, #0057b8 0%, #ffd700 100%)',
      color: '#222',
      padding: '16px 0',
      fontWeight: 'bold',
      fontSize: 18,
      textAlign: 'center',
      letterSpacing: 1,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      marginBottom: 24,
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <span>
        Conectado: <span style={{ color: '#333', fontFamily: 'monospace' }}>{address}</span>
        {" — "}
        Rol: <span style={{ color: isPresidency ? '#0057b8' : '#228B22' }}>
          {isPresidency ? 'Presidente' : 'Diputado'}
        </span>
      </span>
    </div>
  );
}