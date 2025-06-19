// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware: Verifica autenticación vía JWT.
 * Adjunta datos del usuario a `req.user` si el token es válido.
 */
const protect = (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { // Adjuntar payload decodificado
                userId: decoded.userId,
                roleId: decoded.roleId,
                roleName: decoded.roleName,
                institutionId: decoded.institutionId,
                districtId: decoded.districtId,
                isMinistryUser: decoded.isMinistryUser
            };
            next();
        } catch (error) {
            console.error('Error de autenticación:', error.message);
            let status = 401;
            let message = 'Acceso no autorizado: Token inválido o expirado.';
            if (error.name === 'TokenExpiredError') {
                message = 'Acceso no autorizado: Token expirado.';
            } else if (error.name === 'JsonWebTokenError') {
                 message = 'Acceso no autorizado: Token inválido.';
            } else {
                status = 403; // O 500 si es un error inesperado
                message = 'Acceso prohibido.';
            }
            return res.status(status).json({ message });
        }
    }

    if (!token) {
        console.log('Error de autenticación - No se encontró token.');
        return res.status(401).json({ message: 'Acceso no autorizado: No se proporcionó token.' });
    }
};

/**
 * Middleware: Verifica Autorización por Roles.
 * Genera un middleware que comprueba si req.user.roleName está en la lista de roles permitidos.
 * Debe usarse DESPUÉS del middleware 'protect'.
 * @param {...string} allowedRoles - Nombres de los roles permitidos para acceder a la ruta.
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Asegurarse de que 'protect' se ejecutó antes y req.user está disponible
        if (!req.user || !req.user.roleName) {
            console.error('Error de autorización: req.user no definido. ¿Falta middleware "protect"?');
            return res.status(500).json({ message: 'Error interno del servidor (configuración de middleware).' });
        }

        // Verificar si el rol del usuario está incluido en los roles permitidos
        if (!allowedRoles.includes(req.user.roleName)) {
            console.log(`Acceso denegado para rol "${req.user.roleName}". Roles permitidos: ${allowedRoles.join(', ')}`);
            return res.status(403).json({ // 403 Forbidden - Autenticado pero sin permiso
                message: 'Acceso prohibido: No tiene los permisos necesarios para realizar esta acción.'
            });
        }

        // Si el rol está permitido, continuar con el siguiente middleware o controlador
        next();
    };
};


// Exportar ambos middlewares
module.exports = {
    protect,
    authorize
};