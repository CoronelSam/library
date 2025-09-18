const { sequelize } = require('../config/db');
const Libro = require('./Libro');
const Usuario = require('./Usuario');
const Favorito = require('./Favorito');

const setupAssociations = () => {
    Usuario.hasMany(Favorito, {
        foreignKey: 'usuario_id',
        as: 'favoritos',
        onDelete: 'CASCADE'
    });

    Favorito.belongsTo(Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
    });

    Libro.hasMany(Favorito, {
        foreignKey: 'libro_id',
        as: 'favoritos',
        onDelete: 'CASCADE'
    });

    Favorito.belongsTo(Libro, {
        foreignKey: 'libro_id',
        as: 'libro'
    });

    Usuario.belongsToMany(Libro, {
        through: Favorito,
        foreignKey: 'usuario_id',
        otherKey: 'libro_id',
        as: 'libros_favoritos'
    });

    Libro.belongsToMany(Usuario, {
        through: Favorito,
        foreignKey: 'libro_id',
        otherKey: 'usuario_id',
        as: 'usuarios_que_favorecen'
    });
};

setupAssociations();

const models = {
    Libro,
    Usuario,
    Favorito,
    sequelize
};

module.exports = models;