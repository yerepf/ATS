// src/controllers/studentController.js
const db = require('../config/database');

// Helper function to check if user has scope over a specific student/institution
const checkStudentScope = async (studentId, user) => {
    // Fetch the institution ID for the given student
    const [rows] = await db.query('SELECT InstitutionID FROM Students WHERE StudentID = ?', [studentId]);
    if (!rows || rows.length === 0) {
        return { authorized: false, institutionId: null }; // Student doesn't exist
    }
    const studentData = rows[0];
    const studentInstitutionId = studentData.InstitutionID;
    if (user.isMinistryUser) {
        return { authorized: true, institutionId: studentInstitutionId }; // Ministry can read any student
    }
    if (user.roleName === 'AdminInstitucion' && user.institutionId) {
        // Institution Admins can access students within their own institution
        const isAuthorized = studentInstitutionId === user.institutionId;
        return { authorized: isAuthorized, institutionId: studentInstitutionId };
    }
    if (user.roleName === 'AdminDistrito' && user.districtId) {
        const [instData] = await db.query('SELECT DistrictID FROM Institutions WHERE InstitutionID = ?', [studentInstitutionId]);
        const isAuthorized = instData.length > 0 && instData[0].DistrictID === user.districtId;
        return { authorized: isAuthorized, institutionId: studentInstitutionId };
    }
    if (user.roleName === 'Profesor' && user.institutionId) {
        // Teachers can access students within their own institution
        const isAuthorized = studentInstitutionId === user.institutionId;
        return { authorized: isAuthorized, institutionId: studentInstitutionId };
    }
    // Other roles
    return { authorized: false, institutionId: studentInstitutionId };
};

