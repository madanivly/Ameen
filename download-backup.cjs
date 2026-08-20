const { Client } = require("basic-ftp");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

async function downloadBackup() {
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

    const date = new Date();
    const yyyymmdd = date.getFullYear().toString() + 
                     (date.getMonth() + 1).toString().padStart(2, '0') + 
                     date.getDate().toString().padStart(2, '0');
                     
    const backupDir = path.join(__dirname, "backups", `backend_public_html_${yyyymmdd}`);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Downloading public_html to ${backupDir}...`);
    await client.downloadToDir(backupDir, "public_html");
    console.log("Successfully downloaded backend files!");
  } catch (err) {
    console.error(err);
  } finally {
    client.close();
  }
}

downloadBackup();