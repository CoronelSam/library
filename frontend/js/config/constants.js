// Constantes globales del sistema
const APP_CONSTANTS = {
    TIPOS_BUSQUEDA: {
        TITULO: 'titulo',
        AUTOR: 'autor',
        GENERO: 'genero',
        GENERAL: 'general'
    },
    
    GENEROS: [
        'Aventura', 'Biografía', 'Ciencia', 'Ciencia Ficción', 'Clásicos', 'Comedia', 'Cómics', 
        'Crimen', 'Drama', 'Economía', 'Ensayo', 'Fantasía', 'Ficción', 'Filosofía', 'Historia', 
        'Horror', 'Humor', 'Infantil', 'Juvenil', 'Literatura', 'Matemáticas', 'Medicina', 
        'Misterio', 'Música', 'Negocios', 'No Ficción', 'Novela', 'Novela Gráfica', 
        'Novela Histórica', 'Novela Negra', 'Novela Romántica', 'Poesía', 'Política', 
        'Psicología', 'Religión', 'Romance', 'Salud', 'Suspenso', 'Teatro', 'Tecnología', 
        'Terror', 'Thriller', 'Viajes', 'Western'
    ],
    
    MENSAJES: {
        EXITO: {
            LIBRO_CREADO: 'Libro agregado correctamente al sistema',
            LIBRO_ACTUALIZADO: 'Libro actualizado correctamente',
            LIBRO_ELIMINADO: 'Libro eliminado correctamente'
        },
        ERROR: {
            CAMPO_REQUERIDO: 'Este campo es obligatorio',
            CONEXION_ERROR: 'Error de conexión con el servidor',
            DATOS_INVALIDOS: 'Los datos ingresados no son válidos',
            LIBRO_NO_ENCONTRADO: 'Libro no encontrado'
        }
    },
    
    UI_CONFIG: {
        DEBOUNCE_DELAY: 300,
        NOTIFICATION_DURATION: 5000, 
        MAX_SUGGESTIONS: 8
    },
    
    VALIDATIONS: {
        TITULO_MIN_LENGTH: 1,
        TITULO_MAX_LENGTH: 255,
        AUTOR_MIN_LENGTH: 1,
        AUTOR_MAX_LENGTH: 255,
        AÑO_MIN: 1,
        AÑO_MAX: new Date().getFullYear()
    }
};

window.APP_CONSTANTS = APP_CONSTANTS;