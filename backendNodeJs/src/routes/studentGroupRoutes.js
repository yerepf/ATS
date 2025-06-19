// src/routes/studentGroupRoutes.js
const express = require('express');
const studentGroupController = require('../controllers/studentGroupController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Group CRUD (from previous step) ---
router.post('/', protect, authorize('AdminInstitucion'), studentGroupController.createStudentGroup);
router.get('/', protect, authorize('AdminApp', 'AdminInstitucion', 'AdminDistrito', 'AdminMinisterio'), studentGroupController.getAllStudentGroups); // Renamed :id to :groupId for clarity
router.put('/:groupId', protect, authorize('AdminInstitucion'), studentGroupController.updateStudentGroup); // Renamed :id to :groupId
//router.delete('/:groupId', protect, authorize('AdminInstitucion'), studentGroupController.deleteStudentGroup); // Renamed :id to :groupId


// --- NEW: Group Member Management ---

// POST /api/student-groups/:groupId/members - Assign student(s) to group
router.post(
    '/:groupId/members',
    protect,
    authorize('AdminInstitucion'), // Only institution admin can assign
    studentGroupController.assignStudentsToGroup
);

// DELETE /api/student-groups/:groupId/members/:studentId - Remove student from group

router.delete(
    '/:groupId/members/:studentId',
    protect,
    authorize('AdminInstitucion'), // Only institution admin can remove
    studentGroupController.removeStudentFromGroup
);

// GET /api/student-groups/:groupId/members - List members of a group
router.get(
    '/:groupId/members',
    protect,
    // Allow teachers to view members of groups in their institution as well
    authorize('AdminApp', 'AdminInstitucion', 'Profesor', 'AdminDistrito', 'AdminMinisterio'), // Scope check inside controller
    studentGroupController.getGroupMembers
);

// GET /api/student-groups/:studentId/group - Get the group of a specific student
router.get(
    '/student-groups/:studentId/group',
    protect,
    authorize('AdminApp', 'AdminInstitucion', 'Profesor', 'AdminDistrito', 'AdminMinisterio'), // Scope check inside controller
    studentGroupController.getStudentGroup
);
module.exports = router;