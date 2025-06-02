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
      "SELECT * FROM votes WHERE status = 'open' LIMIT 1"
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