// src/controllers/studentGroupController.js
const db = require('../config/database');

// Helper function (keep from previous step)
const checkGroupScope = async (groupId, user) => {
    // ... (implementation from previous step remains the same) ...
    if (user.isMinistryUser) {
        return true; // Ministry can see any group (for reading purposes)
    }
    const [groupData] = await db.query('SELECT InstitutionID FROM StudentGroups WHERE GroupID = ?', [groupId]);
    if (groupData.length === 0) { return false; }
    const groupInstitutionId = groupData[0].InstitutionID;
    if (user.roleName === 'AdminDistrito' && user.districtId) {
        const [instData] = await db.query('SELECT DistrictID FROM Institutions WHERE InstitutionID = ?', [groupInstitutionId]);
        return instData.length > 0 && instData[0].DistrictID === user.districtId;
    }
    if ((user.roleName === 'AdminInstitucion' || user.roleName === 'Profesor') && user.institutionId) {
        // Institution Admins and Teachers can access groups within their own institution
         return groupInstitutionId === user.institutionId;
    }
    return false;
};

// --- CREATE GROUP (POST /api/student-groups) ---
exports.createStudentGroup = async (req, res, next) => {
    const user = req.user;
    // Solo AdminInstitucion puede crear grupos.
    if (user.roleName !== 'AdminInstitucion' || !user.institutionId) {
        return res.status(403).json({ message: 'No tiene permiso para crear grupos.' });
    }

    const { groupName, academicYear, description, isActive } = req.body;
    // Validar campos requeridos
    if (!groupName || !academicYear) {
        return res.status(400).json({ message: 'Se requieren los campos groupName y academicYear.' });
    }

    try {
        // Verificar si ya existe un grupo con el mismo nombre, año académico y en la misma institución
        const checkQuery = `
            SELECT GroupID 
            FROM StudentGroups 
            WHERE GroupName = ? AND AcademicYear = ? AND InstitutionID = ?
        `;
        const [existingGroup] = await db.query(checkQuery, [groupName, academicYear, user.institutionId]);
        if (existingGroup.length > 0) {
            return res.status(400).json({ message: 'Ya existe un grupo con ese nombre y año académico en su institución.' });
        }

        // Insertar el nuevo grupo
        const insertQuery = `
            INSERT INTO StudentGroups (InstitutionID, GroupName, AcademicYear, Description, IsActive)
            VALUES (?, ?, ?, ?, ?)
        `;
        const insertParams = [
            user.institutionId,
            groupName,
            academicYear,
            description || null,
            isActive !== undefined ? isActive : true
        ];
        const [result] = await db.query(insertQuery, insertParams);

        // Se puede retornar el grupo creado consultándolo por su GroupID
        const createdGroupQuery = 'SELECT * FROM StudentGroups WHERE GroupID = ?';
        const [groups] = await db.query(createdGroupQuery, [result.insertId]);

        res.status(201).json({
            message: 'Grupo creado exitosamente.',
            group: groups[0]
        });
    } catch (error) {
        console.error('Error al crear el grupo de estudiantes:', error);
        next(error);
    }
};

