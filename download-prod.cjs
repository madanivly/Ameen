const { Client } = require("basic-ftp");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

async function downloadFiles() {
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

    await client.cd("public_html");

    // Download .htaccess
    await client.downloadTo(".htaccess", ".htaccess");
    console.log("Downloaded .htaccess");

    // Download api/api.php
    await client.cd("api");
    await client.downloadTo("api/api.php", "api.php");
    console.log("Downloaded api/api.php");

  } catch (err) {
    console.error(err);
  } finally {
    client.close();
  }
}

downloadFiles();
