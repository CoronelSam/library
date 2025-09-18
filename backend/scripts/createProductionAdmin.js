require('dotenv').config();
const crearAdminUser = require('./createAdminUser');

async function main() {
    console.log(' Creando usuario administrador para producción...\n');
    
    // Verificar que las variables de entorno estén definidas
    if (!process.env.ADMIN_USER || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.error('Error: Faltan variables de entorno requeridas');
        console.error('   Debes definir: ADMIN_USER, ADMIN_EMAIL, ADMIN_PASSWORD');
        console.error('\nEjemplo:');
        console.error('ADMIN_USER=admin ADMIN_EMAIL=admin@empresa.com ADMIN_PASSWORD=contraseña_segura node scripts/createProductionAdmin.js');
        process.exit(1);
    }
    
    try {
        await crearAdminUser();
    } catch (error) {
        console.error(' Error en el proceso:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}