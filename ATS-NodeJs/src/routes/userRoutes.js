// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
// Importar ambos middlewares
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/users - Crear un nuevo usuario
// 1. 'protect': Asegura que esté logueado.
// 2. 'authorize': Asegura que el rol sea uno de los permitidos para crear usuarios.
// 3. 'userController.createUser': Ejecuta la lógica de creación.
router.post(
    '/',
    protect,
    authorize('AdminApp', 'AdminMinisterio', 'AdminDistrito', 'AdminInstitucion'),
    userController.createUser
);

router.get(
    '/',
    protect,
    authorize('AdminApp','AdminMinisterio', 'AdminDistrito', 'AdminInstitucion'),
    userController.getAllUsers
);

router.put(
    '/:id',
    protect,
    authorize('AdminApp','AdminMinisterio', 'AdminDistrito', 'AdminInstitucion'),
    userController.updateUser
);

router.get(
    '/filter', 
    protect,
    authorize('AdminApp','AdminMinisterio', 'AdminDistrito', 'AdminInstitucion'),
    userController.filterUsers
);

module.exports = router;