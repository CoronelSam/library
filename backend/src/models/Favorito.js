const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Favorito = sequelize.define('Favorito', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    libro_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'libros',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    }
}, {
    tableName: 'favoritos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['usuario_id', 'libro_id'],
            name: 'unique_usuario_libro_favorito'
        }
    ]
});

module.exports = Favorito;