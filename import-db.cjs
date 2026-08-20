/**
 * Ameen – Database Import Script
 * Imports SQL dump directly into remote MySQL database using mysql2
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const DB_CONFIG = {
  host: process.env.DB_HOST || "sdb-85.hosting.stackcp.net",
  user: process.env.DB_USER || "growtogether-35303938c0b0",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "X2yK.erfcHxG",
  database: process.env.DB_NAME || "growtogether-35303938c0b0",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  multipleStatements: true,
};

// Locate latest SQL file
function findSqlFile() {
  const candidates = [
    path.join(__dirname, "madanime_ameen.sql"),
    path.join(__dirname, "backups", "database_20260722.sql"),
    path.join(__dirname, "database.sql"),
    path.join(__dirname, "schema.sql"),
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      return file;
    }
  }
  return null;
}

async function importDb() {
  const sqlFile = findSqlFile();
  if (!sqlFile) {
    console.error("❌ No SQL dump file found.");
    process.exit(1);
  }

  console.log("========================================");
  console.log(" Starting Remote Database Import");
  console.log(" Host:", DB_CONFIG.host);
  console.log(" Database:", DB_CONFIG.database);
  console.log(" SQL File:", sqlFile);
  console.log("========================================\n");

  let connection;
  try {
    console.log("🔌 Connecting to MySQL server...");
    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected successfully.\n");

    const sqlContent = fs.readFileSync(sqlFile, "utf8");

    console.log("🔒 Disabling foreign key checks...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

    console.log("🗑️  Fetching and dropping existing tables...");
    const [rows] = await connection.query("SHOW TABLES;");
    const tableKey = `Tables_in_${DB_CONFIG.database}`;

    for (const row of rows) {
      const tableName = row[tableKey] || Object.values(row)[0];
      if (tableName) {
        console.log(`  Dropping table \`${tableName}\`...`);
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      }
    }

    console.log("\n📦 Executing SQL file statements...");
    // Split statements or run via multipleStatements: true
    await connection.query(sqlContent);
    console.log("✅ SQL dump executed successfully.");

    console.log("\n🔓 Re-enabling foreign key checks...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

    console.log("\n📋 Verifying imported tables...");
    const [importedTables] = await connection.query("SHOW TABLES;");
    for (const row of importedTables) {
      const name = row[tableKey] || Object.values(row)[0];
      const [[{ count }]] = await connection.query(`SELECT COUNT(*) as count FROM \`${name}\`;`);
      console.log(`  - \`${name}\`: ${count} row(s)`);
    }

    console.log("\n========================================");
    console.log("✅ Database import completed successfully!");
    console.log("========================================\n");

  } catch (err) {
    console.error(`\n❌ DB IMPORT FAILED: ${err.message}`);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importDb();
