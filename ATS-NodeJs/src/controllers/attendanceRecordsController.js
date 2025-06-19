// src/controllers/attendanceRecordsController.js
const db = require('../config/database');

// Helper function to check if user has scope over attendance records
const checkAttendanceScope = async (studentId, user) => {
    try {
        // Get institution ID from student
        const [studentData] = await db.query(
            'SELECT InstitutionID FROM Students WHERE StudentID = ?',
            [studentId]
        );

        if (!studentData || studentData.length === 0) {
            return { authorized: false, institutionId: null };
        }

        const institutionId = studentData[0].InstitutionID;

        if (user.isMinistryUser) {
            return { authorized: true, institutionId };
        }

        if (user.roleName === 'AdminInstitucion' && user.institutionId) {
            return {
                authorized: institutionId === user.institutionId,
                institutionId
            };
        }

        if (user.roleName === 'AdminDistrito' && user.districtId) {
            const [instData] = await db.query(
                'SELECT DistrictID FROM Institutions WHERE InstitutionID = ?',
                [institutionId]
            );
            return {
                authorized: instData.length > 0 && instData[0].DistrictID === user.districtId,
                institutionId
            };
        }

        if (user.roleName === 'Profesor' && user.institutionId) {
            return {
                authorized: institutionId === user.institutionId,
                institutionId
            };
        }

        return { authorized: false, institutionId };
    } catch (error) {
        console.error('Error checking attendance scope:', error);
        return { authorized: false, institutionId: null };
    }
};

