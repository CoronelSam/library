#!/usr/bin/env node

/**
 * Script para crear un usuario administrador
 * Uso: node scripts/createAdminUser.js
 * 
 * El script pedirá los datos del administrador interactivamente
 * o puedes pasarlos como variables de entorno:
 * ADMIN_USER=admin ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=admin123 node scripts/createAdminUser.js
 */

const readline = require('readline');
const path = require('path');

// Configurar variables de entorno antes de importar los modelos
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sequelize } = require('../src/config/db');
const Usuario = require('../src/models/Usuario');

// Configurar readline para entrada interactiva
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para hacer preguntas
const pregunta = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

// Función para ocultar la entrada de contraseña
const preguntaPassword = (question) => {
    return new Promise((resolve) => {
        const stdin = process.stdin;
        const stdout = process.stdout;
        
        stdout.write(question);
        stdin.resume();
        stdin.setRawMode(true);
        stdin.setEncoding('utf8');
        
        let password = '';
        
        const onData = (char) => {
            char = char + '';
            
            switch (char) {
                case '\n':
                case '\r':
                case '\u0004':
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdin.removeListener('data', onData);
                    stdout.write('\n');
                    resolve(password);
                    break;
                case '\u0003':
                    process.exit();
                    break;
                case '\u007f': // backspace
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        stdout.write('\b \b');
                    }
                    break;
                default:
                    password += char;
                    stdout.write('*');
                    break;
            }
        };
        
        stdin.on('data', onData);
    });
};

// Función para validar email
const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// Función para validar usuario
const validarUsuario = (usuario) => {
    if (!usuario || usuario.length < 5 || usuario.length > 50) {
        return false;
    }
    return /^[a-zA-Z0-9]+$/.test(usuario);
};

// Función para validar contraseña
const validarPassword = (password) => {
    return password && password.length >= 8;
};

// Función principal
async function crearAdminUser() {
    try {
        console.log('🔧 Iniciando script para crear usuario administrador...\n');
        
        // Probar conexión a la base de datos
        console.log('📡 Probando conexión a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión establecida correctamente\n');
        
        // Sincronizar modelos (crear tablas si no existen)
        console.log('🔄 Sincronizando modelos de base de datos...');
        await sequelize.sync();
        console.log('✅ Modelos sincronizados correctamente\n');
        
        let usuario, email, password;
        
        // Obtener datos desde variables de entorno o entrada interactiva
        if (process.env.ADMIN_USER && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            console.log('📋 Usando datos desde variables de entorno...');
            usuario = process.env.ADMIN_USER;
            email = process.env.ADMIN_EMAIL;
            password = process.env.ADMIN_PASSWORD;
        } else {
            console.log('📝 Ingresa los datos del usuario administrador:\n');
            
            // Solicitar nombre de usuario
            do {
                usuario = await pregunta('👤 Nombre de usuario (5-50 caracteres, solo letras y números): ');
                if (!validarUsuario(usuario)) {
                    console.log('❌ Usuario inválido. Debe tener entre 5 y 50 caracteres y solo contener letras y números.');
                }
            } while (!validarUsuario(usuario));
            
            // Solicitar email
            do {
                email = await pregunta('📧 Email: ');
                if (!validarEmail(email)) {
                    console.log('❌ Email inválido. Ingresa un email válido.');
                }
            } while (!validarEmail(email));
            
            // Solicitar contraseña
            do {
                password = await preguntaPassword('🔒 Contraseña (mínimo 8 caracteres): ');
                if (!validarPassword(password)) {
                    console.log('❌ Contraseña inválida. Debe tener al menos 8 caracteres.');
                }
            } while (!validarPassword(password));
        }
        
        console.log('\n🔍 Verificando si ya existe un usuario con estos datos...');
        
        // Verificar si ya existe el usuario o email
        const usuarioExistente = await Usuario.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { usuario: usuario },
                    { email: email }
                ]
            }
        });
        
        if (usuarioExistente) {
            console.log('❌ Error: Ya existe un usuario con ese nombre de usuario o email.');
            console.log(`   Usuario existente: ${usuarioExistente.usuario} (${usuarioExistente.email})`);
            process.exit(1);
        }
        
        console.log('✅ Los datos son únicos, procediendo a crear el usuario...\n');
        
        // Crear el usuario administrador
        const adminUser = await Usuario.create({
            usuario: usuario,
            email: email,
            clave: password,
            rol: 'admin',
            activo: true
        });
        
        console.log('🎉 ¡Usuario administrador creado exitosamente!');
        console.log('📊 Detalles del usuario:');
        console.log(`   ID: ${adminUser.id}`);
        console.log(`   Usuario: ${adminUser.usuario}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Rol: ${adminUser.rol}`);
        console.log(`   Activo: ${adminUser.activo}`);
        console.log(`   Creado: ${adminUser.created_at}`);
        
    } catch (error) {
        console.error('❌ Error al crear el usuario administrador:');
        
        if (error.name === 'SequelizeValidationError') {
            console.error('   Errores de validación:');
            error.errors.forEach(err => {
                console.error(`   - ${err.message}`);
            });
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('   Error de duplicidad:');
            error.errors.forEach(err => {
                console.error(`   - ${err.message}`);
            });
        } else {
            console.error(`   ${error.message}`);
        }
        
        process.exit(1);
    } finally {
        // Cerrar conexiones
        rl.close();
        await sequelize.close();
        console.log('\n👋 Conexión cerrada. ¡Hasta luego!');
    }
}

// Manejar señales de interrupción
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Proceso interrumpido por el usuario');
    rl.close();
    await sequelize.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Proceso terminado');
    rl.close();
    await sequelize.close();
    process.exit(0);
});

// Ejecutar si el script se llama directamente
if (require.main === module) {
    crearAdminUser();
}

module.exports = crearAdminUser;