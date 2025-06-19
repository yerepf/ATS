// src/server.js

// 1. Cargar variables de entorno del archivo .env
require('dotenv').config();

// 2. Importar librerías necesarias
const express = require('express');
const cors = require('cors');
const db = require('./config/database'); // Importaremos la configuración de BD que crearemos

// 3. Crear la aplicación Express
const app = express();

// 4. Definir el puerto
const PORT = process.env.PORT || 8081; // Usar el puerto de .env o 3001 si no está definido

// 5. Middlewares Esenciales (se ejecutan en cada solicitud)
app.use(cors()); // Habilitar CORS para todas las rutas (permite que Angular se conecte)
app.use(express.json()); // Habilitar que Express entienda el formato JSON en el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true })); // Habilitar que Express entienda datos de formularios

// 6. Ruta de Prueba simple
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API funcionando correctamente.' });
});

// --- Rutas Principales ---
const authRoutes = require('./routes/authRoutes');
const districtRoutes = require('./routes/districtRoutes');
const userRoutes = require('./routes/userRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const studentGroupRoutes = require('./routes/studentGroupRoutes');
const studentRoutes = require('./routes/studentRoutes');
const roleRoutes = require('./routes/roleRoutes');
const attendanceRoutes = require('./routes/attendanceRecordsRoutes'); // Nueva ruta para asistencia
const excuseRoutes = require('./routes/excuseRoutes'); // Nueva ruta para excusas
 const biometricRoutes = require('./routes/fingerprintRoutes');

// ... importar otras rutas (attendance, excuses, etc.)

app.use('/api/auth', authRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/users', userRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/student-groups', studentGroupRoutes);
app.use('/api/students', studentRoutes); 
app.use('/api/roles', roleRoutes);       
app.use('/api/attendances', attendanceRoutes);
app.use('/api/excuses', excuseRoutes);
app.use('/api/biometrics', biometricRoutes);

// ... usar otras rutas

// 7. Middleware para Manejo de Errores (Básico)
// (Lo mejoraremos más adelante)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal en el servidor!');
});

// 8. Iniciar el servidor y escuchar en el puerto definido
app.listen(PORT, () => {
  console.log(`Servidor API iniciado en http://localhost:${PORT}`);
  // Verificar conexión a BD al iniciar (opcional pero útil)
  db.query('SELECT 1')
    .then(() => {
      console.log('Conexión a la base de datos verificada.');
    })
    .catch(err => {
      console.error('¡Error al verificar la conexión a la base de datos!', err);
    });
});

module.exports = app; // Exportar app puede ser útil para pruebas