// este endpoint de lectura tiene filtro integrado
// --- READ ALL GROUPS (GET /api/student-groups) ---
exports.getAllStudentGroups = async (req, res, next) => {
    const user = req.user;
    const { page = 1, limit = 20, sortBy = 'GroupName', sortOrder = 'ASC', academicYear, isActive } = req.query;

    try {
        // 1. Authorization (Who can view groups? Admins + Teachers of the institution)
        let institutionFilter = '';
        let queryParams = [];

        if (user.isMinistryUser) {
            // Ministry users can view all groups
        } else if (user.roleName === 'AdminDistrito' && user.districtId) {
            // District Admins can view groups in their district
            institutionFilter = `WHERE i.DistrictID = ?`;
            queryParams.push(user.districtId);
        } else if ((user.roleName === 'AdminInstitucion' || user.roleName === 'Profesor') && user.institutionId) {
            // Institution Admins and Teachers can view groups in their institution
            institutionFilter = `WHERE sg.InstitutionID = ?`;
            queryParams.push(user.institutionId);
        } else {
            return res.status(403).json({ message: 'No tiene permiso para ver los grupos.' });
        }

        // 2. Apply additional filters (academicYear, isActive)
        if (academicYear) {
            institutionFilter += institutionFilter ? ' AND ' : 'WHERE ';
            institutionFilter += `sg.AcademicYear = ?`;
            queryParams.push(academicYear);
        }
        if (isActive !== undefined) {
            institutionFilter += institutionFilter ? ' AND ' : 'WHERE ';
            institutionFilter += `sg.IsActive = ?`;
            queryParams.push(isActive === 'true');
        }

        // 3. Pagination and Sorting
        const allowedSortBy = ['GroupName', 'AcademicYear', 'CreatedAt', 'UpdatedAt'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'GroupName';
        const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const countQuery = `
            SELECT COUNT(*) as total
            FROM StudentGroups sg
            JOIN Institutions i ON sg.InstitutionID = i.InstitutionID
            ${institutionFilter}
        `;
        const [totalResult] = await db.query(countQuery, queryParams);
        const totalGroups = totalResult[0].total;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        const groupsQuery = `
            SELECT
                sg.GroupID, sg.GroupName, sg.AcademicYear, sg.Description, sg.IsActive, sg.CreatedAt, sg.UpdatedAt,
                i.InstitutionID
            FROM StudentGroups sg
            JOIN Institutions i ON sg.InstitutionID = i.InstitutionID
            ${institutionFilter}
            ORDER BY sg.${safeSortBy} ${safeSortOrder}
            LIMIT ? OFFSET ?
        `;
        queryParams.push(limitNum, offset);
        const [groups] = await db.query(groupsQuery, queryParams);

        // 4. Success Response
        res.status(200).json({
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalGroups: totalGroups,
                totalPages: Math.ceil(totalGroups / limitNum)
            },
            groups
        });
    } catch (error) {
        console.error('Error al obtener los grupos de estudiantes:', error);
        next(error);
    }
};

// --- UPDATE GROUP (PUT /api/student-groups/:id) ---
exports.updateStudentGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const user = req.user;
    const { groupName, academicYear, description, isActive } = req.body;

    try {
        // 1. Authorization (Only AdminInstitucion can update groups)
        const authorized = await checkGroupScope(groupId, user);
        if (!authorized || user.roleName !== 'AdminInstitucion') {
            return res.status(403).json({ 
                message: 'No tiene permiso para actualizar este grupo.'
            });
        }

        // 2. Validate at least one field is provided
        if (!groupName && !academicYear && description === undefined && isActive === undefined) {
            return res.status(400).json({ 
                message: 'Se requiere al menos un campo para actualizar.'
            });
        }

        // 3. Update the group
        const updateQuery = `
            UPDATE StudentGroups 
            SET 
                GroupName = COALESCE(?, GroupName),
                AcademicYear = COALESCE(?, AcademicYear),
                Description = COALESCE(?, Description),
                IsActive = COALESCE(?, IsActive)
            WHERE GroupID = ?
        `;
        const [result] = await db.query(updateQuery, [
            groupName || null,
            academicYear || null,
            description !== undefined ? description : null,
            isActive !== undefined ? isActive : null,
            groupId
        ]);

        // 4. Check if update was successful
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Grupo no encontrado o no hubo cambios que guardar.'
            });
        }

        // 5. Return the updated group
        const getGroupQuery = 'SELECT * FROM StudentGroups WHERE GroupID = ?';
        const [updatedGroup] = await db.query(getGroupQuery, [groupId]);

        res.status(200).json({
            message: 'Grupo actualizado exitosamente',
            group: updatedGroup[0]
        });

    } catch (error) {
        console.error('Error al actualizar el grupo:', error);
        next(error);
    }
};

