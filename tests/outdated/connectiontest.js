// Prueba mínima para comprobar conexión; no figura dentro de la suite de pruebas finales
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_USER:', process.env.DB_USER);

const db = require('../../config/crudDatabase');