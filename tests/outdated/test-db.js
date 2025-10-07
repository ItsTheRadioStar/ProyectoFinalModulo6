// Prueba realizada durante desarrollo para comprobar fetch correcto de variables de entorno; no figura dentro de la suite de pruebas finales

const path = require('path');

console.log('=== Testing dotenv loading ===');

// Carga simple
console.log('\n1. Trying simple .env load:');
require('dotenv').config();
console.log('DB_USER:', process.env.DB_USER || 'NOT FOUND');

// Ruta específica
console.log('\n2. Trying specific path:');
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });
console.log('DB_USER:', process.env.DB_USER || 'NOT FOUND');

// Revisar que el archivo existe
console.log('\n3. File existence check:');
const fs = require('fs');
try {
    const files = fs.readdirSync(__dirname);
    const envFiles = files.filter(f => f.includes('.env'));
    console.log('Env files found:', envFiles);
} catch (err) {
    console.log('Error reading directory:', err.message);
}