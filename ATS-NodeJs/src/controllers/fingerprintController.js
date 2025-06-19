// src/controllers/biometricController.js
const db = require('../config/database');

exports.createOrUpdateTemplate = async (req, res, next) => {
    try {
        const { studentId, templateData, fingerIndex } = req.body;
        const enrolledByUserId = req.user.userId; // Usuario que registra la huella
        const institutionId = req.user.institutionId; // Institución del usuario

        // Validaciones básicas
        if (!studentId || !templateData) {
            return res.status(400).json({ message: 'studentId y templateData son requeridos' });
        }

        // Verificar que el estudiante pertenece a la institución del usuario
        const [student] = await db.query(
            'SELECT InstitutionID FROM Students WHERE StudentID = ?',
            [studentId]
        );

        if (student.length === 0) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }

        if (student[0].InstitutionID !== institutionId) {
            return res.status(403).json({ message: 'No tiene permiso para registrar huellas de este estudiante' });
        }

        // Verificar si ya existe una plantilla para este estudiante
        const [existingTemplate] = await db.query(
            'SELECT TemplateID FROM BiometricTemplates WHERE StudentID = ?',
            [studentId]
        );

        if (existingTemplate.length > 0) {
            // Actualizar plantilla existente
            await db.query(
                'UPDATE BiometricTemplates SET TemplateData = ?, FingerIndex = ?, EnrolledByUserID = ?, EnrollmentDate = CURRENT_TIMESTAMP WHERE StudentID = ?',
                [templateData, fingerIndex, enrolledByUserId, studentId]
            );

            return res.status(200).json({ 
                message: 'Plantilla biométrica actualizada exitosamente',
                templateId: existingTemplate[0].TemplateID
            });
        } else {
            // Crear nueva plantilla
            const [result] = await db.query(
                'INSERT INTO BiometricTemplates (StudentID, TemplateData, FingerIndex, EnrolledByUserID) VALUES (?, ?, ?, ?)',
                [studentId, templateData, fingerIndex, enrolledByUserId]
            );

            return res.status(201).json({ 
                message: 'Plantilla biométrica creada exitosamente',
                templateId: result.insertId
            });
        }

    } catch (error) {
        console.error('Error al crear/actualizar plantilla biométrica:', error);
        next(error);
    }
};

exports.getTemplateByStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        // Obtener la plantilla biométrica
        const [template] = await db.query(
            'SELECT TemplateData FROM BiometricTemplates WHERE StudentID = ?',
            [studentId]
        );

        if (template.length === 0) {
            return res.status(404).json({ message: 'No se encontró plantilla biométrica para este estudiante' });
        }

        // Convertir TemplateData de Buffer a string (si es necesario)
        const templateData = template[0].TemplateData.toString('utf8');

        // Responder solo con el templateData
        res.status(200).json({ templateData });

    } catch (error) {
        console.error('Error al obtener plantilla biométrica:', error);
        next(error);
    }
};

exports.deleteTemplate = async (req, res, next) => {
    try {
        const { templateId } = req.params;
        const institutionId = req.user.institutionId;

        // Verificar que la plantilla pertenece a un estudiante de la institución
        const [template] = await db.query(
            `SELECT b.TemplateID, s.InstitutionID 
             FROM BiometricTemplates b
             JOIN Students s ON b.StudentID = s.StudentID
             WHERE b.TemplateID = ?`,
            [templateId]
        );

        if (template.length === 0) {
            return res.status(404).json({ message: 'Plantilla biométrica no encontrada' });
        }

        if (template[0].InstitutionID !== institutionId) {
            return res.status(403).json({ message: 'No tiene permiso para eliminar esta huella' });
        }

        // Eliminar la plantilla
        await db.query(
            'DELETE FROM BiometricTemplates WHERE TemplateID = ?',
            [templateId]
        );

        res.status(200).json({ message: 'Plantilla biométrica eliminada exitosamente' });

    } catch (error) {
        console.error('Error al eliminar plantilla biométrica:', error);
        next(error);
    }
};



exports.getStudentByTemplate = async (req, res, next) => {
    try {
        const { templateData } = req.body;

        // Validar que se envió el templateData
        if (!templateData) {
            return res.status(400).json({ message: 'templateData es requerido' });
        }

        // Buscar el estudiante asociado a la plantilla biométrica
        const [template] = await db.query(
            'SELECT b.TemplateID, b.StudentID, s.FirstName, s.LastName, s.InstitutionID, b.FingerIndex, b.EnrollmentDate, b.EnrolledByUserID, b.IsActive ' +
            'FROM BiometricTemplates b ' +
            'JOIN Students s ON b.StudentID = s.StudentID ' +
            'WHERE b.TemplateData = ?',
            [templateData]
        );

        if (template.length === 0) {
            return res.status(404).json({ message: 'No se encontró estudiante asociado a la plantilla biométrica' });
        }

        // Construir la respuesta con los datos del estudiante y la plantilla
        const response = {
            templateId: template[0].TemplateID,
            studentId: template[0].StudentID,
            firstName: template[0].FirstName,
            lastName: template[0].LastName,
            institutionId: template[0].InstitutionID,
            fingerIndex: template[0].FingerIndex,
            enrollmentDate: template[0].EnrollmentDate,
            enrolledByUserId: template[0].EnrolledByUserID,
            isActive: template[0].IsActive
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error al obtener estudiante por plantilla biométrica:', error);
        next(error);
    }
};
