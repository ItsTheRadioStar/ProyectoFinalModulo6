const mysql = require('mysql2');

//Configuración para conexión a base de datos de trabajadores guardados, usando variables de entorno
function getDbConfig() {
    return {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            rejectUnauthorized: false
        }
    };
}

// Crear la conexión a la base de datos
const db_con = mysql.createConnection(getDbConfig());

// Conectar a la base de datos
db_con.connect((err) => {
    if (err) {
        console.error('Workers database connection failed:', err);
        return;
    }
    console.log(`Connected to workers database: ${getDbConfig().database} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = db_con;