// --- CREATE (POST /api/students) ---
exports.createStudent = async (req, res, next) => {
    const { studentUniqueId, firstName, lastName, gender, dateOfBirth, status } = req.body;
    const user = req.user; // Should be AdminInstitucion

    // 1. Authorization
    if (user.roleName !== 'AdminInstitucion' || !user.institutionId) {
        return res.status(403).json({ message: 'Solo los administradores de institución pueden registrar estudiantes.' });
    }

    // 2. Validation
    if (!studentUniqueId || !firstName || !lastName) {
        return res.status(400).json({ message: 'ID Único, Nombre y Apellido son requeridos.' });
    }
    if (gender && !['M', 'F', 'O'].includes(gender)) {
        return res.status(400).json({ message: 'Género inválido. Usar "M", "F", u "O".' });
    } else if (!gender) {
        gender = 'O'; // Default to 'O' if not provided
    }

    const institutionId = user.institutionId;

    try {
        // 3. Check for Duplicate StudentUniqueID within the institution (Constraint handles this, but good to check first)
        const checkQuery = 'SELECT StudentID FROM Students WHERE StudentUniqueID = ? AND InstitutionID = ?';
        const [existing] = await db.query(checkQuery, [studentUniqueId, institutionId]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Conflicto: Ya existe un estudiante con ese ID Único en esta institución.' });
        }

        // 4. Insert Student
        const insertQuery = `
            INSERT INTO Students (InstitutionID, StudentUniqueID, FirstName, LastName, Gender, DateOfBirth, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        // EnrollmentDate set to CURDATE() automatically
        const [result] = await db.query(insertQuery, [
            institutionId,
            studentUniqueId,
            firstName,
            lastName,
            gender || null,
            dateOfBirth || null,
            status || 'Active'
        ]);

        // 5. Success Response
        const newStudentId = result.insertId;
        console.log(`Estudiante creado ID: ${newStudentId} en Institución ID: ${institutionId} por Usuario ID: ${user.userId}`);
        res.status(201).json({
            message: 'Estudiante registrado exitosamente.',
            student: {
                studentId: newStudentId,
                institutionId,
                studentUniqueId,
                firstName,
                lastName,
                gender: gender || null,
                dateOfBirth: dateOfBirth || null,
                status: status || 'Active'
            }
        });

    } catch (error) {
        console.error("Error al registrar estudiante:", error);
        // UK constraint error code might differ slightly across MySQL versions/configs
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('uq_student_id_institution')) {
             return res.status(409).json({ message: 'Conflicto: Ya existe un estudiante con ese ID Único en esta institución.' });
        }
        next(error);
    }
};

// --- NEW: GET ALL STUDENTS (GET /api/students) ---
exports.getAllStudents = async (req, res, next) => {
    const user = req.user;

    try {
        // 1. Authorization (Check user scope)
        if (!user.isMinistryUser && !user.institutionId) {
            return res.status(403).json({ message: 'No tiene permiso para ver estudiantes.' });
        }

        // 2. Fetch all students based on user scope
        let query = `
            SELECT StudentID, InstitutionID, StudentUniqueID, FirstName, LastName, Gender, DateOfBirth, Status, CreatedAt, UpdatedAt
            FROM Students
        `;
        const queryParams = [];
        const conditions = [];

        if (!user.isMinistryUser) {
            // Non-ministry users can only see students in their institution
            conditions.push('InstitutionID = ?');
            queryParams.push(user.institutionId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY LastName ASC, FirstName ASC';

        // 3. Execute query
        const [students] = await db.query(query, queryParams);

        // 4. Success response
        res.status(200).json({ students });

    } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        next(error);
    }
};

// --- READ ONE (GET /api/students/:id) ---
exports.getStudentById = async (req, res, next) => {
    const id = req.params.studentId; // Ensure the ID is retrieved from the URL parameters
    const user = req.user;

    try {
        // 1. Authorization Check
        const scopeCheck = await checkStudentScope(id, user);

        if (!scopeCheck.authorized || scopeCheck.institutionId !== user.institutionId) {
            return res.status(403).json({
                message: 'No tiene permiso para ver este estudiante.',
                userInstitutionId: user.institutionId,
                studentInstitutionId: scopeCheck.institutionId
            });
        }

        // 2. Fetch student data (specific ID and institution)
        const query = `
            SELECT s.*, i.Name as InstitutionName
            FROM Students s
            JOIN Institutions i ON s.InstitutionID = i.InstitutionID
            WHERE s.StudentID = ? AND s.InstitutionID = ?
        `;
        const [students] = await db.query(query, [id, user.institutionId]);

        if (students.length === 0) {
            return res.status(404).json({ message: 'Estudiante no encontrado.' });
        }

        // 3. Success Response
        res.status(200).json({ student: students[0] });

    } catch (error) {
        console.error(`Error al obtener estudiante ${id}:`, error);
        next(error);
    }
};

// --- UPDATE (PUT /api/students/:id) ---
exports.updateStudent = async (req, res, next) => {
    const id = req.params.studentId;
    const user = req.user; // Should be AdminInstitucion of this student
    const { studentUniqueId, firstName, lastName, gender, dateOfBirth, status } = req.body;

    // 1. Basic Validation
     if (studentUniqueId === undefined && firstName === undefined && lastName === undefined && gender === undefined && dateOfBirth === undefined && status === undefined) {
         return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar.' });
     }
      if (gender && !['M', 'F', 'O'].includes(gender)) {
         return res.status(400).json({ message: 'Género inválido. Usar "M", "F", u "O".' });
     }
      if (status && !['Active', 'Inactive', 'Graduated'].includes(status)) { // Example valid statuses
         return res.status(400).json({ message: 'Estado inválido.' });
     }

    try {
        // 2. Authorization Check (Only AdminInstitucion of THIS student can update)
        const scopeCheck = await checkStudentScope(id, user);
        if (!scopeCheck.authorized || user.roleName !== 'AdminInstitucion') {
            return res.status(403).json({ message: 'No tiene permiso para actualizar este estudiante.' });
        }
        const institutionId = user.institutionId; // Use the admin's institution ID for checks

        // 3. Check for Duplicate StudentUniqueID if it's being changed
        if (studentUniqueId) {
            const checkQuery = 'SELECT StudentID FROM Students WHERE StudentUniqueID = ? AND InstitutionID = ? AND StudentID != ?';
            const [existing] = await db.query(checkQuery, [studentUniqueId, institutionId, id]);
            if (existing.length > 0) {
                return res.status(409).json({ message: 'Conflicto: Ya existe otro estudiante con ese ID Único en esta institución.' });
            }
        }

        // 4. Construct Update Query Dynamically
        let updateQuery = 'UPDATE Students SET ';
        const queryParams = [];
        const updateFields = [];

        if (studentUniqueId !== undefined) { updateFields.push('StudentUniqueID = ?'); queryParams.push(studentUniqueId); }
        if (firstName !== undefined) { updateFields.push('FirstName = ?'); queryParams.push(firstName); }
        if (lastName !== undefined) { updateFields.push('LastName = ?'); queryParams.push(lastName); }
        if (gender !== undefined) { updateFields.push('Gender = ?'); queryParams.push(gender); }
        if (dateOfBirth !== undefined) { updateFields.push('DateOfBirth = ?'); queryParams.push(dateOfBirth); }
        if (status !== undefined) { updateFields.push('Status = ?'); queryParams.push(status); }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
        }

        updateQuery += updateFields.join(', ');
        updateQuery += ', UpdatedAt = CURRENT_TIMESTAMP WHERE StudentID = ? AND InstitutionID = ?'; // Scope check in WHERE
        queryParams.push(id);
        queryParams.push(institutionId);

        // 5. Execute Update
        const [result] = await db.query(updateQuery, queryParams);

        // 6. Check Result
        if (result.affectedRows === 0) {
             const scopeReCheck = await checkStudentScope(id, user);
             if (!scopeReCheck.authorized) { // Check if it existed and was in scope
                 return res.status(404).json({ message: 'Estudiante no encontrado o no perteneciente a esta institución.' });
             } else {
                  console.warn(`Estudiante ${id} no fue actualizado, ¿datos iguales o problema concurrente?`);
                 return res.status(200).json({ message: 'Estudiante no actualizado (posiblemente sin cambios).' });
             }
        }

        // 7. Success Response
        console.log(`Estudiante actualizado ID: ${id} por Usuario ID: ${user.userId}`);
        const [updatedStudent] = await db.query('SELECT * FROM Students WHERE StudentID = ?', [id]); // Fetch updated
        res.status(200).json({
            message: 'Estudiante actualizado exitosamente.',
            student: updatedStudent[0]
        });

    } catch (error) {
        console.error(`Error al actualizar estudiante ${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('uq_student_id_institution')) {
             return res.status(409).json({ message: 'Conflicto: Ya existe un estudiante con ese ID Único en esta institución.' });
        }
        next(error);
    }
};

