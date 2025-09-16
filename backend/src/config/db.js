const { Sequelize } = require('sequelize');
const { getCurrentDBConfig } = require('./config');
require('dotenv').config();

// Obtener configuración del ambiente actual
const dbConfig = getCurrentDBConfig();

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        port: dbConfig.port,
        timezone: dbConfig.timezone,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        define: {
            timestamps: true,         
            underscored: true,         
            freezeTableName: true,     
            charset: 'utf8mb4',        
            collate: 'utf8mb4_unicode_ci'
        },
        dialectOptions: {
            charset: 'utf8mb4',
            ...dbConfig.dialectOptions
        }
    }
);

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');
        return true;
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error.message);
        return false;
    }
};

const syncDatabase = async (options = {}) => {
    try {
        const defaultOptions = {
            force: false,      // No eliminar tablas existentes
            alter: false,      // No alterar tablas existentes
            logging: process.env.NODE_ENV === 'development'
        };

        const syncOptions = { ...defaultOptions, ...options };

        await sequelize.sync(syncOptions);
        console.log('✅ Modelos sincronizados con la base de datos.');
        return true;
    } catch (error) {
        console.error('❌ Error al sincronizar la base de datos:', error.message);
        return false;
    }
};

const closeConnection = async () => {
    try {
        await sequelize.close();
        console.log('🔒 Conexión a la base de datos cerrada.');
    } catch (error) {
        console.error('❌ Error al cerrar la conexión:', error.message);
    }
};

const initializeDatabase = async (syncOptions = {}) => {
    try {
        // Probar conexión
        const connectionOk = await testConnection();
        if (!connectionOk) {
            throw new Error('No se pudo establecer conexión con la base de datos');
        }

        // Sincronizar modelos
        const syncOk = await syncDatabase(syncOptions);
        if (!syncOk) {
            throw new Error('No se pudieron sincronizar los modelos');
        }

        console.log('🚀 Base de datos inicializada correctamente.');
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error.message);
        throw error;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    closeConnection,
    initializeDatabase
};
