const express = require('express'); //crea el servidor web
const cors = require('cors'); //permite el acceso al backend desde el frontend
// const authRoutes = require('./routes/authRoutes'); //importar las rutas

const app = express(); //crear la app
app.use(cors()); //aceptar conexiones del frontend
app.use(express.json()); //aceptar peticiones en formato json

// app.use('/api/auth', authRoutes); //usar las rutas de authRoutes

module.exports = app;
