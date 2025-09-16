const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            msg: 'Este nombre de usuario ya está en uso'
        },
        validate: {
            notEmpty: {
                msg: 'El usuario no puede estar vacío'
            },
            len: {
                args: [5, 50],
                msg: 'El usuario debe tener entre 5 y 50 caracteres'
            },
            isAlphanumeric: {
                msg: 'El usuario solo puede contener letras y números'
            }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            msg: 'Este correo electrónico ya está registrado'
        },
        validate: {
            notEmpty: {
                msg: 'El email no puede estar vacío'
            },
            isEmail: {
                msg: 'Debe ser un correo electrónico válido'
            }
        }
    },
    clave: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La contraseña no puede estar vacía'
            },
            len: {
                args: [8, 255],
                msg: 'La contraseña debe tener al menos 8 caracteres'
            }
        }
    },
    rol: {
        type: DataTypes.ENUM('usuario', 'mod', 'admin'),
        allowNull: false,
        defaultValue: 'usuario',
        validate: {
            isIn: {
                args: [['usuario', 'mod', 'admin']],
                msg: 'El rol debe ser usuario, mod o admin'
            }
        }
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.clave) {
                const salt = await bcrypt.genSalt(10);
                usuario.clave = await bcrypt.hash(usuario.clave, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('clave')) {
                const salt = await bcrypt.genSalt(10);
                usuario.clave = await bcrypt.hash(usuario.clave, salt);
            }
        }
    }
});

// Método para comparar contraseñas
Usuario.prototype.compararClave = async function(claveIngresada) {
    return await bcrypt.compare(claveIngresada, this.clave);
};

// Método para ocultar la contraseña en las respuestas JSON
Usuario.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.clave;
    return values;
};

module.exports = Usuario;
