require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initializeDatabase } = require('./config/db');
const { libroService } = require('./services/LibroService');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Ruta para la API
app.get('/api', (req, res) => {
    res.json({
        message: 'API de Biblioteca funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});


app.get('/health', async (req, res) => {
    try {
        const estadisticas = libroService.obtenerEstadisticas();
        const consistencia = await libroService.verificarConsistencia();
        
        res.json({
            status: 'OK',
            database: 'Connected',
            arbol: estadisticas,
            consistencia: consistencia,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.use('/api/libros', require('./routes/libros'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

app.use((error, req, res, next) => {
    console.error('❌ Error en la aplicación:', error);
    
    res.status(error.status || 500).json({
        message: error.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.stack : {}
    });
});

app.use((req, res) => {
    res.status(404).json({
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

const initializeServer = async () => {
    try {
        console.log('🚀 Iniciando servidor...');

        await initializeDatabase();
        
        await libroService.inicializarArbol();
        
        const PORT = process.env.PORT || 3001;
        
        app.listen(PORT, () => {
            console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
        });
        
    } catch (error) {
        console.error('❌ Error al inicializar el servidor:', error.message);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    const { closeConnection } = require('./config/db');
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Cerrando servidor...');
    const { closeConnection } = require('./config/db');
    await closeConnection();
    process.exit(0);
});

if (require.main === module) {
    initializeServer();
}

module.exports = app;