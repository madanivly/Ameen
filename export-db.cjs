const { Client } = require("basic-ftp");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

async function exportDatabase() {
  const client = new Client();
  client.ftp.verbose = true;
  client.ftp.pasv = true;

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE !== "false",
    });

    const scriptCode = `<?php
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    $dbHost = 'localhost';
    $dbName = 'madanime_ameen';
    $dbUser = 'madanime_ameen';
    $dbPass = 'Pandikasala!1!1';
    
    $outputFile = 'db_dump_' . date('Ymd_His') . '.sql';
    
    try {
        $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8", $dbUser, $dbPass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $tables = [];
        $stmt = $pdo->query("SHOW TABLES");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }
        
        $sqlScript = "";
        foreach ($tables as $table) {
            $stmt = $pdo->query("SHOW CREATE TABLE \`$table\`");
            $row = $stmt->fetch(PDO::FETCH_NUM);
            $sqlScript .= "\\n\\n" . $row[1] . ";\\n\\n";
            
            $stmt = $pdo->query("SELECT * FROM \`$table\`");
            $rowCount = $stmt->rowCount();
            
            if ($rowCount > 0) {
                $sqlScript .= "INSERT INTO \`$table\` VALUES ";
                $rows = [];
                while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                    $escaped = array_map(function($val) use ($pdo) {
                        return is_null($val) ? 'NULL' : $pdo->quote($val);
                    }, $row);
                    $rows[] = "(" . implode(", ", $escaped) . ")";
                }
                $sqlScript .= implode(", ", $rows) . ";\\n";
            }
        }
        
        file_put_contents($outputFile, $sqlScript);
        echo json_encode(['success' => true, 'file' => $outputFile]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    `;

    let remoteRoot = "/";
    try {
      await client.cd(remoteRoot);
    } catch {
      remoteRoot = "/";
    }

    fs.writeFileSync('db-exporter.php', scriptCode);
    console.log(`Uploading db-exporter.php to ${remoteRoot}...`);
    await client.uploadFrom('db-exporter.php', `${remoteRoot}/db-exporter.php`);

    console.log("Triggering database export...");
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://grtapp.in/db-exporter.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse response as JSON:", text);
      return;
    }
    
    if (json.success) {
      console.log(`Database exported to ${json.file} on server. Downloading...`);
      
      const date = new Date();
      const yyyymmdd = date.getFullYear().toString() + 
                       (date.getMonth() + 1).toString().padStart(2, '0') + 
                       date.getDate().toString().padStart(2, '0');
                       
      const backupDir = path.join(__dirname, "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const localFile = path.join(backupDir, `database_${yyyymmdd}.sql`);
      await client.downloadTo(localFile, `${remoteRoot}/${json.file}`);
      
      console.log("Database backup downloaded to", localFile);
      
      console.log("Cleaning up server files...");
      await client.remove(`${remoteRoot}/${json.file}`);
      await client.remove(`${remoteRoot}/db-exporter.php`);
      fs.unlinkSync('db-exporter.php');
      
      console.log("Database backup complete!");
    } else {
      console.error("Database export failed:", json.error);
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.close();
  }
}

exportDatabase();