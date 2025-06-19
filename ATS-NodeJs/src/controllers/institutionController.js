// src/controllers/institutionController.js
const db = require('../config/database');

// Helper function to check if an Institution belongs to the user's scope (District or if user is Ministry)
// Returns true if authorized, false otherwise.
const checkScope = async (institutionId, user) => {
    if (user.isMinistryUser || user.roleName === 'AdminApp') {
        return true; // AdminApp y Ministry pueden acceder a cualquier institución
    }
    if (user.roleName === 'AdminDistrito' && user.districtId) {
        const [instData] = await db.query('SELECT DistrictID FROM Institutions WHERE InstitutionID = ?', [institutionId]);
        return instData.length > 0 && instData[0].DistrictID === user.districtId;
    }
    if (user.roleName === 'AdminInstitucion' && user.institutionId) {
        // Institution admin can only access their OWN institution ID
        // Convert institutionId from param (string) to number for comparison
        return parseInt(institutionId, 10) === user.institutionId;
    }
    // Other roles (Profesor etc.) don't have general access by default via this check
    return false;
};

// --- CREATE (POST /api/institutions) ---
exports.createInstitution = async (req, res, next) => {
    const { name, districtId, address, subscriptionStatus, configurationData } = req.body;
    const creator = req.user; // From 'protect' middleware

    // 1. Validation
    if (!name || !districtId) {
        return res.status(400).json({ message: 'Nombre y DistrictID son requeridos.' });
    }

    try {
        // 2. Authorization Check (Who can create?)
        if (creator.roleName === 'AdminDistrito') {
            // District Admin can only create within their own district
            if (parseInt(districtId, 10) !== creator.districtId) {
                return res.status(403).json({ message: 'AdminDistrito solo puede crear instituciones en su propio distrito.' });
            }
        } else if (creator.roleName !== 'AdminApp' && !creator.isMinistryUser) {
            // Only Ministry, AdminApp and District Admins can create
            return res.status(403).json({ message: 'No tiene permiso para crear instituciones.' });
        }

        // 3. Verify District Exists
        const [districtExists] = await db.query('SELECT DistrictID FROM Districts WHERE DistrictID = ?', [districtId]);
        if (districtExists.length === 0) {
            return res.status(400).json({ message: `Distrito con ID ${districtId} no encontrado.` });
        }

        // 4. Insert Institution
        const insertQuery = `
            INSERT INTO Institutions (Name, DistrictID, Address, SubscriptionStatus, ConfigurationData)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(insertQuery, [
            name,
            parseInt(districtId, 10),
            address || null,
            subscriptionStatus || 'Active',
            configurationData ? JSON.stringify(configurationData) : null // Store JSON as string
        ]);

        // 5. Success Response
        const newInstitutionId = result.insertId;
        console.log(`Institución creada ID: ${newInstitutionId} por Usuario ID: ${creator.userId}`);
        res.status(201).json({
            message: 'Institución creada exitosamente.',
            institution: {
                institutionId: newInstitutionId,
                name,
                districtId: parseInt(districtId, 10),
                address,
                subscriptionStatus: subscriptionStatus || 'Active'
            }
        });

    } catch (error) {
        console.error("Error al crear institución:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Conflicto: Posible institución duplicada.' });
        }
        next(error); // Pass to global error handler
    }
};

// --- READ ALL (GET /api/institutions) ---
exports.getAllInstitutions = async (req, res, next) => {
    const user = req.user;
    let institutions = [];

    try {
        let query = `
            SELECT 
                i.InstitutionID, 
                i.Name, 
                d.\`Regional-District_Code\` AS RegionalDistrictCode, 
                i.Address, 
                i.SubscriptionStatus 
            FROM Institutions i
            JOIN Districts d ON i.DistrictID = d.DistrictID
        `;
        const queryParams = [];

        // Authorization Check
        if (user.roleName === 'AdminDistrito' && user.districtId) {
            query += ' WHERE i.DistrictID = ?';
            queryParams.push(user.districtId);
        } else if (user.roleName === 'AdminApp' || user.roleName === 'AdminMinisterio') {
            // AdminApp and AdminMinisterio can view all institutions
            query = `
                SELECT 
                    i.InstitutionID, 
                    i.Name, 
                    d.\`Regional-District_Code\` AS RegionalDistrictCode, 
                    i.Address, 
                    i.SubscriptionStatus 
                FROM Institutions i
                JOIN Districts d ON i.DistrictID = d.DistrictID
            `;
        } else {
            // Other roles are not authorized
            return res.status(403).json({ message: 'Acceso prohibido: No tiene los permisos necesarios para realizar esta acción.' });
        }

        query += ' ORDER BY i.Name ASC';

        [institutions] = await db.query(query, queryParams);

        res.status(200).json({ institutions });

    } catch (error) {
        console.error("Error al obtener instituciones:", error);
        next(error);
    }
};

// --- READ ONE (GET /api/institutions/:id) ---
exports.getInstitutionById = async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;

    try {
        // 1. Fetch institution data
        const query = 'SELECT InstitutionID, Name, DistrictID, Address, SubscriptionStatus, ConfigurationData, CreatedAt, UpdatedAt FROM Institutions WHERE InstitutionID = ?';
        const [institutions] = await db.query(query, [id]);

        if (institutions.length === 0) {
            return res.status(404).json({ message: 'Institución no encontrada.' });
        }

        const institution = institutions[0];

        // 2. Authorization Check (using helper function)
        const authorized = await checkScope(institution.InstitutionID, user);
        if (!authorized) {
            if (user.roleName === 'AdminInstitucion') {
                return res.status(404).json({ message: 'Institución no encontrada.' }); // Masking: pretend it doesn't exist for them
            }
            if (user.roleName !== 'AdminApp') {
                return res.status(403).json({ message: 'No tiene permiso para ver esta institución.' });
            }
        }

        // 3. Success Response (maybe hide ConfigurationData based on role?)
        // Example: Hide config unless Ministry or Admin of that specific institution
        if (user.roleName !== 'AdminInstitucion' && !user.isMinistryUser && user.roleName !== 'AdminApp') {
            delete institution.ConfigurationData;
        }

        res.status(200).json({ institution });

    } catch (error) {
        console.error(`Error al obtener institución ${id}:`, error);
        next(error);
    }
};

