const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'entbueromat',
    user: process.env.DB_USER || 'entbueromat_user',
    password: process.env.DB_PASSWORD,
    max: 5,
    connectionTimeoutMillis: 10000,
});

async function setupDatabase() {
    let client;
    try {
        console.log('🔄 Verbinde mit Datenbank...');
        client = await pool.connect();
        
        // Check if tables already exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'issues'
        `);
        
        if (tablesResult.rows.length > 0) {
            console.log('✅ Datenbank bereits initialisiert');
            return;
        }
        
        console.log('🔄 Initialisiere Datenbank...');
        
        // Read and execute init.sql
        const initSqlPath = path.join(__dirname, 'database', 'init.sql');
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        
        await client.query(initSql);
        
        console.log('✅ Datenbank erfolgreich initialisiert!');
        
        // Verify data was inserted
        const issuesCount = await client.query('SELECT COUNT(*) FROM issues');
        const votesCount = await client.query('SELECT COUNT(*) FROM votes');
        
        console.log(`📊 ${issuesCount.rows[0].count} Issues und ${votesCount.rows[0].count} Votes geladen`);
        
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren der Datenbank:', error);
        throw error;
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

// Wait for database to be ready, then setup
async function waitAndSetup() {
    const maxRetries = 30;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            await setupDatabase();
            console.log('🎉 Datenbank-Setup abgeschlossen!');
            return;
        } catch (error) {
            retries++;
            if (retries >= maxRetries) {
                console.error('❌ Datenbank-Setup fehlgeschlagen nach 30 Versuchen');
                process.exit(1);
            }
            console.log(`⏳ Warte auf Datenbank... Versuch ${retries}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

if (require.main === module) {
    waitAndSetup();
}

module.exports = { setupDatabase }; 