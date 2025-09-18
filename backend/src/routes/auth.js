const express = require('express');
const { body } = require('express-validator');
const { registro, login, verificarToken, perfil, actualizarPerfil } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

const router = express.Router();

const validacionesRegistro = [
    body('usuario')
        .isLength({ min: 5 })
        .withMessage('El usuario debe tener al menos 5 caracteres')
        .matches(/^[a-zA-Z0-9]+$/)
        .withMessage('El usuario solo puede contener letras y números'),
    
    body('email')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('clave')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial')
];

const validacionesLogin = [
    body('usuario')
        .notEmpty()
        .withMessage('El usuario es requerido'),
    
    body('clave')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];

router.post('/registro', validacionesRegistro, registro);
router.post('/login', validacionesLogin, login);
router.get('/verificar', auth, verificarToken);
router.get('/perfil', auth, perfil);
router.put('/perfil', auth, actualizarPerfil);

module.exports = router;