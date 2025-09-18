const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const config = {
  "development": {
    "username": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DATABASE,
    "host": process.env.DB_HOST,
    "dialect": "mysql",
    "port": process.env.DB_PORT || 3306,
    "timezone": "-06:00",
  "logging": process.env.DISABLE_SQL_LOGGING === 'true' ? false : console.log,
    "pool": {
      "max": 10,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    }
  },
  
  "test": {
    "username": process.env.TEST_DB_USER || "root",
    "password": process.env.TEST_DB_PASSWORD || null,
    "database": process.env.TEST_DATABASE || "biblioteca_test",
    "host": process.env.TEST_DB_HOST || "127.0.0.1",
    "dialect": "mysql",
    "port": process.env.TEST_DB_PORT || 3306,
    "timezone": "-06:00",
    "logging": false,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    }
  },
  
  "production": {
    "username": process.env.PROD_DB_USER,
    "password": process.env.PROD_DB_PASSWORD,
    "database": process.env.PROD_DATABASE,
    "host": process.env.PROD_DB_HOST,
    "dialect": "mysql",
    "port": process.env.PROD_DB_PORT || 3306,
    "timezone": "-06:00",
    "logging": false, // Sin logs en producción
    "dialectOptions": {
      "ssl": process.env.DB_SSL_DISABLE === 'true' ? undefined : {
        "require": process.env.DB_SSL_REQUIRE === 'false' ? false : true,
        "rejectUnauthorized": process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
      }
    },
    "pool": {
      "max": 20,
      "min": 2,
      "acquire": 60000,
      "idle": 30000
    }
  }
};

const appConfig = {
  uploads: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50mb',
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf'],
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },
  
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  
  arbol: {
    maxSugerencias: parseInt(process.env.MAX_SUGERENCIAS) || 5,
    umbralDistancia: parseInt(process.env.UMBRAL_DISTANCIA) || 3
  }
};

// Obtener configuración del ambiente actual
const getCurrentEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

// Obtener configuración de BD del ambiente actual
const getCurrentDBConfig = () => {
  const env = getCurrentEnvironment();
  return config[env];
};

module.exports = {
  ...config,
  appConfig,
  cloudinary,
  getCurrentEnvironment,
  getCurrentDBConfig
};