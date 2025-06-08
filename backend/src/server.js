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

// Servicio para mostrar todas las votaciones
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

// Servicio para ver votaciones en curso
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

// Servicio para saber si un escaño está ocupado por una dirección específica
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

// Servicio para votar. Requiere firma y que el escaño no haya votado ya
app.post('/api/votes/:id/votar', async (req, res) => {

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
    const message = `Voto\nEscaño: ${seat_number}\nOpcion: ${choice}`;
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

// Servicio para obtener los escaños disponibles
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

// Servicio para obtener los registros de votos de una votación
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

// Servicio para obtener los votos de un diputado por su número de escaño
app.get('/api/votes/records/:seat_number', async (req, res) => {
  const seatNumber = req.params.seat_number;
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(
      'SELECT vote_id, choice FROM vote_records WHERE seat_number = ?',
      [seatNumber]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo los votos del diputado' });
  } finally {
    await connection.end();
  }
});

// Servicio para cerrar una votación (requiere firma y que el creador sea presidente)
app.post('/api/votes/:id/cerrar', async (req, res) => {
  const voteId = req.params.id;
  const { signature, address, title } = req.body;
  console.log('CERRAR VOTACIÓN BODY:', { voteId, signature, address, title });

  if (!signature || !address || !title) {
    console.log('Faltan datos para la firma');
    return res.status(400).json({ error: 'Faltan datos para la firma' });
  }
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Obtén el creador de la votación (presidente)
    const [rows] = await connection.execute('SELECT created_by FROM votes WHERE id = ?', [voteId]);
    if (!rows.length) {
      await connection.end();
      return res.status(404).json({ error: 'Votación no encontrada' });
    }
    const created_by = rows[0].created_by;

    // Verifica la firma
    const message = `Cerrar votación\nID: ${voteId}\nTítulo: ${title}`;
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (err) {
      await connection.end();
      return res.status(400).json({ error: 'Firma inválida' });
    }
    if (
      recoveredAddress.toLowerCase() !== address.toLowerCase() ||
      address.toLowerCase() !== created_by.toLowerCase()
    ) {
      await connection.end();
      return res.status(403).json({ error: 'No autorizado. La firma no corresponde al presidente.' });
    }

    // Cambia el estado de la votación a "CERRADA"
    await connection.execute(
      "UPDATE votes SET status = 'FINALIZADA' WHERE id = ?",
      [voteId]
    );

    // Obtener resultados de la votación
    const [resultRows] = await connection.execute(
      `SELECT 
         SUM(choice = 'yes') AS yes, 
         SUM(choice = 'no') AS no, 
         SUM(choice = 'abstain') AS abstain
       FROM vote_records 
       WHERE vote_id = ?`,
      [voteId]
    );
    const yes = Number(resultRows[0].yes) || 0;
    const no = Number(resultRows[0].no) || 0;
    const abstain = Number(resultRows[0].abstain) || 0;

    // Guardar resultado en la blockchain
    let txHash = null;
    try {
      txHash = await guardarResultadoEnBlockchain(Number(voteId), yes, no, abstain);
      console.log('Resultado guardado en blockchain. TxHash:', txHash);
    } catch (err) {
      console.error('Error guardando resultado en blockchain:', err);
    }

    await connection.end();
    res.json({ message: 'Votación cerrada correctamente', txHash });
  } catch (err) {
    console.error('Error al cerrar la votación:', err);
    res.status(500).json({ error: 'Error al cerrar la votación' });
  }
});

// --- Blockchain VotingResults contract integration ---
const CONTRACT_ADDRESS = "0x0a812abc1F2CaD5AB21E32D2Bc6411A328A13363";
const CONTRACT_ABI = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"voteId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"yes","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"no","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"abstain","type":"uint256"}],"name":"VoteClosed","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"voteId","type":"uint256"}],"name":"getResult","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"results","outputs":[{"internalType":"uint256","name":"yes","type":"uint256"},{"internalType":"uint256","name":"no","type":"uint256"},{"internalType":"uint256","name":"abstain","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"voteId","type":"uint256"},{"internalType":"uint256","name":"yes","type":"uint256"},{"internalType":"uint256","name":"no","type":"uint256"},{"internalType":"uint256","name":"abstain","type":"uint256"}],"name":"saveResult","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

async function guardarResultadoEnBlockchain(voteId, yes, no, abstain) {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  const tx = await contract.saveResult(voteId, yes, no, abstain);
  await tx.wait();
  return tx.hash;
}

// Servicio para obtener los resultados de una votación
app.get('/api/votes/:id/resultados', async (req, res) => {
  const voteId = req.params.id;
  const connection = await mysql.createConnection(dbConfig);
  try {
    // Obtén los datos de la votación
    const [voteRows] = await connection.execute(
      'SELECT id, title, status FROM votes WHERE id = ?',
      [voteId]
    );
    if (!voteRows.length) {
      await connection.end();
      return res.status(404).json({ error: 'Votación no encontrada' });
    }
    const vote = voteRows[0];

    let yes = 0, no = 0, abstain = 0;
    if (vote.status === 'FINALIZADA') {
      // Leer resultados desde la blockchain
      try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const result = await contract.getResult(Number(voteId));
        yes = Number(result[0]);
        no = Number(result[1]);
        abstain = Number(result[2]);
      } catch (err) {
        console.error('Error leyendo resultados de blockchain:', err);
        // Si falla, intenta leer de la base de datos como fallback
        const [resultRows] = await connection.execute(
          `SELECT 
             SUM(choice = 'yes') AS yes, 
             SUM(choice = 'no') AS no, 
             SUM(choice = 'abstain') AS abstain
           FROM vote_records 
           WHERE vote_id = ?`,
          [voteId]
        );
        yes = Number(resultRows[0].yes) || 0;
        no = Number(resultRows[0].no) || 0;
        abstain = Number(resultRows[0].abstain) || 0;
      }
    } else {
      // Si no está finalizada, lee de la base de datos
      const [resultRows] = await connection.execute(
        `SELECT 
           SUM(choice = 'yes') AS yes, 
           SUM(choice = 'no') AS no, 
           SUM(choice = 'abstain') AS abstain
         FROM vote_records 
         WHERE vote_id = ?`,
        [voteId]
      );
      yes = Number(resultRows[0].yes) || 0;
      no = Number(resultRows[0].no) || 0;
      abstain = Number(resultRows[0].abstain) || 0;
    }

    await connection.end();
    res.json({
      id: vote.id,
      title: vote.title,
      status: vote.status,
      yes,
      no,
      abstain
    });
  } catch (err) {
    if (connection) await connection.end();
    res.status(500).json({ error: 'Error obteniendo resultados' });
  }
});