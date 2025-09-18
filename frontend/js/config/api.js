// Configuración de la API
// Permite override por window.API_BASE_URL_OVERRIDE / window.API_URL_OVERRIDE para producción
const DEFAULT_API_BASE_URL = 'http://localhost:3001';
const DEFAULT_API_URL = 'http://localhost:3001/api';

const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL_OVERRIDE) || DEFAULT_API_BASE_URL;
const API_URL = (typeof window !== 'undefined' && window.API_URL_OVERRIDE) || DEFAULT_API_URL;

const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    API_URL: API_URL,

    ENDPOINTS: {
        // Autenticación
        AUTH_REGISTRO: '/auth/registro',
        AUTH_LOGIN: '/auth/login',
        AUTH_VERIFICAR: '/auth/verificar',
        
        // Libros
        LIBROS: '/libros',
        BUSCAR: '/libros/buscar',
        AUTOCOMPLETAR: '/libros/autocompletar',
        ESTADISTICAS: '/libros/estadisticas',
        RECORRIDOS: '/libros/recorridos',
    FAVORITOS: '/favoritos',
        
        // Admin
        ADMIN_USUARIOS: '/admin/usuarios',
        ADMIN_ESTADISTICAS: '/admin/usuarios/estadisticas',
        
        // Sistema
        HEALTH: '/health'
    },
    
    REQUEST_CONFIG: {
        timeout: 10000, // 10 segundos
        headers: {
            'Content-Type': 'application/json'
        }
    },
    
    FILE_CONFIG: {
        MAX_SIZE: 50 * 1024 * 1024, // 50MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
        ALLOWED_PDF_TYPES: ['application/pdf']
    }
};

// URLs completas
API_CONFIG.FULL_ENDPOINTS = {
    AUTH_REGISTRO: API_URL + API_CONFIG.ENDPOINTS.AUTH_REGISTRO,
    AUTH_LOGIN: API_URL + API_CONFIG.ENDPOINTS.AUTH_LOGIN,
    AUTH_VERIFICAR: API_URL + API_CONFIG.ENDPOINTS.AUTH_VERIFICAR,
    LIBROS: API_URL + API_CONFIG.ENDPOINTS.LIBROS,
    BUSCAR: API_URL + API_CONFIG.ENDPOINTS.BUSCAR,
    AUTOCOMPLETAR: API_URL + API_CONFIG.ENDPOINTS.AUTOCOMPLETAR,
    ESTADISTICAS: API_URL + API_CONFIG.ENDPOINTS.ESTADISTICAS,
    RECORRIDOS: API_URL + API_CONFIG.ENDPOINTS.RECORRIDOS,
    FAVORITOS: API_URL + API_CONFIG.ENDPOINTS.FAVORITOS,
    ADMIN_USUARIOS: API_URL + API_CONFIG.ENDPOINTS.ADMIN_USUARIOS,
    ADMIN_ESTADISTICAS: API_URL + API_CONFIG.ENDPOINTS.ADMIN_ESTADISTICAS,
    HEALTH: API_BASE_URL + API_CONFIG.ENDPOINTS.HEALTH
};

// Exportar variables globales para compatibilidad
window.API_CONFIG = API_CONFIG;
window.API_URL = API_URL;
window.API_BASE_URL = API_BASE_URL;