/**
 * Ameen – Direct VS Code → cPanel/LiteSpeed FTP deploy script.
 *
 * Reads credentials from environment variables only (loaded from .env via dotenv).
 * Never commit real credentials to this file.
 *
 * Usage:  npm run deploy
 *
 * Env vars (all read from .env or your shell):
 *   FTP_HOST     – FTP server hostname/IP   (default: webapp.madanimedia.com)
 *   FTP_USER     – FTP username             (required)  e.g. madanime
 *   FTP_PASSWORD – FTP password             (required)  also accepts FTP_PASS alias
 *   FTP_SECURE   – "true" for FTPS, "false" for plain FTP (default: false)
 */

const { Client } = require("basic-ftp");
const path = require("path");
const fs = require("fs");
const dns = require("dns");
const util = require("util");
const resolve4 = util.promisify(dns.resolve4);

// ─── Load .env ────────────────────────────────────────────────────
try {
  require("dotenv").config({ path: [".env.local", ".env"] });
} catch {
  // dotenv is optional — if missing, rely on shell env vars
}

// ─── Configuration (env-only, no hardcoded secrets) ──────────────
const FTP_HOST = process.env.FTP_HOST || "grt.madanimedia.com";
const FTP_USER = process.env.FTP_USER || "";
// Accept FTP_PASSWORD or FTP_PASS (common alias)
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS || "";
const FTP_SECURE = (process.env.FTP_SECURE || "false").toLowerCase() !== "false";

const DIST_DIR = path.join(__dirname, "dist");

// Track uploaded files for the summary
const uploadedFiles = [];
const failedFiles = [];

// ─── Validate credentials before connecting ──────────────────────
function validateCredentials() {
  const missing = [];
  if (!FTP_USER) missing.push("FTP_USER");
  if (!FTP_PASSWORD) missing.push("FTP_PASSWORD");
  if (missing.length > 0) {
    console.error(
      `\n❌ Missing required environment variables: ${missing.join(", ")}`
    );
    console.error(
      "   Set them in your .env file or export them in your shell.\n"
    );
    process.exit(1);
  }
}