// --- NEW: ASSIGN STUDENTS TO GROUP (POST /api/student-groups/:groupId/members) ---
exports.assignStudentsToGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const { studentIds } = req.body; // Expecting an array of student IDs
    const user = req.user; // Should be AdminInstitucion

    // 1. Authorization (Only AdminInstitucion of THIS group can assign)
    const authorized = await checkGroupScope(groupId, user);
    if (!authorized || user.roleName !== 'AdminInstitucion') {
        return res.status(403).json({ message: 'No tiene permiso para modificar los miembros de este grupo.' });
    }
    const institutionId = user.institutionId; // Admin's institution

    // 2. Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: 'Se requiere un array `studentIds` con al menos un ID de estudiante.' });
    }
    // Ensure all student IDs are numbers (or convert them)
    const numericStudentIds = studentIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (numericStudentIds.length !== studentIds.length) {
        return res.status(400).json({ message: 'Todos los studentIds deben ser números válidos.' });
    }
    if (numericStudentIds.length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron IDs de estudiante válidos.' });
    }

    // Use a transaction to ensure all checks and inserts happen atomically
    const connection = await db.getConnection(); // Get a connection from the pool
    try {
        await connection.beginTransaction();

        // 3. Verify all students belong to the Admin's institution and exist
        // Create placeholders for the IN clause (?, ?, ?)
        const placeholders = numericStudentIds.map(() => '?').join(',');
        const verifyStudentsQuery = `
            SELECT StudentID, InstitutionID
            FROM Students
            WHERE StudentID IN (${placeholders})
        `;
        const [studentsData] = await connection.query(verifyStudentsQuery, numericStudentIds);

        // Check if all requested students were found and belong to the correct institution
        if (studentsData.length !== numericStudentIds.length) {
            await connection.rollback(); // Abort transaction
            return res.status(400).json({ message: 'Uno o más IDs de estudiante no fueron encontrados.' });
        }
        const wrongInstitution = studentsData.some(student => student.InstitutionID !== institutionId);
        if (wrongInstitution) {
            await connection.rollback(); // Abort transaction
            return res.status(403).json({ message: 'Uno o más estudiantes no pertenecen a su institución.' });
        }

        // 4. Prepare data for insertion (StudentID, GroupID)
        // Use INSERT IGNORE to avoid errors if a student is already in the group
        const insertQuery = `
            INSERT IGNORE INTO StudentGroupMembers (StudentID, GroupID, AssignmentDate) VALUES ?
        `;
        const values = numericStudentIds.map(studentId => [studentId, parseInt(groupId, 10), new Date()]);

        // 5. Execute Insert
        const [result] = await connection.query(insertQuery, [values]);

        await connection.commit(); // Commit transaction

        // 6. Success Response
        console.log(`Asignación a Grupo ID: ${groupId}. ${result.affectedRows} filas afectadas (nuevas asignaciones: ${result.affectedRows - result.warningStatus}). Por Usuario ID: ${user.userId}`); // warningStatus counts ignored rows
         let message = `${result.affectedRows - result.warningStatus} estudiante(s) asignado(s) exitosamente al grupo ${groupId}.`;
         if (result.warningStatus > 0) {
             message += ` ${result.warningStatus} estudiante(s) ya pertenecían al grupo.`;
         }

        res.status(200).json({ // 200 OK is fine for adding items to a sub-collection
            message: message
        });

    } catch (error) {
        await connection.rollback(); // Rollback on any error
        console.error(`Error al asignar estudiantes al grupo ${groupId}:`, error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') { // FK violation (bad groupID or studentID after check - less likely)
           return res.status(400).json({ message: 'Error de referencia: El grupo o uno de los estudiantes no existe.' });
        }
        next(error);
    } finally {
         connection.release(); // Always release connection back to the pool
    }
};

// --- NEW: REMOVE STUDENT FROM GROUP (DELETE /api/student-groups/:groupId/members/:studentId) ---
exports.removeStudentFromGroup = async (req, res, next) => {
    const { groupId, studentId } = req.params;
    const user = req.user;

    // 1. Authorization (Only AdminInstitucion of THIS group can remove)
    const authorized = await checkGroupScope(groupId, user);
    
    // 2. Validate numeric IDs
    const numericGroupId = parseInt(groupId, 10);
    const numericStudentId = parseInt(studentId, 10);
    
    if (isNaN(numericGroupId) || isNaN(numericStudentId)) {
        return res.status(400).json({ 
            message: 'El groupId y studentId deben ser números válidos.'
        });
    }

    if (!authorized || user.roleName !== 'AdminInstitucion') {
        return res.status(403).json({ 
            message: 'No tiene permiso para modificar los miembros de este grupo.'
        });
    }

    try {
        // 3. Execute Delete
        const deleteQuery = 'DELETE FROM StudentGroupMembers WHERE GroupID = ? AND StudentID = ?';
        const [result] = await db.query(deleteQuery, [numericGroupId, numericStudentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'El estudiante no pertenece a este grupo.'
            });
        }

        // 4. Success Response
        console.log(`Estudiante ID: ${numericStudentId} eliminado del Grupo ID: ${numericGroupId} por Usuario ID: ${user.userId}`);
        res.status(200).json({ 
            message: 'Estudiante eliminado del grupo exitosamente.'
        });

    } catch (error) {
        console.error(`Error al eliminar estudiante ${numericStudentId} del grupo ${numericGroupId}:`, error);
        next(error);
    }
};


