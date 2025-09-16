const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Generar token JWT
const generateToken = (userId, rol) => {
    return jwt.sign(
        { id: userId, rol: rol },
        process.env.JWT_SECRET || 'tu_clave_secreta',
        { expiresIn: '24h' }
    );
};

// Registro de usuario
const registro = async (req, res) => {
    try {
        // Validar errores de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { usuario, email, clave } = req.body;

        // Verificar si el usuario ya existe por nombre de usuario
        const usuarioExistente = await Usuario.findOne({
            where: { usuario: usuario }
        });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya está en uso'
            });
        }

        // Verificar si el email ya existe
        const emailExistente = await Usuario.findOne({
            where: { email: email }
        });

        if (emailExistente) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado'
            });
        }

        // Crear nuevo usuario
        const nuevoUsuario = await Usuario.create({
            usuario,
            email,
            clave,
            rol: 'usuario' // Por defecto todos son usuarios normales
        });

        // Generar token
        const token = generateToken(nuevoUsuario.id, nuevoUsuario.rol);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                token,
                usuario: {
                    id: nuevoUsuario.id,
                    usuario: nuevoUsuario.usuario,
                    email: nuevoUsuario.email,
                    rol: nuevoUsuario.rol
                }
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        
        // Manejar errores de validación de Sequelize
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'El usuario o email ya están en uso'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Login de usuario
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { usuario, clave } = req.body;

        // Buscar usuario por nombre de usuario o email
        const usuarioEncontrado = await Usuario.findOne({
            where: {
                [Op.or]: [
                    { usuario: usuario },
                    { email: usuario }
                ]
            }
        });

        if (!usuarioEncontrado) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Verificar contraseña
        const claveValida = await usuarioEncontrado.compararClave(clave);
        if (!claveValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Generar token
        const token = generateToken(usuarioEncontrado.id, usuarioEncontrado.rol);

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                usuario: {
                    id: usuarioEncontrado.id,
                    usuario: usuarioEncontrado.usuario,
                    email: usuarioEncontrado.email,
                    rol: usuarioEncontrado.rol
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener perfil del usuario autenticado
const perfil = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: { exclude: ['clave'] }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: usuario
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Verificar token
const verificarToken = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: { exclude: ['clave'] }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                usuario: {
                    id: usuario.id,
                    usuario: usuario.usuario,
                    email: usuario.email,
                    rol: usuario.rol
                }
            }
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    registro,
    login,
    perfil,
    verificarToken
};
