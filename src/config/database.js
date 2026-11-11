const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'notas_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
let isConnected = false;

async function inicializarBD() {
  // Si no se ha ingresado contraseña y el servidor requiere autenticación
  if (!config.password && process.env.NODE_ENV !== 'test') {
    console.log('[MySQL] Nota: DB_PASSWORD está vacía en .env. Agrega tu contraseña para activar la persistencia en MySQL.');
    return null;
  }

  try {
    // 1. Conexión temporal para asegurar la existencia de la base de datos
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
    await connection.end();

    // 2. Crear pool de conexiones a la base de datos específica
    pool = mysql.createPool(config);

    // 3. Crear la tabla 'notas' si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(100) NOT NULL,
        contenido VARCHAR(5000) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    isConnected = true;
    console.log(`[MySQL] Conexión establecida. Base de datos '${config.database}' y tabla 'notas' listas.`);
    return pool;
  } catch (error) {
    console.warn(`[MySQL] No se pudo conectar a MySQL (${error.code || error.message}).`);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.warn('[MySQL] Revisa el usuario y contraseña en tu archivo .env.');
    }
    isConnected = false;
    pool = null;
    return null;
  }
}

function getPool() {
  return isConnected ? pool : null;
}

function estaConectado() {
  return isConnected;
}

module.exports = {
  getPool,
  inicializarBD,
  estaConectado,
  config
};
