const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
        
        const usuario = await Usuario.findByPk(decoded.id);
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        req.usuario = {
            id: usuario.id,
            rol: usuario.rol
        };

        next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Permisos insuficientes'
            });
        }

        next();
    };
};

module.exports = auth;
module.exports.requireRole = requireRole;