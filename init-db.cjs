/**
 * Database Initializer Script (.cjs for cross-environment compatibility)
 * Reads schema.sql and seed.sql and executes them sequentially on the target MySQL database.
 * Run with: node database/init-db.cjs [--seed]
 */

const fs = require('fs');
const path = require('path');

let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  mysql = require(path.join(__dirname, '..', 'server', 'node_modules', 'mysql2', 'promise'));
}

let dotenv;
try {
  dotenv = require('dotenv');
} catch (e) {
  dotenv = require(path.join(__dirname, '..', 'server', 'node_modules', 'dotenv'));
}

dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const DB_NAME = process.env.DB_NAME || 'hostel_management';

async function initDatabase() {
  console.log('🔄 Connecting to MySQL at ' + config.host + ':' + config.port + ' as ' + config.user + '...');
  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server.');

    console.log(`📦 Ensuring database \`${DB_NAME}\` exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    // 1. Run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Executing database schema from schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('✅ Schema tables, constraints, and indexes created successfully.');
    } else {
      console.warn('⚠️ schema.sql not found at ' + schemaPath);
    }

    // 2. Check if users table is populated, if not or --seed passed, run seed.sql
    const shouldSeed = process.argv.includes('--seed') || process.argv.includes('-s');
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    const userCount = userRows[0]?.count || 0;

    if (shouldSeed || userCount === 0) {
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        console.log('🌱 Populating demo data from seed.sql...');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await connection.query(seedSql);
        console.log('✅ Demonstration records inserted successfully!');
      }
    } else {
      console.log(`ℹ️ Database already has ${userCount} users. Skipping seed (use --seed to reseed).`);
    }

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 HINT: MySQL is not running or unreachable on ' + config.host + ':' + config.port);
      console.error('   Please start your MySQL service (e.g. XAMPP, MySQL Workbench, or Windows Services `services.msc`).');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 HINT: MySQL access denied for user "' + config.user + '".');
      console.error('   Please check your DB_USER and DB_PASSWORD in server/.env or .env file.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
