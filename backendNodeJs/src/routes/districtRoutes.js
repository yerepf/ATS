// src/routes/districtRoutes.js
const express = require('express');
const districtController = require('../controllers/districtController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/districts - Crear un nuevo distrito
router.post(
    '/',
    protect,
    authorize('AdminApp', 'AdminMinisterio'),
    districtController.createDistrict
);

// GET /api/districts - Listar todos los distritos
router.get(
    '/',
    protect,
    authorize('AdminApp', 'AdminMinisterio'),
    districtController.getAllDistricts
);

// GET /api/districts/:id - Ver un distrito específico
router.get(
    '/:id',
    protect,
    authorize('AdminApp', 'AdminMinisterio'),
    districtController.getDistrictById
);

// PUT /api/districts/:id - Actualizar un distrito
router.put(
    '/:id',
    protect,
    authorize('AdminApp', 'AdminMinisterio'),
    districtController.updateDistrict
);

// DELETE /api/districts/:id - Eliminar un distrito
router.delete(
    '/:id',
    protect,
    authorize('AdminApp', 'AdminMinisterio'),
    districtController.deleteDistrict
);

module.exports = router;
