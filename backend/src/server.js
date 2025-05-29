const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config(); //cargar las variables del env
//const app = require('./app'); //usar app y asignar puerto
const app = express();
app.use(cors());

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

app.listen(PORT, () => { //iniciar el servidor
    console.log(`Server is running on port ${PORT}`);
});