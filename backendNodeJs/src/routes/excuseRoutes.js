// src/routes/excuseRoutes.js
const express = require('express');
const excuseController = require('../controllers/excuseController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Rutas para las excusas ---

// Crear una nueva excusa (POST)
router.post(
    '/',
    protect,
    authorize('AdminInstitucion', 'Profesor'),
    excuseController.createExcuseRecord
);

// Obtener todas las excusas (GET)
router.get(
    '/',
    protect,
    authorize('AdminApp', 'AdminInstitucion', 'Profesor', 'AdminDistrito', 'AdminMinisterio'),
    excuseController.getAllExcuseRecords
);

// Obtener excusas de un estudiante específico (GET)
router.get(
    '/:studentId',
    protect,
    authorize('AdminApp', 'AdminInstitucion', 'Profesor', 'AdminDistrito', 'AdminMinisterio'),
    excuseController.getExcuseRecordsByStudentId
);

// Actualizar una excusa (PUT)
router.put(
    '/:excuseId',
    protect,
    authorize('AdminInstitucion', 'Profesor'),
    excuseController.updateExcuseRecord
);

// Eliminar una excusa (DELETE)
router.delete(
    '/:excuseId',
    protect,
    authorize('AdminInstitucion', 'Profesor'),
    excuseController.deleteExcuseRecord
);

module.exports = router;
