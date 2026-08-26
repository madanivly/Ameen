/**
 * ftp-deploy.cjs  — direct FTP upload of dist/ to grtapp.in
 * The real public_html for grtapp.in is / on this FTP server.
 * Uses basic-ftp (already in node_modules)
 */
const ftp  = require('basic-ftp');
const fs   = require('fs');
const path = require('path');

const HOST     = process.env.FTP_HOST || 'ftp.grtapp.in';
const USER     = process.env.FTP_USER || 'grtapp@grtapp.in';
const PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS || '07yhhwrz52';
const DIST     = path.resolve(__dirname, 'dist');
const REMOTE   = '/';   // actual public_html / document root for grtapp.in dedicated FTP user

// Skip macOS junk; keep api/ untouched on server (already live)
const SKIP_NAMES_RE = /^Icon[\r\n]?$|^\.DS_Store$/;
const SKIP_DIRS     = new Set(['api', 'uploads']);

async function ensureDir(client, remoteDir) {
  try { await client.ensureDir(remoteDir); } catch (_) {}
}

async function uploadDir(client, localDir, remoteDir) {
  await ensureDir(client, remoteDir);
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_NAMES_RE.test(entry.name)) continue;
    const localPath  = path.join(localDir, entry.name);
    const remotePath = remoteDir + '/' + entry.name;

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        console.log(`  ⏭  skipping dir: ${entry.name}/`);
        continue;
      }
      await uploadDir(client, localPath, remotePath);
    } else {
      process.stdout.write(`  ↑ ${entry.name} ...`);
      await client.uploadFrom(localPath, remotePath);
      console.log(' ✅');
    }
  }
}

(async () => {
  const client = new ftp.Client(60000);
  client.ftp.verbose = false;

  try {
    console.log('\n🚀  Connecting to FTP...');
    await client.access({
      host:     HOST,
      user:     USER,
      password: PASSWORD,
      secure:   false,
    });

    console.log('✅  Logged in as', USER);
    console.log(`📂  Deploying dist/ → / (grtapp.in public_html)\n`);

    await uploadDir(client, DIST, REMOTE);

    console.log('\n✅  Deploy complete!');
    console.log('🌐  https://grtapp.in\n');

  } catch (err) {
    console.error('\n❌  FTP error:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
})();

