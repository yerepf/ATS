// src/routes/institutionRoutes.js
const express = require('express');
const institutionController = require('../controllers/institutionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/institutions - Crear
router.post(
    '/',
    protect,
    authorize('AdminApp', 'AdminMinisterio', 'AdminDistrito'), // Only these roles can create
    institutionController.createInstitution
);

// GET /api/institutions - Listar (Filtrado por rol en el controlador)
router.get(
    '/',
    protect,
    authorize('AdminApp', 'AdminMinisterio', 'AdminDistrito'), // Only these roles can list all (filtered)
    institutionController.getAllInstitutions
);

// GET /api/institutions/:id - Obtener una específica
router.get(
    '/:id',
    protect,
    // Allow Institution Admin too, but scope check is done inside controller
    authorize('AdminApp', 'AdminMinisterio', 'AdminDistrito', 'AdminInstitucion'),
    institutionController.getInstitutionById
);

// PUT /api/institutions/:id - Actualizar
router.put(
    '/:id',
    protect,
    authorize('AdminApp', 'AdminMinisterio', 'AdminDistrito'), // Only these roles can update
    institutionController.updateInstitution
);

// DELETE /api/institutions/:id - Eliminar
router.delete(
    '/:id',
    protect,
    authorize('AdminApp', 'AdminMinisterio', 'AdminDistrito'), // Only these roles can delete
    institutionController.deleteInstitution
);


module.exports = router;