// --- CREATE ATTENDANCE RECORD (POST /api/attendances) ---
exports.createAttendanceRecord = async (req, res, next) => {
    const { studentId, attendanceType = 'Entrada', notes } = req.body;
    const user = req.user;

    try {
        // Authorization check
        const { authorized, institutionId } = await checkAttendanceScope(studentId, user);
        if (!authorized || user.roleName !== 'AdminInstitucion' && user.roleName !== 'Profesor') {
            return res.status(403).json({ message: 'No tiene permiso para registrar asistencia.' });
        }

        // Validate studentId
        if (isNaN(studentId)) {
            return res.status(400).json({ message: 'El studentId debe ser un número válido.' });
        }

        // Check if student exists in the institution
        const [studentExists] = await db.query(
            'SELECT StudentID FROM Students WHERE StudentID = ? AND InstitutionID = ?',
            [studentId, institutionId]
        );

        if (studentExists.length === 0) {
            return res.status(404).json({ message: 'Estudiante no encontrado en la institución.' });
        }

        // Check for existing record today
        const [existingRecord] = await db.query(
            'SELECT RecordID FROM AttendanceRecords ' +
            'WHERE StudentID = ? AND AttendanceDate = CURRENT_DATE()',
            [studentId]
        );

        if (existingRecord.length > 0) {
            return res.status(400).json({ message: 'Registro de asistencia ya existe para hoy.' });
        }

        // Insert new record
        const insertQuery = `
            INSERT INTO AttendanceRecords 
            (StudentID, InstitutionID, GroupID, AttendanceTimestamp, 
             AttendanceDate, RecordedByUserID, AttendanceType, Notes)
            VALUES (?, ?, 
                    (SELECT GroupID FROM StudentGroupMembers WHERE StudentID = ? ORDER BY GroupID LIMIT 1),
                    CURRENT_TIMESTAMP(),
                    CURRENT_DATE(),
                    ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
            studentId,
            institutionId,
            studentId,
            user?.userId || null,
            attendanceType,
            notes || null
        ]);

        res.status(201).json({
            message: 'Registro de asistencia creado exitosamente.',
            attendanceRecord: {
                recordId: result.insertId,
                studentId,
                institutionId,
                attendanceType,
                notes,
                attendanceTimestamp: new Date().toISOString(),
                attendanceDate: new Date().toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('Error creating attendance record:', error);
        next(error);
    }
};

// --- GET ALL ATTENDANCE RECORDS (GET /api/attendances) ---
exports.getAllAttendanceRecords = async (req, res, next) => {
    const user = req.user;
    const { page = 1, limit = 20, sortBy = 'AttendanceTimestamp', sortOrder = 'DESC', 
          startDate, endDate, studentId } = req.query;

    try {
        // Base query
        let query = `
            SELECT 
                ar.RecordID,
                ar.StudentID,
                ar.AttendanceTimestamp,
                ar.AttendanceDate,
                ar.AttendanceType,
                ar.Notes,
                ar.CreatedAt,
                s.StudentUniqueID,
                s.FirstName,
                s.LastName
            FROM AttendanceRecords ar
            JOIN Students s ON ar.StudentID = s.StudentID
            WHERE ar.InstitutionID = ?
        `;

        
        const queryParams = [user.institutionId];

        // Apply filters
        const conditions = [];
        if (startDate) conditions.push(`ar.AttendanceDate >= ?`);
        if (endDate) conditions.push(`ar.AttendanceDate <= ?`);
        if (studentId) conditions.push(`ar.StudentID = ?`);

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
            if (startDate) queryParams.push(startDate);
            if (endDate) queryParams.push(endDate);
            if (studentId) queryParams.push(studentId);
        }

        

        // Ordering
        const allowedSortBy = ['RecordID', 'AttendanceTimestamp', 'AttendanceDate', 'StudentID'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'AttendanceTimestamp';
        const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

       
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(limitNum, offset);

        // Count total records
        const countQuery = `
            SELECT COUNT(*) as total
            FROM AttendanceRecords ar
            JOIN Students s ON ar.StudentID = s.StudentID
            WHERE ar.InstitutionID = ?
            ${conditions.length > 0 ? ' AND ' + conditions.join(' AND ') : ''}
        `;
        const countQueryParams = [user.institutionId];
        if (startDate) countQueryParams.push(startDate);
        if (endDate) countQueryParams.push(endDate);
        if (studentId) countQueryParams.push(studentId);

        const [totalResult] = await db.query(countQuery, countQueryParams);

        

        // Get records
        const [records] = await db.query(query, queryParams);


        
        /* Devolver 404 si no hay registros
        if (records.length === 0) {
            return res.status(404).json({ message: 'No se encontraron registros de asistencia.' });
        } */

        res.status(200).json({
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalRecords: totalResult[0].total,
                totalPages: Math.ceil(totalResult[0].total / limitNum)
            },
            attendanceRecords: records
        });

    } catch (error) {
        console.error('Error getting attendance records:', error);
        next(error);
    }
};

// --- GET ATTENDANCE RECORDS BY STUDENT (GET /api/attendances/:studentId) ---
exports.getAttendanceRecordsByStudentId = async (req, res, next) => {
    const { studentId } = req.params;
    const user = req.user;
    const { page = 1, limit = 20, sortBy = 'AttendanceTimestamp', sortOrder = 'DESC' } = req.query;

    try {
        // Authorization check
        const { authorized, institutionId } = await checkAttendanceScope(studentId, user);
        if (!authorized) {
            return res.status(403).json({ message: 'No tiene permiso para ver estos registros.' });
        }

        // Base query
        let query = `
            SELECT 
                ar.RecordID,
                ar.StudentID,
                ar.AttendanceTimestamp,
                ar.AttendanceDate,
                ar.AttendanceType,
                ar.Notes,
                ar.CreatedAt
            FROM AttendanceRecords ar
            WHERE ar.StudentID = ? AND ar.InstitutionID = ?
        `;

        const queryParams = [studentId, institutionId];

        // Ordering
        const allowedSortBy = ['RecordID', 'AttendanceTimestamp', 'AttendanceDate'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'AttendanceTimestamp';
        const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(limitNum, offset);

        // Count total records
        const countQuery = 'SELECT COUNT(*) as total FROM AttendanceRecords WHERE StudentID = ? AND InstitutionID = ?';
        const [totalResult] = await db.query(countQuery, [studentId, institutionId]);

        // Get records
        const [records] = await db.query(query, queryParams);

        res.status(200).json({
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalRecords: totalResult[0].total,
                totalPages: Math.ceil(totalResult[0].total / limitNum)
            },
            attendanceRecords: records
        });

    } catch (error) {
        console.error(`Error getting attendance records for student ${studentId}:`, error);
        next(error);
    }
};

// --- UPDATE ATTENDANCE RECORD (PUT /api/attendances/:recordId) ---
exports.updateAttendanceRecord = async (req, res, next) => {
    const { recordId } = req.params;
    const { attendanceType, notes } = req.body;
    const user = req.user;

    try {
        // Authorization check
        const [studentData] = await db.query(
            'SELECT StudentID FROM AttendanceRecords WHERE RecordID = ?',
            [recordId]
        );

        if (studentData.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado.' });
        }

        const { authorized, institutionId } = await checkAttendanceScope(studentData[0].StudentID, user);
        if (!authorized || user.roleName !== 'AdminInstitucion' && user.roleName !== 'Profesor') {
            return res.status(403).json({ message: 'No tiene permiso para modificar este registro.' });
        }

        // Update record
        const updateQuery = `
            UPDATE AttendanceRecords 
            SET AttendanceType = ?, 
                Notes = ?, 
                UpdatedAt = CURRENT_TIMESTAMP
            WHERE RecordID = ?
        `;

        const [result] = await db.query(updateQuery, [attendanceType, notes, recordId]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'No se han detectado cambios.' });
        }

        res.status(200).json({
            message: 'Registro de asistencia actualizado exitosamente.',
            attendanceRecord: await getAttendanceRecord(recordId)
        });

    } catch (error) {
        console.error(`Error updating attendance record ${recordId}:`, error);
        next(error);
    }
};

// Helper function to get attendance record details
const getAttendanceRecord = async (recordId) => {
    const [record] = await db.query(
        'SELECT * FROM AttendanceRecords WHERE RecordID = ?',
        [recordId]
    );
    return record[0];
};

// --- DELETE ATTENDANCE RECORD (DELETE /api/attendances/:recordId) ---
exports.deleteAttendanceRecord = async (req, res, next) => {
    const { recordId } = req.params;
    const user = req.user;

    try {
        // Authorization check
        const [studentData] = await db.query(
            'SELECT StudentID FROM AttendanceRecords WHERE RecordID = ?',
            [recordId]
        );

        if (studentData.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado.' });
        }

        const { authorized, institutionId } = await checkAttendanceScope(studentData[0].StudentID, user);
        if (!authorized || user.roleName !== 'AdminInstitucion' && user.roleName !== 'Profesor') {
            return res.status(403).json({ message: 'No tiene permiso para eliminar este registro.' });
        }

        // Delete record
        const deleteQuery = 'DELETE FROM AttendanceRecords WHERE RecordID = ?';
        const [result] = await db.query(deleteQuery, [recordId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Registro no encontrado.' });
        }

        res.status(200).json({ message: 'Registro de asistencia eliminado exitosamente.' });

    } catch (error) {
        console.error(`Error deleting attendance record ${recordId}:`, error);
        next(error);
    }
};
