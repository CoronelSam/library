const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Libro = sequelize.define('Libro', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El título no puede estar vacío'
            },
            len: {
                args: [1, 255],
                msg: 'El título debe tener entre 1 y 255 caracteres'
            }
        }
    },
    autor: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El autor no puede estar vacío'
            },
            len: {
                args: [1, 255],
                msg: 'El autor debe tener entre 1 y 255 caracteres'
            }
        }
    },
    genero: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El género no puede estar vacío'
            }
        }
    },
    editorial: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    año_publicacion: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: {
                args: [1],
                msg: 'El año de publicación debe ser mayor a 1'
            },
            max: {
                args: [new Date().getFullYear()],
                msg: 'El año de publicación no puede ser mayor al año actual'
            }
        }
    },
    portada: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL o path de la imagen de portada'
    },
    archivo: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL o path del archivo PDF del libro'
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'libros',
    indexes: [
        {
            name: 'idx_titulo',
            fields: ['titulo']
        },
        {
            name: 'idx_autor',
            fields: ['autor']
        },
        {
            name: 'idx_genero',
            fields: ['genero']
        },
        {
            name: 'idx_titulo_autor',
            fields: ['titulo', 'autor']
        }
    ],
    hooks: {
        beforeCreate: (libro) => {
            // Normalizar datos antes de crear
            if (libro.titulo) libro.titulo = libro.titulo.trim();
            if (libro.autor) libro.autor = libro.autor.trim();
            if (libro.genero) libro.genero = libro.genero.trim();
            if (libro.editorial) libro.editorial = libro.editorial.trim();
        },
        beforeUpdate: (libro) => {
            // Normalizar datos antes de actualizar
            if (libro.titulo) libro.titulo = libro.titulo.trim();
            if (libro.autor) libro.autor = libro.autor.trim();
            if (libro.genero) libro.genero = libro.genero.trim();
            if (libro.editorial) libro.editorial = libro.editorial.trim();
        }
    }
});

Libro.prototype.toJSON = function() {
    const values = { ...this.get() };
    // Mantener nombres consistentes entre frontend y backend
    // No convertir año_publicacion para evitar inconsistencias
    return values;
};

Libro.buscarPorTitulo = async function(titulo) {
    return await this.findOne({
        where: {
            titulo: titulo
        }
    });
};

Libro.buscarPorAutor = async function(autor) {
    return await this.findAll({
        where: {
            autor: {
                [sequelize.Sequelize.Op.like]: `%${autor}%`
            }
        }
    });
};

Libro.buscarPorGenero = async function(genero) {
    return await this.findAll({
        where: {
            genero: {
                [sequelize.Sequelize.Op.like]: `%${genero}%`
            }
        }
    });
};

module.exports = Libro;