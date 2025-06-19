// src/routes/attendanceRecordsRoutes.js
const express = require('express');
const attendanceRecordsController = require('../controllers/attendanceRecordsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Rutas para los registros de asistencia ---

// Crear un nuevo registro de asistencia (POST)
router.post(
    '/',
    protect,
    authorize('AdminInstitucion', 'Profesor'),
    attendanceRecordsController.createAttendanceRecord
);

// Obtener todos los registros de asistencia (GET)
router.get(
    '/',
    protect,
    authorize('AdminApp', 'AdminInstitucion', 'Profesor', 'AdminDistrito', 'AdminMinisterio'),
    attendanceRecordsController.getAllAttendanceRecords
);

// Obtener registros de asistencia de un estudiante específico (GET)
router.get(
    '/:studentId',
    protect,
    authorize('AdminApp', 'AdminInstitucion', 'Profesor', 'AdminDistrito', 'AdminMinisterio'),
    attendanceRecordsController.getAttendanceRecordsByStudentId
);

// Actualizar un registro de asistencia (PUT)
router.put(
    '/:recordId',
    protect,
    authorize('AdminInstitucion', 'Profesor'),
    attendanceRecordsController.updateAttendanceRecord
);

// Eliminar un registro de asistencia (DELETE)
router.delete(
    '/:recordId',
    protect,
    authorize('AdminInstitucion', 'Profesor'),
    attendanceRecordsController.deleteAttendanceRecord
);

module.exports = router;
