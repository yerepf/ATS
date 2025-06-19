// src/controllers/districtController.js
const db = require('../config/database');

exports.createDistrict = async (req, res, next) => {
    try {
        const creator = req.user;
        
        const { 
            name,
            regionalDistrictCode,
            contactInfo
        } = req.body;

        // Validación básica
        if (!name || !regionalDistrictCode) {
            return res.status(400).json({ 
                message: 'El nombre del distrito y el código regional-distrito son requeridos.'
            });
        }

        // Verificar formato del código regional-distrito (Ej: 10-06)
        const codeFormat = /^\d{2}-\d{2}$/;
        if (!codeFormat.test(regionalDistrictCode)) {
            return res.status(400).json({ 
                message: 'El código regional-distrito debe tener formato XX-XX (Ej: 10-06).'
            });
        }

        // Verificar si el código regional-distrito ya existe
        const [existingDistrict] = await db.query(
            'SELECT DistrictID FROM Districts WHERE \`Regional-District_Code\` = ?',
            [regionalDistrictCode]
        );

        if (existingDistrict.length > 0) {
            return res.status(409).json({ 
                message: 'El código regional-distrito ya está en uso.'
            });
        }

        // Lógica de autorización según el rol del creador
        const authorizedRoles = ['AdminApp', 'AdminMinisterio'];
        if (!authorizedRoles.includes(creator.roleName)) {
            return res.status(403).json({ 
                message: 'No tiene permiso para crear distritos.'
            });
        }

        // Insertar nuevo distrito
        const insertQuery = `
            INSERT INTO Districts 
            (Name, \`Regional-District_Code\`, ContactInfo, IsActive)
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await db.query(insertQuery, [
            name,
            regionalDistrictCode,
            contactInfo || null,
            true
        ]);

        res.status(201).json({
            message: 'Distrito creado exitosamente.',
            district: {
                districtId: result.insertId,
                name,
                regionalDistrictCode,
                contactInfo: contactInfo || null,
                isActive: true
            }
        });

    } catch (error) {
        console.error('Error al crear distrito:', error);
        next(error);
    }
};

exports.getAllDistricts = async (req, res, next) => {
    try {
        const creator = req.user;
        const { page = 1, pageSize = 10 } = req.query;

        let query = `
            SELECT 
            d.DistrictID AS districtId,
            d.Name AS name,
            d.\`Regional-District_Code\` AS regionalDistrictCode,
            d.ContactInfo AS contactInfo,
            d.CreatedAt AS createdAt,
            d.UpdatedAt AS updatedAt,
            d.IsActive AS isActive
            FROM Districts d
        `;

        let queryParams = [];

        // Paginación
        const offset = (page - 1) * pageSize;
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(pageSize);
        queryParams.push(offset);

        const [districts] = await db.query(query, queryParams);

        // Obtener total de distritos para paginación
        const countQuery = 'SELECT COUNT(*) as total FROM Districts';
        const [total] = await db.query(countQuery);

        res.status(200).json({
            message: 'Distritos obtenidos exitosamente.',
            districts: districts,
            pagination: {
                page,
                pageSize,
                total: total[0].total
            }
        });

    } catch (error) {
        console.error('Error al obtener distritos:', error);
        next(error);
    }
};

exports.getDistrictById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const creator = req.user;

        if (isNaN(id)) {
            return res.status(400).json({ 
                message: 'El ID del distrito debe ser un número válido.'
            });
        }

        const [district] = await db.query(
            'SELECT * FROM Districts WHERE DistrictID = ?',
            [parseInt(id)]
        );

        if (district.length === 0) {
            return res.status(404).json({ 
                message: 'Distrito no encontrado.'
            });
        }

        // Verificar permisos
        if (creator.roleName !== 'AdminApp' && 
            district[0].CreatedBy !== creator.userId) {
            return res.status(403).json({ 
                message: 'No tiene permiso para ver este distrito.'
            });
        }

        res.status(200).json({
            message: 'Distrito obtenido exitosamente.',
            district: district[0]
        });

    } catch (error) {
        console.error('Error al obtener distrito:', error);
        next(error);
    }
};

