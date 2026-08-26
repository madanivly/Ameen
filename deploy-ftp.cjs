/**
 * Ameen – Automated FTP deploy script for grtapp.in
 */

const { Client } = require("basic-ftp");
const path = require("path");
const fs = require("fs");

const FTP_HOST = process.env.FTP_HOST || "ftp.grtapp.in";
const FTP_USER = process.env.FTP_USER || "grtapp@grtapp.in";
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS || "07yhhwrz52";
const FTP_PORT = parseInt(process.env.FTP_PORT || "21", 10);
const FTP_SECURE = (process.env.FTP_SECURE || "false").toLowerCase() !== "false";

const DIST_DIR = path.join(__dirname, "dist");
const API_DIR = fs.existsSync(path.join(__dirname, "public", "api"))
  ? path.join(__dirname, "public", "api")
  : path.join(__dirname, "api");
const HTACCESS_PATH = path.join(__dirname, ".htaccess");

const uploadedFiles = [];
const failedFiles = [];

async function uploadDirRecursive(client, localDir, remoteBaseDir) {
  const items = fs.readdirSync(localDir, { withFileTypes: true });

  for (const item of items) {
    const hasNull = item.name.includes("\u0000") || item.name.includes("\0");
    const isIcon = item.name === "Icon" || item.name.startsWith("Icon\r");
    const isDS_Store = item.name === ".DS_Store";
    if (hasNull || isIcon || isDS_Store) continue;

    const localPath = path.join(localDir, item.name);
    const remotePath = (remoteBaseDir === "/" ? "" : remoteBaseDir) + "/" + item.name;

    if (item.isDirectory()) {
      try {
        await client.ensureDir(remotePath);
        console.log(`  📁 Created dir: ${remotePath}`);
      } catch (err) {
        console.error(`  ✗ Could not create dir ${remotePath}: ${err.message}`);
        continue;
      }
      await uploadDirRecursive(client, localPath, remotePath);
    } else {
      try {
        await client.uploadFrom(localPath, remotePath);
        uploadedFiles.push(remotePath);
        console.log(`  ✓ ${remotePath}`);
      } catch (err) {
        failedFiles.push({ path: remotePath, error: err.message });
        console.error(`  ✗ ${remotePath}: ${err.message}`);
      }
    }
  }
}

async function deployToDirectory(client, remoteDir) {
  console.log(`\n--- Uploading dist/ contents to '${remoteDir}' ---`);
  await uploadDirRecursive(client, DIST_DIR, remoteDir);

  if (fs.existsSync(HTACCESS_PATH)) {
    console.log(`--- Uploading .htaccess to ${remoteDir}/.htaccess ---`);
    const htPath = (remoteDir === "/" ? "" : remoteDir) + "/.htaccess";
    try {
      await client.uploadFrom(HTACCESS_PATH, htPath);
      uploadedFiles.push(htPath);
      console.log(`  ✓ ${htPath}`);
    } catch (err) {
      failedFiles.push({ path: htPath, error: err.message });
      console.error(`  ✗ ${htPath}: ${err.message}`);
    }
  }

  if (fs.existsSync(API_DIR)) {
    const apiPath = (remoteDir === "/" ? "" : remoteDir) + "/api";
    console.log(`--- Uploading API files from ${API_DIR} to ${apiPath}/ ---`);
    try {
      await client.ensureDir(apiPath);
    } catch (err) {
      console.error(`  ✗ Could not ensure ${apiPath} dir: ${err.message}`);
    }
    await uploadDirRecursive(client, API_DIR, apiPath);
  }
}

async function deploy() {
  console.log("========================================");
  console.log(" Starting Automated FTP Deployment for grtapp.in");
  console.log(" Host:", FTP_HOST);
  console.log(" User:", FTP_USER);
  console.log(" Port:", FTP_PORT);
  console.log(" Target: / (root)");
  console.log("========================================\n");

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Build directory '${DIST_DIR}' does not exist. Run 'npm run build' first.`);
    process.exit(1);
  }

  const client = new Client(30000);
  client.ftp.verbose = false;

  try {
    console.log("🔌 Connecting to FTP server...");
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      port: FTP_PORT,
      secure: FTP_SECURE,
    });
    console.log("✅ Connected successfully.\n");

    // Target folder: deploy to root '/' for domain grtapp.in
    console.log(`🎯 Deploying to root folder '/'`);
    await deployToDirectory(client, "/");

    console.log(`\n--- Verifying / Contents ---`);
    try {
      const finalList = await client.list("/");
      for (const item of finalList) {
        console.log(`  ${item.type === 2 ? "📁" : "📄"} ${item.name}`);
      }
    } catch (err) {
      console.log(`  (Could not list directory: ${err.message})`);
    }

    console.log("\n========================================");
    if (failedFiles.length === 0) {
      console.log(`✅ Deployment finished successfully — ${uploadedFiles.length} files uploaded.`);
    } else {
      console.log(`⚠️  Deployment completed with ${failedFiles.length} errors.`);
      for (const f of failedFiles) {
        console.log(`  ✗ ${f.path}: ${f.error}`);
      }
      process.exit(1);
    }
    console.log("========================================\n");

  } catch (err) {
    console.error(`\n❌ DEPLOY FAILED: ${err.message}`);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();





