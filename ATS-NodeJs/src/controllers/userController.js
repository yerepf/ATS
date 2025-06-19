// src/controllers/userController.js
const bcrypt = require('bcrypt');
const db = require('../config/database');
const saltRounds = 10; // Factor de coste para bcrypt

exports.createUser = async (req, res, next) => {
    // Usuario que realiza la acción (obtenido del middleware protect)
    const creator = req.user;

    // Datos del nuevo usuario a crear (del cuerpo de la solicitud)
    const {
        username,
        password,
        firstName,
        lastName,
        email,
        roleId,         // ID del Rol para el nuevo usuario
        institutionId,  // Opcional: ID de Institución si se crea un usuario institucional
        districtId      // Opcional: ID de Distrito si se crea un AdminDistrito
        // isActive se establecerá como TRUE por defecto según la BD
    } = req.body;

    // --- 1. Validación de Entrada Básica ---
    if (!username || !password || !roleId) {
        return res.status(400).json({ message: 'Nombre de usuario, contraseña y rol son requeridos.' });
    }
    if (password.length < 6) { // Ejemplo de validación de contraseña
         return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }


    // --- 2. Lógica de Autorización (Simplificada por ahora) ---
    // ¡Esta lógica debe ser robusta y posiblemente ir en un middleware separado!
    let newUserData = {
        username,
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
        roleId: parseInt(roleId), // Asegurar que sea número
        institutionId: null,
        districtId: null,
        isMinistryUser: false,
        isActive: true // Por defecto activado
    };

    try {
        // Buscar el RoleName para validaciones (y para lógica futura)
        const [roleData] = await db.query('SELECT RoleName FROM Roles WHERE RoleID = ?', [newUserData.roleId]);
        if (roleData.length === 0) {
            return res.status(400).json({ message: `Rol con ID ${newUserData.roleId} no encontrado.` });
        }
        const newRoleName = roleData[0].RoleName;

/* Modificar este switch en caso de introducir roles nuevos en el sistema*/

        // Aplicar reglas según quién crea y qué rol se crea
        switch (creator.roleName) {
            //admin puede crear todo tipo de usuarios
            case 'AdminApp':
                if (newRoleName === 'AdminApp') {
                    // Permitir la creación de otro AdminApp
                    break;
                }
                else if (newRoleName === 'AdminDistrito') {
                    if (!districtId) return res.status(400).json({ message: 'Se requiere districtId para crear un AdminDistrito.' });
                    // Verificar si el distrito existe
                    const [districtExists] = await db.query('SELECT DistrictID FROM Districts WHERE DistrictID = ?', [districtId]);
                    if (districtExists.length === 0) return res.status(400).json({ message: `Distrito con ID ${districtId} no encontrado.` });
                    newUserData.districtId = parseInt(districtId);
                } else if (newRoleName === 'AdminMinisterio') {
                    newUserData.isMinistryUser = true; // Crear otro Admin Ministerio
                } else if (newRoleName === 'AdminInstitucion') {
                    if (!institutionId) return res.status(400).json({ message: 'Se requiere institutionId para crear un AdminInstitucion.' });
                    // Verificar si la institución existe
                    const [institutionExists] = await db.query('SELECT InstitutionID FROM Institutions WHERE InstitutionID = ?', [institutionId]);
                    if (institutionExists.length === 0) return res.status(400).json({ message: `Institución con ID ${institutionId} no encontrada.` });
                    newUserData.institutionId = parseInt(institutionId);
                } else if (newRoleName === 'Profesor' || newRoleName === 'PersonalApoyo') {
                    if (!institutionId) return res.status(400).json({ message: 'Se requiere institutionId para crear un Profesor o PersonalApoyo.' });
                    // Verificar si la institución existe
                    const [institutionExists] = await db.query('SELECT InstitutionID FROM Institutions WHERE InstitutionID = ?', [institutionId]);
                    if (institutionExists.length === 0) return res.status(400).json({ message: `Institución con ID ${institutionId} no encontrada.` });
                    newUserData.institutionId = parseInt(institutionId);
                } else {
                    return res.status(403).json({ message: 'AdminApp no puede crear este tipo de rol.' });
                }
                break;
                
            case 'AdminMinisterio':
                if (newRoleName === 'AdminDistrito') {
                    if (!districtId) return res.status(400).json({ message: 'Se requiere districtId para crear un AdminDistrito.' });
                    // Verificar si el distrito existe (opcional pero recomendado)
                    const [districtExists] = await db.query('SELECT DistrictID FROM Districts WHERE DistrictID = ?', [districtId]);
                     if (districtExists.length === 0) return res.status(400).json({ message: `Distrito con ID ${districtId} no encontrado.` });
                    newUserData.districtId = parseInt(districtId);
                } else if (newRoleName === 'AdminMinisterio') {
                    newUserData.isMinistryUser = true; // Crear otro Admin Ministerio
                }
                // ¿Puede crear AdminInstitucion? Podríamos añadirlo aquí si es necesario.
                else {
                    return res.status(403).json({ message: 'AdminMinisterio no puede crear este tipo de rol directamente.' });
                }
                break;

            case 'AdminDistrito':
                if (newRoleName === 'AdminInstitucion') {
                    if (!institutionId) return res.status(400).json({ message: 'Se requiere institutionId para crear un AdminInstitucion.' });
                    // ¡Verificación CLAVE! Asegurar que la institución pertenece al distrito del creador
                    const [instData] = await db.query('SELECT DistrictID FROM Institutions WHERE InstitutionID = ?', [institutionId]);
                    if (instData.length === 0 || instData[0].DistrictID !== creator.districtId) {
                        return res.status(403).json({ message: 'No tiene permiso para crear usuarios para esta institución.' });
                    }
                    newUserData.institutionId = parseInt(institutionId);
                }
                // ¿Puede crear Profesores? Podríamos añadirlo aquí.
                 else {
                    return res.status(403).json({ message: 'AdminDistrito no puede crear este tipo de rol.' });
                }
                break;

            case 'AdminInstitucion':
                // Solo puede crear roles dentro de SU institución (Profesor, PersonalApoyo)
                if (newRoleName === 'Profesor' || newRoleName === 'PersonalApoyo') {
                    newUserData.institutionId = creator.institutionId; // Asignar automáticamente SU institución
                } else {
                    return res.status(403).json({ message: 'AdminInstitucion solo puede crear roles de Profesor o PersonalApoyo dentro de su institución.' });
                }
                break;

            default:
                // Otros roles (Profesor, etc.) no pueden crear usuarios
                return res.status(403).json({ message: 'No tiene permiso para crear usuarios.' });
        }

        // --- 3. Verificar si Username o Email ya existen ---
        const checkUserQuery = 'SELECT UserID FROM Users WHERE Username = ? OR Email = ?';
        const [existingUsers] = await db.query(checkUserQuery, [newUserData.username, newUserData.email]);

        if (existingUsers.length > 0) {
             // Verificar cuál campo colisionó
             const existingUser = existingUsers[0];
             let collisionField = '';
             if (existingUser.Username === newUserData.username) {
                 collisionField = 'nombre de usuario';
             } else if (newUserData.email && existingUser.Email === newUserData.email) {
                 collisionField = 'correo electrónico';
             }
            return res.status(409).json({ message: `El ${collisionField} ya está en uso.` }); // 409 Conflict
        }


        // --- 4. Hashear la Contraseña ---
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        newUserData.passwordHash = hashedPassword;


        // --- 5. Insertar Usuario en la Base de Datos ---
        const insertQuery = `INSERT INTO Users (Username, PasswordHash, FirstName, LastName, Email, RoleID, InstitutionID, DistrictID, IsMinistryUser, IsActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(insertQuery, [
            newUserData.username,
            newUserData.passwordHash,
            newUserData.firstName,
            newUserData.lastName,
            newUserData.email,
            newUserData.roleId,
            newUserData.institutionId,
            newUserData.districtId,
            newUserData.isMinistryUser,
            newUserData.isActive
        ]);

        // --- 6. Enviar Respuesta Exitosa ---
        const createdUserId = result.insertId;
        console.log(`Usuario creado con ID: ${createdUserId} por usuario ${creator.userId}`);

        // Devolver datos básicos del usuario creado (sin el hash)
        res.status(201).json({ // 201 Created
            message: 'Usuario creado exitosamente.',
            user: {
                userId: createdUserId,
                username: newUserData.username,
                firstName: newUserData.firstName,
                lastName: newUserData.lastName,
                email: newUserData.email,
                roleId: newUserData.roleId,
                roleName: newRoleName, // Añadimos el nombre del rol
                institutionId: newUserData.institutionId,
                districtId: newUserData.districtId,
                isMinistryUser: newUserData.isMinistryUser,
                isActive: newUserData.isActive
            }
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        // Podríamos tener errores específicos de BD (ej. violación de FK si RoleID no existe)
        // if (error.code === 'ER_NO_REFERENCED_ROW_2') { // Ejemplo específico de MySQL
        //     return res.status(400).json({ message: 'El Rol, Institución o Distrito especificado no existe.' });
        // }
        next(error); // Pasar al manejador de errores global
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const creator = req.user; // Usuario que realiza la acción (obtenido del middleware protect)
        let query = `
            SELECT 
            u.UserID AS userId,
            u.Username AS username,
            u.FirstName AS firstName,
            u.LastName AS lastName,
            u.Email AS email,
            u.RoleID AS roleId,
            r.RoleName AS roleName,
            u.InstitutionID AS institutionId,
            i.Name AS institutionName,
            u.DistrictID AS districtId,
            d.Name AS districtName,
            u.IsMinistryUser AS isMinistryUser,
            u.IsActive AS isActive
            FROM Users u
            LEFT JOIN Roles r ON u.RoleID = r.RoleID
            LEFT JOIN Institutions i ON u.InstitutionID = i.InstitutionID
            LEFT JOIN Districts d ON u.DistrictID = d.DistrictID
        `;
        let queryParams = [];

        // Filtrar usuarios según el rol del creador
        switch (creator.roleName) {
            case 'AdminApp':
                // AdminApp puede ver todos los usuarios, no se aplica filtro adicional
                break;

            case 'AdminMinisterio':
                // AdminMinisterio no puede ver usuarios de tipo AdminApp
                query += ` WHERE r.RoleName != 'AdminApp'`;
                break;

            case 'AdminDistrito':
                // AdminDistrito solo puede ver usuarios de tipo AdminInstitución dentro de su distrito
                query += ` WHERE r.RoleName = 'AdminInstitucion' AND u.DistrictID = ?`;
                queryParams.push(creator.districtId);
                break;

            case 'AdminInstitucion':
                // AdminInstitucion solo puede ver usuarios de tipo Profesor o PersonalApoyo dentro de su institución
                query += ` WHERE (r.RoleName = 'Profesor' OR r.RoleName = 'PersonalApoyo') AND u.InstitutionID = ?`;
                queryParams.push(creator.institutionId);
                break;

            default:
                // Otros roles no tienen permiso para ver usuarios
                return res.status(403).json({ message: 'No tiene permiso para ver usuarios.' });
        }

        // Ejecutar la consulta con los parámetros correspondientes
        const [users] = await db.query(query, queryParams);

        // Enviar la lista de usuarios como respuesta
        res.status(200).json({
            message: 'Usuarios obtenidos exitosamente.',
            users: users
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        next(error); // Pasar al manejador de errores global
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id);

        // Validar que el ID sea un número válido
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'El ID de usuario debe ser un número válido.' });
        }

        // Obtener el usuario que realiza la acción
        const creator = req.user;

        // Obtener los datos del usuario a actualizar
        const {
            username,
            password,
            firstName,
            lastName,
            email,
            roleId,
            institutionId,
            districtId,
            isMinistryUser,
            isActive
        } = req.body;

        // Verificar si el usuario existe
        const [existingUser] = await db.query(
            'SELECT * FROM Users WHERE UserID = ?',
            [userId]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Aplicar lógica de autorización según el rol del creador
        const updatedUserData = {};

        switch (creator.roleName) {
            case 'AdminApp':
                // AdminApp puede actualizar cualquier campo excepto su propio rol si no es AdminApp
                if (roleId && roleId !== 1) {
                    // Verificar si el nuevo rol existe
                    const [roleData] = await db.query(
                        'SELECT RoleID FROM Roles WHERE RoleID = ?',
                        [roleId]
                    );
                    if (roleData.length === 0) {
                        return res.status(400).json({ message: 'Rol no encontrado.' });
                    }
                }
                break;

            case 'AdminMinisterio':
                // AdminMinisterio no puede actualizar ciertos campos
                if (roleId || isMinistryUser !== undefined) {
                    return res.status(403).json({ 
                        message: 'No tiene permiso para actualizar rol o estatus de ministerio.'
                    });
                }
                break;

            case 'AdminDistrito':
                // AdminDistrito solo puede actualizar usuarios dentro de su distrito
                if (existingUser[0].DistrictID !== creator.districtId) {
                    return res.status(403).json({ 
                        message: 'No tiene permiso para actualizar este usuario.'
                    });
                }
                // Limitar actualizaciones de rol
                if (roleId) {
                    return res.status(403).json({ 
                        message: 'No tiene permiso para actualizar el rol.'
                    });
                }
                break;

            case 'AdminInstitucion':
                // AdminInstitucion solo puede actualizar usuarios dentro de su institución
                if (existingUser[0].InstitutionID !== creator.institutionId) {
                    return res.status(403).json({ 
                        message: 'No tiene permiso para actualizar este usuario.'
                    });
                }
                // Limitar actualizaciones de rol
                if (roleId) {
                    return res.status(403).json({ 
                        message: 'No tiene permiso para actualizar el rol.'
                    });
                }
                break;

            default:
                return res.status(403).json({ 
                    message: 'No tiene permiso para actualizar usuarios.'
                });
        }

        // Verificar campos actualizados
        if (password) {
            // Verificar política de contraseña
            if (password.length < 6) {
                return res.status(400).json({ 
                    message: 'La contraseña debe tener al menos 6 caracteres.'
                });
            }
            updatedUserData.passwordHash = await bcrypt.hash(password, saltRounds);
        }

        // Actualizar campos permitidos
        if (username) updatedUserData.Username = username;
        if (firstName) updatedUserData.FirstName = firstName;
        if (lastName) updatedUserData.LastName = lastName;
        if (email) updatedUserData.Email = email;
        if (roleId) updatedUserData.RoleID = roleId;
        if (institutionId !== undefined) updatedUserData.InstitutionID = institutionId;
        if (districtId !== undefined) updatedUserData.DistrictID = districtId;
        if (isMinistryUser !== undefined) updatedUserData.IsMinistryUser = isMinistryUser;
        if (isActive !== undefined) updatedUserData.IsActive = isActive;

        // Verificar cambios
        if (Object.keys(updatedUserData).length === 0) {
            return res.status(400).json({ 
                message: 'No se han proporcionado cambios para aplicar.'
            });
        }

        // Actualizar el usuario en la base de datos
        const updateQuery = `
            UPDATE Users 
            SET ?
            WHERE UserID = ?
        `;
        await db.query(updateQuery, [updatedUserData, userId]);

        // Devolver la respuesta actualizada
        res.status(200).json({ 
            message: 'Usuario actualizado exitosamente.',
            user: {
                ...existingUser[0],
                ...updatedUserData
            }
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        next(error);
    }
};

exports.filterUsers = async (req, res, next) => {
    try {
        const creator = req.user;
        const {
            userId,
            roleId,
            institutionId,
            districtId,
            isActive,
            firstName,
            lastName,
            email,
            page = 1,
            pageSize = 10
        } = req.query;

        let query = `
            SELECT 
                u.UserID AS userId,
                u.Username AS username,
                u.FirstName AS firstName,
                u.LastName AS lastName,
                u.Email AS email,
                u.RoleID AS roleId,
                r.RoleName AS roleName,
                u.InstitutionID AS institutionId,
                u.DistrictID AS districtId,
                u.IsMinistryUser AS isMinistryUser,
                u.IsActive AS isActive
            FROM Users u
            LEFT JOIN Roles r ON u.RoleID = r.RoleID
            WHERE 1 = 1
        `;

        const queryParams = [];
        
        // Filtros según el rol del creador
        switch (creator.roleName) {
            case 'AdminApp':
                // No aplica filtros adicionales
                break;
            case 'AdminMinisterio':
                query += ` AND r.RoleName != 'AdminApp'`;
                break;
            case 'AdminDistrito':
                query += ` AND u.DistrictID = ?`;
                queryParams.push(creator.districtId);
                break;
            case 'AdminInstitucion':
                query += ` AND u.InstitutionID = ?`;
                queryParams.push(creator.institutionId);
                break;
            default:
                return res.status(403).json({ 
                    message: 'No tiene permiso para filtrar usuarios.'
                });
        }

        // Filtros opcionales
        if (userId) {
            query += ` AND u.UserID = ?`;
            queryParams.push(userId);
        }
        if (roleId) {
            query += ` AND u.RoleID = ?`;
            queryParams.push(roleId);
        }
        if (institutionId) {
            query += ` AND u.InstitutionID = ?`;
            queryParams.push(institutionId);
        }
        if (districtId) {
            query += ` AND u.DistrictID = ?`;
            queryParams.push(districtId);
        }
        if (isActive !== undefined) {
            query += ` AND u.IsActive = ?`;
            queryParams.push(isActive);
        }
        if (firstName) {
            query += ` AND u.FirstName LIKE ?`;
            queryParams.push(`%${firstName}%`);
        }
        if (lastName) {
            query += ` AND u.LastName LIKE ?`;
            queryParams.push(`%${lastName}%`);
        }
        if (email) {
            query += ` AND u.Email LIKE ?`;
            queryParams.push(`%${email}%`);
        }

        // Paginación
        const offset = (page - 1) * pageSize;
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(pageSize);
        queryParams.push(offset);

        const [users] = await db.query(query, queryParams);

        // Obtener total de usuarios para paginación
        const countQuery = `SELECT COUNT(*) as total FROM Users`;
        const [total] = await db.query(countQuery);

        res.status(200).json({
            message: 'Usuarios filtrados exitosamente.',
            users: users,
            pagination: {
                page,
                pageSize,
                total: total[0].total
            }
        });

    } catch (error) {
        console.error('Error al filtrar usuarios:', error);
        next(error);
    }
};