// --- UPDATE (PUT /api/institutions/:id) ---
exports.updateInstitution = async (req, res, next) => {
    const { id } = req.params;
    const { name, districtId, address, subscriptionStatus, configurationData } = req.body;
    const user = req.user;

    // 1. Basic Validation
    if (!name && !districtId && !address && !subscriptionStatus && !configurationData) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar.' });
    }

    try {
        // 2. Authorization Check (Who can update? Ministry or relevant District Admin)
        const authorized = await checkScope(id, user);
        if (!authorized || user.roleName === 'AdminInstitucion') {
            if (user.roleName !== 'AdminApp') {
                return res.status(403).json({ message: 'No tiene permiso para actualizar esta institución.' });
            }
        }

        // If it's District Admin, they cannot change the districtId
        if (user.roleName === 'AdminDistrito' && districtId && parseInt(districtId, 10) !== user.districtId) {
            return res.status(403).json({ message: 'AdminDistrito no puede cambiar el distrito de una institución.' });
        }

        // Ensure target district exists if provided
        if (districtId) {
            const [districtExists] = await db.query('SELECT DistrictID FROM Districts WHERE DistrictID = ?', [districtId]);
            if (districtExists.length === 0) {
                return res.status(400).json({ message: `Distrito con ID ${districtId} no encontrado.` });
            }
        }

        // 3. Construct Update Query Dynamically (only update provided fields)
        let updateQuery = 'UPDATE Institutions SET ';
        const queryParams = [];
        const updateFields = [];

        if (name) {
            updateFields.push('Name = ?');
            queryParams.push(name);
        }
        // Only Ministry or AdminApp can change DistrictID
        if (districtId && (user.isMinistryUser || user.roleName === 'AdminApp')) {
            updateFields.push('DistrictID = ?');
            queryParams.push(parseInt(districtId, 10));
        }
        if (address !== undefined) {
            updateFields.push('Address = ?');
            queryParams.push(address);
        }
        if (subscriptionStatus) {
            updateFields.push('SubscriptionStatus = ?');
            queryParams.push(subscriptionStatus);
        }
        if (configurationData) {
            updateFields.push('ConfigurationData = ?');
            queryParams.push(JSON.stringify(configurationData));
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No hay campos válidos para actualizar o no tiene permiso para modificarlos.' });
        }

        updateQuery += updateFields.join(', ');
        updateQuery += ', UpdatedAt = CURRENT_TIMESTAMP WHERE InstitutionID = ?';
        queryParams.push(id);

        // 4. Execute Update
        const [result] = await db.query(updateQuery, queryParams);

        // 5. Check if update was successful
        if (result.affectedRows === 0) {
            const [checkExists] = await db.query('SELECT InstitutionID FROM Institutions WHERE InstitutionID = ?', [id]);
            if (checkExists.length === 0) {
                return res.status(404).json({ message: 'Institución no encontrada.' });
            } else {
                console.warn(`Institución ${id} no fue actualizada, ¿datos iguales o problema concurrente?`);
                return res.status(200).json({ message: 'Institución no actualizada (posiblemente sin cambios).' });
            }
        }

        // 6. Success Response
        console.log(`Institución actualizada ID: ${id} por Usuario ID: ${user.userId}`);
        const [updatedInstitution] = await db.query('SELECT InstitutionID, Name, DistrictID, Address, SubscriptionStatus FROM Institutions WHERE InstitutionID = ?', [id]);

        res.status(200).json({
            message: 'Institución actualizada exitosamente.',
            institution: updatedInstitution[0]
        });

    } catch (error) {
        console.error(`Error al actualizar institución ${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Conflicto: Posible nombre duplicado.' });
        }
        next(error);
    }
};

// --- DELETE (DELETE /api/institutions/:id) ---
exports.deleteInstitution = async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;

    try {
        // 1. Authorization Check (Who can delete? Ministry or relevant District Admin)
        const authorized = await checkScope(id, user);
        if (!authorized || user.roleName === 'AdminInstitucion') {
            if (user.roleName !== 'AdminApp') {
                return res.status(403).json({ message: 'No tiene permiso para eliminar esta institución.' });
            }
        }

        // 2. Execute Delete
        const deleteQuery = 'DELETE FROM Institutions WHERE InstitutionID = ?';
        const [result] = await db.query(deleteQuery, [id]);

        // 3. Check Result
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Institución no encontrada.' });
        }

        // 4. Success Response
        console.log(`Institución eliminada ID: ${id} por Usuario ID: ${user.userId}`);
        res.status(200).json({ message: 'Institución eliminada exitosamente.' });

    } catch (error) {
        console.error(`Error al eliminar institución ${id}:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            console.warn(`Intento de eliminar Institución ${id} fallido debido a registros dependientes.`);
            return res.status(409).json({ message: 'No se puede eliminar la institución porque tiene registros asociados (grupos, asistencia, etc.). Elimine primero los registros dependientes.' });
        }
        next(error);
    }
};
