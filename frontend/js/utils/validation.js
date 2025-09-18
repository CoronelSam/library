class Validation {
    
    // Validar título
    static validarTitulo(titulo) {
        if (!titulo || titulo.trim().length === 0) {
            return { valido: false, error: 'El título es obligatorio' };
        }
        
        if (titulo.trim().length > APP_CONSTANTS.VALIDATIONS.TITULO_MAX_LENGTH) {
            return { valido: false, error: `El título no puede superar ${APP_CONSTANTS.VALIDATIONS.TITULO_MAX_LENGTH} caracteres` };
        }
        
        return { valido: true };
    }

    // Validar autor
    static validarAutor(autor) {
        if (!autor || autor.trim().length === 0) {
            return { valido: false, error: 'El autor es obligatorio' };
        }
        
        if (autor.trim().length > APP_CONSTANTS.VALIDATIONS.AUTOR_MAX_LENGTH) {
            return { valido: false, error: `El autor no puede superar ${APP_CONSTANTS.VALIDATIONS.AUTOR_MAX_LENGTH} caracteres` };
        }
        
        return { valido: true };
    }

    // Validar género
    static validarGenero(genero) {
        if (!genero || genero.trim().length === 0) {
            return { valido: false, error: 'El género es obligatorio' };
        }
        
        return { valido: true };
    }

    // Validar año de publicación
    static validarAño(año) {
        if (!año) {
            return { valido: true }; // Campo opcional
        }
        
        const añoNum = parseInt(año);
        
        if (isNaN(añoNum)) {
            return { valido: false, error: 'El año debe ser un número válido' };
        }
        
        if (añoNum < APP_CONSTANTS.VALIDATIONS.AÑO_MIN || añoNum > APP_CONSTANTS.VALIDATIONS.AÑO_MAX) {
            return { valido: false, error: `El año debe estar entre ${APP_CONSTANTS.VALIDATIONS.AÑO_MIN} y ${APP_CONSTANTS.VALIDATIONS.AÑO_MAX}` };
        }
        
        return { valido: true };
    }

    static validarEmail(email) {
        if (!email) {
            return { valido: true }; // Campo opcional
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            return { valido: false, error: 'Email no válido' };
        }
        
        return { valido: true };
    }

    // Validar archivo
    static validarArchivo(file, tiposPermitidos, tamañoMaximo) {
        if (!file) {
            return { valido: true }; // Archivo opcional
        }
        
        // Validar tipo
        if (!tiposPermitidos.includes(file.type)) {
            return { valido: false, error: 'Tipo de archivo no permitido' };
        }
        
        // Validar tamaño
        if (file.size > tamañoMaximo) {
            const tamañoMB = Math.round(tamañoMaximo / (1024 * 1024));
            return { valido: false, error: `El archivo no puede superar ${tamañoMB}MB` };
        }
        
        return { valido: true };
    }

    // Validar formulario completo de libro
    static validarLibro(datosLibro) {
        const errores = [];
        
        // Validar título
        const tituloValidacion = this.validarTitulo(datosLibro.titulo);
        if (!tituloValidacion.valido) {
            errores.push(tituloValidacion.error);
        }
        
        // Validar autor
        const autorValidacion = this.validarAutor(datosLibro.autor);
        if (!autorValidacion.valido) {
            errores.push(autorValidacion.error);
        }
        
        // Validar género
        const generoValidacion = this.validarGenero(datosLibro.genero);
        if (!generoValidacion.valido) {
            errores.push(generoValidacion.error);
        }
        
        // Validar año
        const añoValidacion = this.validarAño(datosLibro.año_publicacion);
        if (!añoValidacion.valido) {
            errores.push(añoValidacion.error);
        }
        
        return {
            valido: errores.length === 0,
            errores: errores
        };
    }

    // Limpiar datos de entrada
    static limpiarDatos(datos) {
        const datosLimpios = {};
        
        for (const [key, value] of Object.entries(datos)) {
            if (typeof value === 'string') {
                datosLimpios[key] = value.trim();
            } else {
                datosLimpios[key] = value;
            }
        }
        
        return datosLimpios;
    }
}

// Exportar clase
window.Validation = Validation;