// src/config/database.js
const mysql = require('mysql2');
require('dotenv').config(); // Acceso a variables de .env

// Crear un Pool de Conexiones: Es más eficiente que abrir/cerrar conexiones por cada consulta.
// Reutiliza conexiones existentes.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true, // Esperar si todas las conexiones están ocupadas
  connectionLimit: 2,      // Límite de conexiones simultáneas en el pool
  queueLimit: 0             // Sin límite de consultas en cola esperando conexión
});

// Usar la versión del pool basada en Promesas (facilita usar async/await)
const promisePool = pool.promise();

console.log(`Intentando conectar a la base de datos: ${process.env.DB_NAME} en ${process.env.DB_HOST}`);

module.exports = promisePool; // Exportamos el pool para usarlo en otros archivos