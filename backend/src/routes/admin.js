const express = require('express');
const { body, param } = require('express-validator');
const { 
    listarUsuarios, 
    cambiarRol, 
    estadisticasUsuarios, 
    toggleActivarUsuario 
} = require('../controllers/admin.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware para verificar que solo los admin puedan acceder
const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
        });
    }
    next();
};

// Middleware para admin y moderadores
const adminOModerador = (req, res, next) => {
    if (!['admin', 'mod'].includes(req.usuario.rol)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo administradores y moderadores pueden realizar esta acción.'
        });
    }
    next();
};

// Validaciones para cambio de rol
const validacionCambioRol = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de usuario inválido'),
    
    body('rol')
        .isIn(['usuario', 'mod', 'admin'])
        .withMessage('Rol inválido. Debe ser: usuario, mod o admin')
];

// Rutas protegidas para administradores
router.get('/usuarios', auth, soloAdmin, listarUsuarios);
router.put('/usuarios/:id/rol', auth, soloAdmin, validacionCambioRol, cambiarRol);
router.patch('/usuarios/:id/toggle-activo', auth, soloAdmin, toggleActivarUsuario);

// Rutas para administradores y moderadores
router.get('/usuarios/estadisticas', auth, adminOModerador, estadisticasUsuarios);

// Ruta específica para verificar permisos
router.get('/verificar-permisos', auth, (req, res) => {
    res.json({
        success: true,
        data: {
            usuario: req.usuario,
            permisos: {
                esAdmin: req.usuario.rol === 'admin',
                esModerador: ['admin', 'mod'].includes(req.usuario.rol),
                puedeGestionarUsuarios: req.usuario.rol === 'admin',
                puedeVerEstadisticas: ['admin', 'mod'].includes(req.usuario.rol)
            }
        }
    });
});

module.exports = router;