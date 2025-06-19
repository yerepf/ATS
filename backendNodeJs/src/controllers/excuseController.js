// src/controllers/excuseController.js
const db = require('../config/database');

// Helper function to check if user has scope over excuse records
const checkExcuseScope = async (studentId, user) => {
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

        if (user.roleName === 'Profesor' && user.institutionId) {
            return {
                authorized: institutionId === user.institutionId,
                institutionId
            };
        }

        return { authorized: false, institutionId };
    } catch (error) {
        console.error('Error checking excuse scope:', error);
        return { authorized: false, institutionId: null };
    }
};

// --- CREATE EXCUSE RECORD (POST /api/excuses) ---
exports.createExcuseRecord = async (req, res, next) => {
    const { studentId, excuseDate, notes } = req.body;
    const user = req.user;

    try {
        // Authorization check
        const { authorized, institutionId } = await checkExcuseScope(studentId, user);
        if (!authorized || user.roleName !== 'AdminInstitucion' && user.roleName !== 'Profesor') {
            return res.status(403).json({ message: 'No tiene permiso para registrar una excusa.' });
        }

        // Validate studentId
        if (isNaN(studentId)) {
            return res.status(400).json({ message: 'El studentId debe ser un número válido.' });
        }

        // Validate excuseDate
        const date = new Date(excuseDate);
        if (isNaN(date.getTime()) || date.toISOString().split('T')[0] !== excuseDate) {
            return res.status(400).json({ message: 'Fecha de excusa inválida.' });
        }

        // Check if excuse already exists for this student and date
        const [existingExcuse] = await db.query(
            'SELECT ExcuseID FROM DailyExcuses WHERE StudentID = ? AND ExcuseDate = ?',
            [studentId, excuseDate]
        );

        if (existingExcuse.length > 0) {
            return res.status(400).json({ message: 'La excusa para esta fecha ya existe.' });
        }

        // Insert new excuse record
        const insertQuery = `
            INSERT INTO DailyExcuses 
            (StudentID, GroupID, InstitutionID, ExcuseDate, MarkedByUserID, Notes)
            VALUES (?, 
                    (SELECT GroupID FROM StudentGroupMembers WHERE StudentID = ? ORDER BY GroupID LIMIT 1),
                    ?,
                    ?,
                    ?,
                    ?)
        `;

        const [result] = await db.query(insertQuery, [
            studentId,
            studentId,
            institutionId,
            excuseDate,
            user?.userId || null,
            notes || null
        ]);

        res.status(201).json({
            message: 'Excusa registrada exitosamente.',
            excuseRecord: {
                excuseId: result.insertId,
                studentId,
                institutionId,
                excuseDate,
                notes,
                markedByUserId: user?.userId || null,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error creating excuse record:', error);
        next(error);
    }
};

// --- GET ALL EXCUSE RECORDS (GET /api/excuses) ---
exports.getAllExcuseRecords = async (req, res, next) => {
    const user = req.user;
    const { page = 1, limit = 20, sortBy = 'ExcuseDate', sortOrder = 'DESC', 
          startDate, endDate, studentId } = req.query;

    try {
        // Base query
        let query = `
            SELECT 
                de.ExcuseID,
                de.StudentID,
                de.ExcuseDate,
                de.CreatedAt,
                s.StudentUniqueID,
                s.FirstName,
                s.LastName
            FROM DailyExcuses de
            JOIN Students s ON de.StudentID = s.StudentID
            WHERE de.InstitutionID = ?
        `;

        const queryParams = [user.institutionId];

        // Apply filters
        const conditions = [];
        if (startDate) conditions.push(`de.ExcuseDate >= ?`);
        if (endDate) conditions.push(`de.ExcuseDate <= ?`);
        if (studentId) conditions.push(`de.StudentID = ?`);

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
            if (startDate) queryParams.push(startDate);
            if (endDate) queryParams.push(endDate);
            if (studentId) queryParams.push(studentId);
        }

        // Ordering
        const allowedSortBy = ['ExcuseID', 'ExcuseDate', 'StudentID'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'ExcuseDate';
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
            FROM DailyExcuses de
            JOIN Students s ON de.StudentID = s.StudentID
            WHERE de.InstitutionID = ?
            ${conditions.length > 0 ? ' AND ' + conditions.join(' AND ') : ''}
        `;
        const [totalResult] = await db.query(countQuery, [user.institutionId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : []), ...(studentId ? [studentId] : [])]);

        if (!totalResult || totalResult.length === 0) {
            return res.status(200).json({
                pagination: {
                    currentPage: pageNum,
                    limit: limitNum,
                    totalRecords: 0,
                    totalPages: 0
                },
                excuseRecords: []
            });
        }

        // Get records
        const [records] = await db.query(query, queryParams);

        res.status(200).json({
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalRecords: totalResult[0]?.total || 0,
                totalPages: Math.ceil((totalResult[0]?.total || 0) / limitNum)
            },
            excuseRecords: records || []
        });

    } catch (error) {
        console.error('Error getting excuse records:', error);
        next(error);
    }
};

// --- GET EXCUSE RECORD BY STUDENT (GET /api/excuses/:studentId) ---
exports.getExcuseRecordsByStudentId = async (req, res, next) => {
    const { studentId } = req.params;
    const user = req.user;
    const { page = 1, limit = 20, sortBy = 'ExcuseDate', sortOrder = 'DESC' } = req.query;

    try {
        // Authorization check
        const { authorized, institutionId } = await checkExcuseScope(studentId, user);
        if (!authorized || !institutionId) {
            return res.status(403).json({ message: 'No tiene permiso para ver estas excusas o el estudiante no pertenece a su institución.' });
        }

        // Base query
        let query = `
            SELECT 
                de.ExcuseID,
                de.StudentID,
                de.ExcuseDate,
                de.CreatedAt
            FROM DailyExcuses de
            WHERE de.StudentID = ? AND de.InstitutionID = ?
        `;

        const queryParams = [studentId, institutionId];

        // Ordering
        const allowedSortBy = ['ExcuseID', 'ExcuseDate'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'ExcuseDate';
        const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(limitNum, offset);

        // Count total records
        const countQuery = 'SELECT COUNT(*) as total FROM DailyExcuses WHERE StudentID = ? AND InstitutionID = ?';
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
            excuseRecords: records
        });

    } catch (error) {
        console.error(`Error getting excuse records for student ${studentId}:`, error);
        next(error);
    }
};

// --- UPDATE EXCUSE RECORD (PUT /api/excuses/:excuseId) ---
exports.updateExcuseRecord = async (req, res, next) => {
    const { excuseId } = req.params;
    const { isActive, notes } = req.body;
    const user = req.user;

    try {
        // Authorization check
        const [studentData] = await db.query(
            'SELECT StudentID FROM DailyExcuses WHERE ExcuseID = ?',
            [excuseId]
        );

        if (studentData.length === 0) {
            return res.status(404).json({ message: 'Excusa no encontrada.' });
        }

        const { authorized, institutionId } = await checkExcuseScope(studentData[0].StudentID, user);
        if (!authorized || user.roleName !== 'AdminInstitucion' && user.roleName !== 'Profesor') {
            return res.status(403).json({ message: 'No tiene permiso para modificar esta excusa.' });
        }

        // Update record
        const updateQuery = `
            UPDATE DailyExcuses 
            SET IsActive = ?, 
                Notes = ?, 
                UpdatedAt = CURRENT_TIMESTAMP
            WHERE ExcuseID = ?
        `;

        const [result] = await db.query(updateQuery, [isActive, notes, excuseId]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'No se han detectado cambios.' });
        }

        res.status(200).json({
            message: 'Excusa actualizada exitosamente.',
            excuseRecord: await getExcuseRecord(excuseId)
        });

    } catch (error) {
        console.error(`Error updating excuse record ${excuseId}:`, error);
        next(error);
    }
};

// Helper function to get excuse record details
const getExcuseRecord = async (excuseId) => {
    const [record] = await db.query(
        'SELECT * FROM DailyExcuses WHERE ExcuseID = ?',
        [excuseId]
    );
    return record[0];
};

// --- DELETE EXCUSE RECORD (DELETE /api/excuses/:excuseId) ---
exports.deleteExcuseRecord = async (req, res, next) => {
    const { excuseId } = req.params;
    const user = req.user;

    try {
        // Authorization check
        const [studentData] = await db.query(
            'SELECT StudentID FROM DailyExcuses WHERE ExcuseID = ?',
            [excuseId]
        );

        if (studentData.length === 0) {
            return res.status(404).json({ message: 'Excusa no encontrada.' });
        }

        const { authorized, institutionId } = await checkExcuseScope(studentData[0].StudentID, user);
        if (!authorized || user.roleName !== 'AdminInstitucion' && user.roleName !== 'Profesor') {
            return res.status(403).json({ message: 'No tiene permiso para eliminar esta excusa.' });
        }

        // Delete record
        const deleteQuery = 'DELETE FROM DailyExcuses WHERE ExcuseID = ?';
        const [result] = await db.query(deleteQuery, [excuseId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Excusa no encontrada.' });
        }

        res.status(200).json({ message: 'Excusa eliminada exitosamente.' });

    } catch (error) {
        console.error(`Error deleting excuse record ${excuseId}:`, error);
        next(error);
    }
};
