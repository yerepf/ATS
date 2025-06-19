// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database'); // Nuestro pool de conexión a la BD

// Controlador para el inicio de sesión
exports.login = async (req, res, next) => {
    const { username, password } = req.body;

    // 1. Validación básica de entrada
    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
        // 400 Bad Request - Faltan datos
    }

    try {
        // 2. Buscar al usuario en la base de datos
        const getUserQuery = `
            SELECT
                u.UserID,
                u.Username,
                u.PasswordHash,
                u.FirstName,
                u.LastName,
                u.Email,
                u.IsActive,
                u.InstitutionID,
                u.DistrictID,
                u.IsMinistryUser,
                r.RoleID,
                r.RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.Username = ?
        `;
        // Usamos '?' como placeholder para evitar inyección SQL. El valor [username] lo reemplazará de forma segura.
        const [users] = await db.query(getUserQuery, [username]);

        // 3. Verificar si el usuario existe y está activo
        if (users.length === 0) {
            console.log(`Intento de login fallido: Usuario no encontrado - ${username}`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
            // 401 Unauthorized - Usuario no existe (mismo mensaje que contraseña incorrecta por seguridad)
        }

        const user = users[0]; // Obtenemos el primer (y único) usuario encontrado

        if (!user.IsActive) {
           console.log(`Intento de login fallido: Usuario inactivo - ${username}`);
           return res.status(403).json({ message: 'La cuenta de usuario está inactiva.' });
           // 403 Forbidden - Usuario existe pero no tiene permiso para acceder
        }

        // 4. Comparar la contraseña proporcionada con el hash almacenado
        const passwordMatch = await bcrypt.compare(password, user.PasswordHash);

        if (!passwordMatch) {
            console.log(`Intento de login fallido: Contraseña incorrecta - ${username}`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
            // 401 Unauthorized - Contraseña no coincide
        }

        // 5. ¡Autenticación exitosa! Generar el token JWT
        console.log(`Login exitoso para el usuario: ${username} (ID: ${user.UserID})`);

        // Crear el Payload (la información que irá dentro del token)
        // Incluir solo lo necesario para identificar al usuario y sus permisos/ámbito
        // ¡NUNCA INCLUIR CONTRASEÑAS O HASHES!
        const payload = {
            userId: user.UserID,
            roleId: user.RoleID,
            roleName: user.RoleName,
            institutionId: user.InstitutionID, // Puede ser null
            districtId: user.DistrictID,       // Puede ser null
            isMinistryUser: user.IsMinistryUser
        };

        // Firmar el token con el secreto y establecer tiempo de expiración (de .env)
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } // Usa valor de .env o 1 hora por defecto
        );

        // 6. Enviar la respuesta exitosa con el token y datos básicos del usuario
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token: token,
            user: { // Enviar solo datos no sensibles del usuario
                userId: user.UserID,
                username: user.Username,
                firstName: user.FirstName,
                lastName: user.LastName,
                email: user.Email,
                role: user.RoleName,
                institutionId: user.InstitutionID,
                districtId: user.DistrictID,
                isMinistryUser: user.IsMinistryUser
            }
        });

    } catch (error) {
        console.error('Error en el proceso de login:', error);
        // Pasar el error al siguiente middleware de manejo de errores (si lo hubiera)
        // o devolver un error genérico
        // next(error); // Si tienes un manejador de errores global más sofisticado
        return res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
    }
};

// Controlador para el refresh de token.
exports.refreshToken = async (req, res, next) => {
    const { token } = req.body; // El token a refrescar

    if (!token) {
        return res.status(400).json({ message: 'Token requerido.' });
    }

    try {
        // Verificar el token (esto puede incluir verificar su firma y expiración)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Si el token es válido, generar uno nuevo
        const newToken = jwt.sign(
            { userId: decoded.userId, roleId: decoded.roleId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.status(200).json({
            message: 'Token refrescado exitosamente.',
            token: newToken
        });

    } catch (error) {
        console.error('Error al refrescar el token:', error);
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

// Aquí podríamos añadir la función 'register' si fuera necesaria
// exports.register = async (req, res, next) => { ... }