// --- NEW: GET GROUP MEMBERS (GET /api/student-groups/:groupId/members) ---
exports.getGroupMembers = async (req, res, next) => {
    const { groupId } = req.params;
    const user = req.user;
    const { page = 1, limit = 20, sortBy = 'LastName', sortOrder = 'ASC' } = req.query; // Pagination added

    try {
        // 1. Authorization (Who can view members? Admins + Teacher of the institution)
        const authorized = await checkGroupScope(groupId, user);
        if (!authorized) {
            return res.status(404).json({ message: 'Grupo no encontrado o sin permiso para verlo.' }); // Mask existence
        }

        // 2. Fetch Members with Pagination
        const countQuery = 'SELECT COUNT(*) as total FROM StudentGroupMembers WHERE GroupID = ?';
        const [totalResult] = await db.query(countQuery, [groupId]);
        const totalMembers = totalResult[0].total;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        const allowedSortBy = ['StudentID', 'StudentUniqueID', 'FirstName', 'LastName', 'Status', 'AssignmentDate'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'LastName';
        const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        let orderByClause = '';
        if (safeSortBy === 'AssignmentDate') {
             orderByClause = `ORDER BY sgm.AssignmentDate ${safeSortOrder}`;
        } else {
             orderByClause = `ORDER BY s.${safeSortBy} ${safeSortOrder}`;
        }


        const membersQuery = `
            SELECT
                s.StudentID, s.StudentUniqueID, s.FirstName, s.LastName, s.Gender, s.Status, sgm.AssignmentDate
            FROM Students s
            JOIN StudentGroupMembers sgm ON s.StudentID = sgm.StudentID
            WHERE sgm.GroupID = ?
            ${orderByClause}
            LIMIT ? OFFSET ?
        `;
        const [members] = await db.query(membersQuery, [groupId, limitNum, offset]);

        // 3. Success Response
        res.status(200).json({
             pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalMembers: totalMembers,
                totalPages: Math.ceil(totalMembers / limitNum)
            },
            members
        });

    } catch (error) {
        console.error(`Error al obtener miembros del grupo ${groupId}:`, error);
        next(error);
    }
};

// --- NEW: GET STUDENT'S GROUP (GET /api/student-groups/:studentId/group) ---
exports.getStudentGroup = async (req, res, next) => {
    const { studentId } = req.params;
    const user = req.user;

    try {
        // 1. Validate numeric studentId
        const numericStudentId = parseInt(studentId, 10);
        if (isNaN(numericStudentId)) {
            return res.status(400).json({ message: 'El studentId debe ser un número válido.' });
        }

        // 2. Fetch the group the student belongs to
        const query = `
            SELECT 
                sg.GroupID, sg.GroupName, sg.AcademicYear, sg.Description, sg.IsActive, sg.CreatedAt, sg.UpdatedAt
            FROM StudentGroupMembers sgm
            JOIN StudentGroups sg ON sgm.GroupID = sg.GroupID
            WHERE sgm.StudentID = ?
        `;
        const [groups] = await db.query(query, [numericStudentId]);

        if (groups.length === 0) {
            return res.status(404).json({ message: 'El estudiante no pertenece a ningún grupo.' });
        }

        // 3. Authorization (Only users with access to the group can view it)
        const authorized = await checkGroupScope(groups[0].GroupID, user);
        if (!authorized) {
            return res.status(403).json({ message: 'No tiene permiso para ver el grupo de este estudiante.' });
        }

        // 4. Success Response
        res.status(200).json({
            message: 'Grupo del estudiante obtenido exitosamente.',
            group: groups[0]
        });

    } catch (error) {
        console.error(`Error al obtener el grupo del estudiante ${studentId}:`, error);
        next(error);
    }
};