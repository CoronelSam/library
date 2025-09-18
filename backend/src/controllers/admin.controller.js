const { Usuario } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

const listarUsuarios = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', rol = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereConditions = {};
        
        if (search) {
            whereConditions[Op.or] = [
                { usuario: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }
        
        if (rol && ['usuario', 'mod', 'admin'].includes(rol)) {
            whereConditions.rol = rol;
        }

        const { count, rows: usuarios } = await Usuario.findAndCountAll({
            where: whereConditions,
            attributes: { exclude: ['clave'] },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                usuarios,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Cambiar rol de usuario (solo admin)
const cambiarRol = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { rol } = req.body;

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (usuario.id === req.usuario.id && rol !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'No puedes cambiar tu propio rol de administrador'
            });
        }

        await usuario.update({ rol });

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente',
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
        console.error('Error al cambiar rol:', error);
        console.error('Stack trace:', error.stack);
        
        let mensaje = 'Error interno del servidor';
        
        if (error.name === 'SequelizeValidationError') {
            mensaje = 'Error de validación: ' + error.errors.map(e => e.message).join(', ');
        } else if (error.name === 'SequelizeDatabaseError') {
            mensaje = 'Error de base de datos: ' + error.message;
        }
        
        res.status(500).json({
            success: false,
            message: mensaje,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const estadisticasUsuarios = async (req, res) => {
    try {
        const estadisticas = await Usuario.findAll({
            attributes: [
                'rol',
                [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
            ],
            group: ['rol']
        });

        const totalUsuarios = await Usuario.count();

        res.json({
            success: true,
            data: {
                totalUsuarios,
                porRol: estadisticas.reduce((acc, stat) => {
                    acc[stat.rol] = parseInt(stat.dataValues.cantidad);
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const toggleActivarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (usuario.id === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes desactivar tu propia cuenta'
            });
        }

        await usuario.update({ activo: !usuario.activo });

        res.json({
            success: true,
            message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
            data: {
                usuario: {
                    id: usuario.id,
                    usuario: usuario.usuario,
                    email: usuario.email,
                    rol: usuario.rol,
                    activo: usuario.activo
                }
            }
        });

    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    listarUsuarios,
    cambiarRol,
    estadisticasUsuarios,
    toggleActivarUsuario
};
