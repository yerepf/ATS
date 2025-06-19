// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController'); // Importaremos el controlador

const router = express.Router();

// Ruta para iniciar sesión
// POST /api/auth/login
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;