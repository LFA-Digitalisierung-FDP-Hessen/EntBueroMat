const { Pool } = require('pg');

// Validate required database environment variables
const requiredDbVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingDbVars = requiredDbVars.filter(varName => !process.env[varName]);

if (missingDbVars.length > 0) {
    console.error('❌ FEHLER: Erforderliche Datenbank-Umgebungsvariablen fehlen:');
    missingDbVars.forEach(varName => {
        console.error(`   ${varName} ist nicht gesetzt`);
    });
    console.error('\n💡 Tipp: Setze alle Datenbank-Variablen in der .env Datei');
    process.exit(1);
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL database');
        client.release();
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query:', text,
            '\nParameters:', params,
            '\nResult:', { duration, rows: result.rowCount }
          );
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function getClient() {
    return await pool.connect();
}

module.exports = {
    query,
    getClient,
    initializeDatabase,
    pool
}; 