exports.updateDistrict = async (req, res, next) => {
    try {
        const districtId = parseInt(req.params.id);
        const creator = req.user;

        if (isNaN(districtId)) {
            return res.status(400).json({ 
                message: 'El ID del distrito debe ser un número válido.'
            });
        }

        const {
            name,
            regionalDistrictCode,
            contactInfo,
            isActive
        } = req.body;

        // Verificar si existe el distrito
        const [district] = await db.query(
            'SELECT * FROM Districts WHERE DistrictID = ?',
            [districtId]
        );

        if (district.length === 0) {
            return res.status(404).json({ 
                message: 'Distrito no encontrado.'
            });
        }

        // Verificar permisos
        if (creator.roleName !== 'AdminApp' && 
            district[0].CreatedBy !== creator.userId) {
            return res.status(403).json({ 
                message: 'No tiene permiso para actualizar este distrito.'
            });
        }

        const updatedData = {};

        if (name) {
            updatedData.Name = name;
        }

        if (regionalDistrictCode) {
            // Verificar formato del código regional-distrito
            const codeFormat = /^\d{2}-\d{2}$/;
            if (!codeFormat.test(regionalDistrictCode)) {
                return res.status(400).json({ 
                    message: 'El código regional-distrito debe tener formato XX-XX (Ej: 10-06).'
                });
            }

            // Verificar disponibilidad del código
            const [existingCode] = await db.query(
                'SELECT DistrictID FROM Districts WHERE Regional-District_Code = ? AND DistrictID != ?',
                [regionalDistrictCode, districtId]
            );

            if (existingCode.length > 0) {
                return res.status(409).json({ 
                    message: 'El código regional-distrito ya está en uso.'
                });
            }

            updatedData.Regional_District_Code = regionalDistrictCode;
        }

        if (contactInfo !== undefined) {
            updatedData.ContactInfo = contactInfo;
        }

        if (isActive !== undefined) {
            updatedData.IsActive = isActive;
        }

        updatedData.UpdatedAt = new Date();

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({ 
                message: 'No se han proporcionado cambios para aplicar.'
            });
        }

        await db.query(
            'UPDATE Districts SET ? WHERE DistrictID = ?',
            [updatedData, districtId]
        );

        res.status(200).json({
            message: 'Distrito actualizado exitosamente.',
            district: {
                ...district[0],
                ...updatedData
            }
        });

    } catch (error) {
        console.error('Error al actualizar distrito:', error);
        next(error);
    }
};

exports.deleteDistrict = async (req, res, next) => {
    try {
        const districtId = parseInt(req.params.id);
        const creator = req.user;

        if (isNaN(districtId)) {
            return res.status(400).json({ 
                message: 'El ID del distrito debe ser un número válido.'
            });
        }

        // Verificar si existe el distrito
        const [district] = await db.query(
            'SELECT * FROM Districts WHERE DistrictID = ?',
            [districtId]
        );

        if (district.length === 0) {
            return res.status(404).json({ 
                message: 'Distrito no encontrado.'
            });
        }

        // Verificar permisos
        if (creator.roleName !== 'AdminApp' && 
            district[0].CreatedBy !== creator.userId) {
            return res.status(403).json({ 
                message: 'No tiene permiso para eliminar este distrito.'
            });
        }

        // Eliminar el distrito
        await db.query(
            'DELETE FROM Districts WHERE DistrictID = ?',
            [districtId]
        );

        res.status(200).json({
            message: 'Distrito eliminado exitosamente.',
            district: district[0]
        });

    } catch (error) {
        console.error('Error al eliminar distrito:', error);
        next(error);
    }
};
