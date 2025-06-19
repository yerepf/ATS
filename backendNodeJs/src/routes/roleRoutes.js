// src/routes/roleRoutes.js
const express = require('express');
const roleController = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/roles - Crear un nuevo rol
router.post(
    '/',
    protect,
    authorize('AdminApp'),
    roleController.createRole
);

// GET /api/roles - Listar todos los roles
router.get(
    '/',
    protect,
    authorize('AdminApp'),
    roleController.getAllRoles
);

// GET /api/roles/:id - Ver un rol específico
router.get(
    '/:id',
    protect,
    authorize('AdminApp'),
    roleController.getRoleById
);

// PUT /api/roles/:id - Actualizar un rol
router.put(
    '/:id',
    protect,
    authorize('AdminApp'),
    roleController.updateRole
);

// DELETE /api/roles/:id - Eliminar un rol
router.delete(
    '/:id',
    protect,
    authorize('AdminApp'),
    roleController.deleteRole
);

module.exports = router;
