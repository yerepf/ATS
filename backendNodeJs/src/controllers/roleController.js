// src/controllers/roleController.js
const db = require('../config/database');

exports.createRole = async (req, res, next) => {
    try {
        const { roleName, description } = req.body;

        // Validar que el roleName es único y cumple con el formato
        const roleNameRegex = /^[a-zA-Z0-9_]+$/; // Permitir solo alfanuméricos y guiones bajos
        if (!roleName || !roleNameRegex.test(roleName)) {
            return res.status(400).json({ 
                message: 'El nombre del rol debe ser alfanumérico y único.'
            });
        }

        // Verificar si el rol ya existe
        const [existingRole] = await db.query(
            'SELECT RoleID FROM Roles WHERE RoleName = ?',
            [roleName]
        );

        if (existingRole.length > 0) {
            return res.status(409).json({ 
                message: 'El nombre del rol ya está en uso.'
            });
        }

        // Insertar nuevo rol
        const insertQuery = `
            INSERT INTO Roles 
            (RoleName, Description, IsActive)
            VALUES (?, ?, ?)
        `;
        
        const result = await db.query(insertQuery, [
            roleName,
            description || null,
            true
        ]);

        res.status(201).json({
            message: 'Rol creado exitosamente.',
            role: {
                roleId: result.insertId,
                roleName,
                description: description || null,
                isActive: true
            }
        });

    } catch (error) {
        console.error('Error al crear rol:', error);
        next(error);
    }
};

exports.getAllRoles = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10 } = req.query;

        let query = `
            SELECT 
                r.RoleID AS roleId,
                r.RoleName AS roleName,
                r.Description AS description,
                r.IsActive AS isActive
            FROM Roles r
        `;

        let queryParams = [];

        // Paginación
        const offset = (page - 1) * pageSize;
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(pageSize);
        queryParams.push(offset);

        const [roles] = await db.query(query, queryParams);

        // Obtener total de roles para paginación
        const countQuery = 'SELECT COUNT(*) as total FROM Roles';
        const [total] = await db.query(countQuery);

        res.status(200).json({
            message: 'Roles obtenidos exitosamente.',
            roles: roles,
            pagination: {
                page,
                pageSize,
                total: total[0].total
            }
        });

    } catch (error) {
        console.error('Error al obtener roles:', error);
        next(error);
    }
};

exports.getRoleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (isNaN(id)) {
            return res.status(400).json({ 
                message: 'El ID del rol debe ser un número válido.'
            });
        }

        const [role] = await db.query(
            'SELECT * FROM Roles WHERE RoleID = ?',
            [parseInt(id)]
        );

        if (role.length === 0) {
            return res.status(404).json({ 
                message: 'Rol no encontrado.'
            });
        }

        res.status(200).json({
            message: 'Rol obtenido exitosamente.',
            role: role[0]
        });

    } catch (error) {
        console.error('Error al obtener rol:', error);
        next(error);
    }
};

exports.updateRole = async (req, res, next) => {
    try {
        const roleId = parseInt(req.params.id);
        const { roleName, description, isActive } = req.body;

        if (isNaN(roleId)) {
            return res.status(400).json({ 
                message: 'El ID del rol debe ser un número válido.'
            });
        }

        // Verificar si existe el rol
        const [role] = await db.query(
            'SELECT * FROM Roles WHERE RoleID = ?',
            [roleId]
        );

        if (role.length === 0) {
            return res.status(404).json({ 
                message: 'Rol no encontrado.'
            });
        }

        const updatedData = {};

        if (roleName) {
            // Verificar formato del roleName
            const roleNameRegex = /^[a-zA-Z0-9_]+$/;
            if (!roleNameRegex.test(roleName)) {
                return res.status(400).json({ 
                    message: 'El nombre del rol debe ser alfanumérico.'
                });
            }

            // Verificar disponibilidad del roleName
            const [existingRole] = await db.query(
                'SELECT RoleID FROM Roles WHERE RoleName = ? AND RoleID != ?',
                [roleName, roleId]
            );

            if (existingRole.length > 0) {
                return res.status(409).json({ 
                    message: 'El nombre del rol ya está en uso.'
                });
            }

            updatedData.RoleName = roleName;
        }

        if (description !== undefined) {
            updatedData.Description = description;
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
            'UPDATE Roles SET ? WHERE RoleID = ?',
            [updatedData, roleId]
        );

        res.status(200).json({
            message: 'Rol actualizado exitosamente.',
            role: {
                ...role[0],
                ...updatedData
            }
        });

    } catch (error) {
        console.error('Error al actualizar rol:', error);
        next(error);
    }
};

exports.deleteRole = async (req, res, next) => {
    try {
        const roleId = parseInt(req.params.id);

        if (isNaN(roleId)) {
            return res.status(400).json({ 
                message: 'El ID del rol debe ser un número válido.'
            });
        }

        // Verificar si existe el rol
        const [role] = await db.query(
            'SELECT * FROM Roles WHERE RoleID = ?',
            [roleId]
        );

        if (role.length === 0) {
            return res.status(404).json({ 
                message: 'Rol no encontrado.'
            });
        }

        // Eliminar el rol
        await db.query(
            'DELETE FROM Roles WHERE RoleID = ?',
            [roleId]
        );

        res.status(200).json({
            message: 'Rol eliminado exitosamente.',
            role: role[0]
        });

    } catch (error) {
        console.error('Error al eliminar rol:', error);
        next(error);
    }
};