exports.getStudentsWithGroups = async (req, res, next) => {
    const user = req.user;
    // Considerar añadir paginación/filtros similar a getAllStudentGroups si es necesario
    // const { page = 1, limit = 20, sortBy = 'LastName', sortOrder = 'ASC' } = req.query;

    try {
        // 1. Autorización (Similar a getAllStudents, ajustar roles si es necesario)
        let queryConditions = '';
        const queryParams = [];

        if (user.isMinistryUser) {
            // Ministerio puede ver todos los estudiantes y sus grupos
        } else if (user.roleName === 'AdminDistrito' && user.districtId) {
            // Admin de Distrito ve estudiantes de su distrito
            queryConditions = `WHERE i.DistrictID = ?`;
            queryParams.push(user.districtId);
        } else if ((user.roleName === 'AdminInstitucion' || user.roleName === 'Profesor') && user.institutionId) {
            // Admin de Institución y Profesor ven estudiantes de su institución
            queryConditions = `WHERE s.InstitutionID = ?`;
            queryParams.push(user.institutionId);
        } else {
            // Otros roles sin acceso general
            return res.status(403).json({ message: 'No tiene permiso para ver esta información.' });
        }

        // 2. Obtener estudiantes y datos de sus grupos usando JOINs
        // LEFT JOIN asegura que los estudiantes sin grupo también se incluyan
        const query = `
            SELECT
                s.StudentID, s.InstitutionID, s.StudentUniqueID, s.FirstName, s.LastName, s.Gender, s.DateOfBirth, s.Status, s.CreatedAt AS StudentCreatedAt, s.UpdatedAt AS StudentUpdatedAt,
                sg.GroupID, sg.GroupName, sg.AcademicYear, sg.IsActive AS GroupIsActive
            FROM Students s
            JOIN Institutions i ON s.InstitutionID = i.InstitutionID -- Join para filtro de distrito/institución
            LEFT JOIN StudentGroupMembers sgm ON s.StudentID = sgm.StudentID
            LEFT JOIN StudentGroups sg ON sgm.GroupID = sg.GroupID
            ${queryConditions}
            ORDER BY s.LastName ASC, s.FirstName ASC
            -- Añadir LIMIT y OFFSET aquí si se implementa paginación
        `;

        const [studentsWithGroups] = await db.query(query, queryParams);

        // 3. Formatear la respuesta (opcional: datos del grupo anidados dentro del estudiante)
        // La consulta actual devuelve una estructura plana. Se podría procesar más
        // si se necesita una estructura anidada como { student: {...}, group: {...} } por entrada.
        // Por simplicidad, devolver la estructura plana suele ser suficiente.

        // 4. Respuesta exitosa
        res.status(200).json({ students: studentsWithGroups });

    } catch (error) {
        console.error('Error al obtener estudiantes con grupos:', error);
        next(error);
    }
};
