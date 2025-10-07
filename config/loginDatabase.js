const mysql = require('mysql2/promise');

//Configuración para conexión a base de datos de trabajadores guardados, usando variables de entorno
function getDbConfig() {
    return {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.AUTH_DB_NAME || 'radiotest_users',
        ssl: {
            rejectUnauthorized: false
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

// Crear la conexión a la base de datos
const pool = mysql.createPool(getDbConfig());

// Conectar a la base de datos
pool.getConnection()
    .then(connection => {
        console.log(`Connected to auth database: ${getDbConfig().database} in ${process.env.NODE_ENV || 'development'} mode`);
        connection.release();
    })
    .catch(error => {
        console.error('Auth database connection failed:', error.message);
        process.exit(1);
    });

module.exports = pool;