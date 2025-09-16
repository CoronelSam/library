const { sequelize } = require('../config/db');
const Libro = require('./Libro');
const Usuario = require('./Usuario');
const Favorito = require('./Favorito');

// Definir las relaciones entre modelos
const setupAssociations = () => {
    // Relación Usuario - Favoritos (Un usuario puede tener muchos favoritos)
    Usuario.hasMany(Favorito, {
        foreignKey: 'usuario_id',
        as: 'favoritos',
        onDelete: 'CASCADE'
    });

    // Relación Favorito - Usuario (Un favorito pertenece a un usuario)
    Favorito.belongsTo(Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
    });

    // Relación Libro - Favoritos (Un libro puede estar en muchos favoritos)
    Libro.hasMany(Favorito, {
        foreignKey: 'libro_id',
        as: 'favoritos',
        onDelete: 'CASCADE'
    });

    // Relación Favorito - Libro (Un favorito pertenece a un libro)
    Favorito.belongsTo(Libro, {
        foreignKey: 'libro_id',
        as: 'libro'
    });

    // Relación Many-to-Many: Usuario - Libro a través de Favoritos
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

// Configurar las asociaciones
setupAssociations();

const models = {
    Libro,
    Usuario,
    Favorito,
    sequelize
};

module.exports = models;