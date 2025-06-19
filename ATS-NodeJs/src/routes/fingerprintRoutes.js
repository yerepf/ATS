// src/routes/biometricRoutes.js
const express = require('express');
const biometricController = require('../controllers/fingerprintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/biometrics - Crear/actualizar huella digital
router.post(
    '/',
    protect,
    authorize('AdminInstitucion', 'Profesor', 'PersonalApoyo'), // Solo AdminInstitucion puede registrar huellas
    biometricController.createOrUpdateTemplate
);

// POST /api/biometrics/student/:studentId - Obtener huella por estudiante
router.post(
    '/student/:studentId',
    protect,
    authorize('AdminInstitucion', 'Profesor', 'PersonalApoyo'), // Profesor también puede ver para asistencia
    biometricController.getTemplateByStudent
);

// DELETE /api/biometrics/:templateId - Eliminar huella
router.delete(
    '/:templateId',
    protect,
    authorize('AdminInstitucion'),
    biometricController.deleteTemplate
);


// POST /api/biometrics/template - Obtener ID de estudiante por datos de huella
router.post(
    '/template',
    protect,
    authorize('AdminInstitucion', 'Profesor', 'PersonalApoyo'), // Profesor también puede ver para asistencia
    biometricController.getStudentByTemplate
);


module.exports = router;