// ─── Recursive directory uploader ─────────────────────────────────
// Uses absolute remote paths to avoid cd() confusion with basic-ftp
async function uploadDirRecursive(client, localDir, remoteBaseDir) {
  const items = fs.readdirSync(localDir, { withFileTypes: true });

  for (const item of items) {
    // Skip problematic files
    const hasNull = item.name.includes("\u0000") || item.name.includes("\0");
    const isIcon = item.name === "Icon" || item.name.startsWith("Icon\r");
    const isDS_Store = item.name === ".DS_Store";
    if (hasNull || isIcon || isDS_Store) {
      continue;
    }

    const localPath = path.join(localDir, item.name);
    const remotePath = remoteBaseDir + "/" + item.name;

    if (item.isDirectory()) {
      // Ensure remote directory exists
      try {
        await client.ensureDir(remotePath);
        console.log(`  📁 Created dir: ${remotePath}`);
      } catch (err) {
        console.error(`  ✗ Could not create dir ${remotePath}: ${err.message}`);
        continue;
      }
      // Recurse into subdirectory
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

// ─── Remove a remote directory (best-effort) ─────────────────────
async function safeRemoveDir(client, dirPath) {
  try {
    await client.removeDir(dirPath);
    console.log(`  🗑  Removed ${dirPath}/`);
  } catch {
    // Doesn't exist or already empty — fine
  }
}

// ─── Remove a remote file (best-effort) ──────────────────────────
async function safeRemoveFile(client, filePath) {
  try {
    await client.remove(filePath);
    console.log(`  🗑  Removed ${filePath}`);
  } catch {
    // Doesn't exist — fine
  }
}

// ─── Main deploy function ─────────────────────────────────────────
async function deploy() {
  validateCredentials();

  const client = new Client();
  client.ftp.verbose = false;

  const secureLabel = FTP_SECURE ? "FTPS (TLS)" : "Plain FTP";
  console.log(`\n🚀 Ameen FTP Deploy`);
  console.log(`   Host:   ${FTP_HOST}`);
  console.log(`   User:   ${FTP_USER}`);
  console.log(`   Mode:   ${secureLabel}`);
  console.log(`   Source: ${DIST_DIR}\n`);

  try {
    // --- Resolve DNS ---
    let hostIp = FTP_HOST;
    try {
      console.log(`🔍 Resolving IP for ${FTP_HOST}...`);
      const addresses = await resolve4(FTP_HOST);
      if (addresses && addresses.length > 0) {
        hostIp = addresses[0];
        console.log(`✅ Resolved to ${hostIp}`);
      }
    } catch (e) {
      console.log(`⚠️ Could not resolve DNS natively, falling back to basic string: ${e.message}`);
    }

    // --- Connect ---
    console.log(`📡 Connecting to FTP server at ${hostIp}...`);
    await client.access({
      host: hostIp,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: FTP_SECURE,
    });
    console.log("✅ Connected.\n");

    // --- Use the correct remote root path ---
    let remoteRoot = "/domains/grt.madanimedia.com/public_html";
    try {
      await client.ensureDir(remoteRoot);
      console.log(`📂 Using remote root: ${remoteRoot}`);
    } catch {
      remoteRoot = "/";
      console.log(`📂 Remote root not found — using FTP root: ${remoteRoot}`);
    }

    // --- List current server contents ---
    console.log("\n--- Current server contents ---");
    try {
      const list = await client.list(remoteRoot);
      for (const item of list) {
        console.log(`  ${item.type === 2 ? "📁" : "📄"} ${item.name}`);
      }
    } catch {
      console.log("  (Could not list directory)");
    }

    // --- Clear old frontend files (keep non-frontend files) ---
    console.log("\n--- Clearing old frontend files ---");
    await safeRemoveDir(client, remoteRoot + "/assets");
    await safeRemoveDir(client, remoteRoot + "/api");
    await safeRemoveFile(client, remoteRoot + "/index.html");
    await safeRemoveFile(client, remoteRoot + "/favicon.ico");
    await safeRemoveFile(client, remoteRoot + "/.htaccess");

    // --- Upload fresh dist/ contents using absolute paths ---
    console.log("\n--- Uploading fresh build ---");
    await uploadDirRecursive(client, DIST_DIR, remoteRoot);

    // --- Upload root .htaccess for SPA routing ---
    const rootHtaccess = path.join(__dirname, "htaccess");
    if (fs.existsSync(rootHtaccess)) {
      try {
        await client.uploadFrom(rootHtaccess, remoteRoot + "/.htaccess");
        uploadedFiles.push(remoteRoot + "/.htaccess");
        console.log(`  ✓ ${remoteRoot}/.htaccess`);
      } catch (err) {
        failedFiles.push({ path: remoteRoot + "/.htaccess", error: err.message });
        console.error(`  ✗ ${remoteRoot}/.htaccess: ${err.message}`);
      }
    }

    // --- Upload api/ files (api.php, .htaccess, hourly_backup.php) ---
    console.log("\n--- Uploading api/ files ---");
    const apiFiles = [
      { local: path.join(__dirname, "api", "api.php"),   remote: remoteRoot + "/api/api.php" },
      { local: path.join(__dirname, "api", ".htaccess"), remote: remoteRoot + "/api/.htaccess" },
      { local: path.join(__dirname, "api", "hourly_backup.php"), remote: remoteRoot + "/api/hourly_backup.php" },
    ];
    // Ensure the remote api/ directory exists once
    try {
      await client.ensureDir(remoteRoot + "/api");
    } catch (err) {
      console.error(`  ✗ Could not ensure api/ dir: ${err.message}`);
    }
    for (const { local, remote } of apiFiles) {
      if (fs.existsSync(local)) {
        try {
          await client.uploadFrom(local, remote);
          uploadedFiles.push(remote);
          console.log(`  ✓ ${remote}`);
        } catch (err) {
          failedFiles.push({ path: remote, error: err.message });
          console.error(`  ✗ ${remote}: ${err.message}`);
        }
      } else {
        console.log(`  (${local} not found locally — skipping)`);
      }
    }

    // --- Final verification ---
    console.log("\n--- Verifying uploaded files ---");
    try {
      const finalList = await client.list(remoteRoot);
      for (const item of finalList) {
        console.log(`  ${item.type === 2 ? "📁" : "📄"} ${item.name}`);
      }
    } catch {
      console.log("  (Could not list directory)");
    }

    // --- Summary ---
    console.log("\n========================================");
    if (failedFiles.length === 0) {
      console.log(`✅ Deploy succeeded — ${uploadedFiles.length} files uploaded.`);
    } else {
      console.log(
        `⚠️  Deploy completed with errors — ${uploadedFiles.length} succeeded, ${failedFiles.length} failed.`
      );
      console.log("\nFailed files:");
      for (const f of failedFiles) {
        console.log(`  ✗ ${f.path}: ${f.error}`);
      }
    }
    console.log("========================================\n");

  } catch (err) {
    // --- Distinguish error types for actionable messages ---
    const msg = err.message || String(err);

    if (msg.includes("530") || msg.includes("Login incorrect") || msg.includes("Login failed")) {
      console.error("\n❌ AUTHENTICATION FAILURE — check FTP_USER and FTP_PASSWORD in your .env.");
      console.error(`   Host: ${FTP_HOST}`);
      console.error(`   User: ${FTP_USER}`);
    } else if (msg.includes("550")) {
      console.error("\n❌ PERMISSION / PATH ERROR (550) — file or directory operation refused.");
      console.error(`   Detail: ${msg}`);
      console.error("   Check that FTP_USER has write access to public_html.");
    } else if (msg.includes("ETIMEDOUT") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      console.error("\n❌ NETWORK/TIMEOUT ERROR — could not reach the FTP server.");
      console.error(`   Host: ${FTP_HOST}`);
      console.error("   Check that the host is correct and your network allows outbound FTP (port 21).");
    } else if (msg.includes("TLS") || msg.includes("SSL") || msg.includes("certificate")) {
      console.error("\n❌ TLS/CONNECTION ERROR — secure connection failed.");
      console.error(`   Host: ${FTP_HOST}`);
      console.error("   Try setting FTP_SECURE=false in your .env if the server doesn't support FTPS.");
    } else {
      console.error(`\n❌ DEPLOY FAILED: ${msg}`);
    }

    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
