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
    isbn: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: {
            msg: 'Este ISBN ya está registrado'
        },
        validate: {
            len: {
                args: [10, 20],
                msg: 'El ISBN debe tener entre 10 y 20 caracteres'
            }
        }
    },
    portada: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL o path de la imagen de portada'
    },
    imagenes_adicionales: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URLs de imágenes adicionales en formato JSON',
        get() {
            const rawValue = this.getDataValue('imagenes_adicionales');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('imagenes_adicionales', value ? JSON.stringify(value) : null);
        }
    },
    archivo: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL o path del archivo PDF del libro'
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    descargas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El número de descargas no puede ser negativo'
            }
        }
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
        },
        {
            name: 'idx_isbn',
            fields: ['isbn']
        }
    ],
    hooks: {
        // REEMPLAZA TU BLOQUE 'hooks' CON ESTE
        beforeSave: (libro, options) => {
            const trimIfString = (value) => (typeof value === 'string' ? value.trim() : value);

            // Limpia los campos de texto
            libro.titulo = trimIfString(libro.titulo);
            libro.autor = trimIfString(libro.autor);
            libro.genero = trimIfString(libro.genero);
            
            // --- ¡AQUÍ ESTÁ LA MAGIA! ---
            // Aseguramos que los campos opcionales que llegan vacíos se guarden como NULL
            
            // Si editorial es una cadena, la trimea. Si es vacía, la convierte en null.
            libro.editorial = trimIfString(libro.editorial) || null;
            
            // Si isbn es una cadena, la trimea. Si es vacía, la convierte en null.
            libro.isbn = trimIfString(libro.isbn) || null;
            
            // Si año_publicacion es cualquier cosa que no sea un número válido (incluyendo ''),
            // lo convertimos a null.
            if (libro.año_publicacion === '' || isNaN(parseInt(libro.año_publicacion, 10))) {
                libro.año_publicacion = null;
            }
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

Libro.buscarPorISBN = async function(isbn) {
    return await this.findOne({
        where: {
            isbn: isbn
        }
    });
};
module.exports = Libro;