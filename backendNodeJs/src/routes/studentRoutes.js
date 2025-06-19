// src/routes/studentRoutes.js
const express = require('express');
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();


// --- CRUD de Estudiantes ---
router.post('/', protect, authorize('AdminInstitucion'), studentController.createStudent);
router.get('/', protect, authorize('AdminInstitucion', 'Profesor', 'AdminDistrito', 'AdminMinisterio'), studentController.getAllStudents);

// --- NUEVO: GET Estudiantes con Grupos ---
router.get('/students-with-groups',
    protect,
    authorize('AdminInstitucion', 'Profesor', 'PersonalApoyo'), // Ajustar roles según sea necesario
    studentController.getStudentsWithGroups
);
// --- FIN NUEVO ---

router.get('/:studentId', protect, authorize('AdminInstitucion', 'Profesor', 'AdminDistrito', 'AdminMinisterio'), studentController.getStudentById);
router.put('/:studentId', protect, authorize('AdminInstitucion'), studentController.updateStudent);

module.exports = router;