const { Libro } = require('../src/models');
const { sequelize } = require('../src/config/db');

async function migrarCampoDescargas() {
    try {
        console.log('🔄 Iniciando migración del campo descargas...');
        
        // Verificar conexión a la base de datos
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida');
        
        // Sincronizar modelos (esto agregará la nueva columna)
        await sequelize.sync({ alter: true });
        console.log('✅ Sincronización de modelos completada');
        
        // Actualizar todos los libros existentes con descargas = 0 si el campo es null
        const [updatedRows] = await Libro.update(
            { descargas: 0 },
            { 
                where: { descargas: null },
                silent: true // Evita triggers innecesarios
            }
        );
        
        console.log(`✅ ${updatedRows} libros actualizados con campo descargas`);
        console.log('🎉 Migración completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        await sequelize.close();
        console.log('🔐 Conexión a la base de datos cerrada');
    }
}

// Ejecutar migración si el script se ejecuta directamente
if (require.main === module) {
    migrarCampoDescargas()
        .then(() => {
            console.log('✨ Migración finalizada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en migración:', error);
            process.exit(1);
        });
}

module.exports = { migrarCampoDescargas };