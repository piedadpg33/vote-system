const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config(); //cargar las variables del env
//const app = require('./app'); //usar app y asignar puerto
const app = express();
app.use(cors());
app.use(express.json());
const { ethers } = require('ethers');

const dbConfig = {
  host: 'localhost',
  user: 'fortris',
  password: '1234',
  database: 'vote_system'
};
const PORT = process.env.PORT || 3000;
//Servicio de autorizacion de wallet
app.get('/api/authorized/:wallet', async (req, res) => {
  const wallet = req.params.wallet;
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    'SELECT is_president FROM users WHERE wallet_address = ?',
    [wallet]
  );
  await connection.end();
  res.json({
    authorized: rows.length > 0,
    isPresidency: rows.length > 0 ? !!rows[0].is_president: false
  });
});

app.get('/api/votes', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.execute('SELECT * FROM votes');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Error en base de datos' });
  } finally {
    await connection.end();
  }
});
app.get('/api/votes/open', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.execute(
      "SELECT * FROM votes WHERE status = 'EN CURSO' LIMIT 1"
    );
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: 'Error en base de datos' });
  } finally {
    await connection.end();
  }
});

app.get('/api/seats/:address', async (req, res) => {
  const { address } = req.params;
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.execute(
      "SELECT seat_number, user_wallet FROM seats WHERE LOWER(user_wallet) = LOWER(?) LIMIT 1",
      [address]
    );
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: 'Error en base de datos' });
  } finally {
    await connection.end();
  }
});

app.post('/api/votes/:id/votar', async (req, res) => {

  console.log('tete',req.body);
  const vote_id = req.params.id;
  const { seat_number, choice, signature } = req.body;

  if (  
  vote_id === undefined || vote_id === null ||
  seat_number === undefined || seat_number === null ||
  !choice ||
  !signature) {
    console.log('faltan cositas: ',vote_id, seat_number, choice, signature);
    return res.status(400).json({ error: 'Faltan datos del voto' });
  }

  const connection = await mysql.createConnection(dbConfig);
  try {
    // Verifica si ya ha votado este escaño en esta votación
    const [existing] = await connection.execute(
      'SELECT * FROM vote_records WHERE vote_id = ? AND seat_number = ?',
      [vote_id, seat_number]
    );
    if (existing.length > 0) {
      await connection.end();
      return res.status(409).json({ error: 'Ya se ha votado desde este escaño' });
    }

    // Recupera el wallet del diputado para ese seat_number
    const [seatRows] = await connection.execute(
      'SELECT user_wallet FROM seats WHERE seat_number = ?',
      [seat_number]
    );
    if (seatRows.length === 0) {
      await connection.end();
      return res.status(400).json({ error: 'Escaño no encontrado' });
    }
    const user_wallet = seatRows[0].user_wallet;

    // Verifica la firma
    const message = `Voto\nVotacion ID: ${vote_id}\nEscaño: ${seat_number}\nOpcion: ${choice}`;
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (err) {
      await connection.end();
      return res.status(400).json({ error: 'Firma inválida' });
    }
    if (user_wallet.toLowerCase() !== recoveredAddress.toLowerCase()) {
      await connection.end();
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Inserta el voto
    await connection.execute(
      'INSERT INTO vote_records (vote_id, seat_number, choice, signature) VALUES (?, ?, ?, ?)',
      [vote_id, seat_number, choice, signature]
    );
    res.status(201).json({ message: 'Voto registrado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al emitir voto' });
  } finally {
    await connection.end();
  }
});

//hasVoted true si el escaño ya ha votado en esta votación
app.get('/api/votes/:vote_id/hasVoted/:seat_number', async (req, res) => {
  const { vote_id, seat_number } = req.params;
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM vote_records WHERE vote_id = ? AND seat_number = ?',
      [vote_id, seat_number]
    );
    const hasVoted = rows[0].count > 0;
    res.json({ hasVoted });
  } catch (err) {
    res.status(500).json({ error: 'Error comprobando voto' });
  } finally {
    await connection.end();
  }
});

app.listen(PORT, () => { //iniciar el servidor
    console.log(`Server is running on port ${PORT}`);
});

// Servicio para abrir una votación (requiere firma y que el creador sea presidente)
app.post('/api/votes/:id/abrir', async (req, res) => {
  const voteId = req.params.id;
  const { signature, address } = req.body; // <-- Recibe también la dirección
  console.log('Datos recibidos:', { voteId, signature, address, title: req.body.title });
console.log('Mensaje esperado:', `Abrir votación\nID: ${voteId}\nTítulo: ${req.body.title || ''}`);
  if (!signature || !address) {
    return res.status(400).json({ error: 'Faltan datos para la firma' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Obtener la votación y el creador
    const [votes] = await connection.execute(
      'SELECT created_by, status FROM votes WHERE id = ?',
      [voteId]
    );
    if (votes.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Votación no encontrada' });
    }
    const { created_by, status } = votes[0];
    console.log('created_by:', created_by);


    // Verificar si la votación ya está abierta o finalizada
    if (status !== 'PENDIENTE') {
      await connection.end();
      return res.status(400).json({ error: 'La votación no está en estado PENDIENTE' });
    }

    // Verificar si el creador es presidente
    const [users] = await connection.execute(
      'SELECT is_president FROM users WHERE wallet_address = ?',
      [created_by]
    );
    if (users.length === 0 || !users[0].is_president) {
      await connection.end();
      return res.status(403).json({ error: 'No autorizado. Solo el presidente puede abrir la votación.' });
    }

    // Verificar la firma
    const message = `Abrir votación\nID: ${voteId}\nTítulo: ${req.body.title || ''}`;
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (err) {
      await connection.end();
      return res.status(400).json({ error: 'Firma inválida' });
    }
    const addrStr = String(address);
    if (recoveredAddress.toLowerCase() !== addrStr.toLowerCase() || addrStr.toLowerCase() !== created_by.toLowerCase()) {
      await connection.end();
      return res.status(403).json({ error: 'No autorizado. La firma no corresponde al presidente.' });
    }

    // Cambiar el estado de la votación a "EN CURSO"
    await connection.execute(
      "UPDATE votes SET status = 'EN CURSO' WHERE id = ?",
      [voteId]
    );
    await connection.end();
    res.json({ message: 'Votación abierta correctamente' });
  } catch (err) {
     console.error('Error al abrir la votación:', err); // <-- Añade esta línea
    res.status(500).json({ error: 'Error al abrir la votación' });
  }
});


app.get('/api/seats', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute('SELECT * FROM seats');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener escaños' });
  } finally {
    await connection.end();
  }
});

app.get('/api/votes/:id/records', async (req, res) => {
  const voteId = req.params.id;
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(
      'SELECT seat_number, choice, voted_at FROM vote_records WHERE vote_id = ?',
      [voteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo los votos' });
  } finally {
    await connection.end();
  }
});