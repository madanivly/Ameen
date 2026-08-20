/**
 * ftp-deploy.cjs  — direct FTP upload of dist/ to grt.madanimedia.com
 * The real public_html for grt.madanimedia.com is /grt/ on this FTP server.
 * Uses basic-ftp (already in node_modules)
 */
const ftp  = require('basic-ftp');
const fs   = require('fs');
const path = require('path');

const HOST     = 'ftp.us.stackcp.com';
const USER     = 'grt@grt.madanimedia.com';
const PASSWORD = 'r4ytvd93fn';
const DIST     = path.resolve(__dirname, 'dist');
const REMOTE   = '/grt';   // actual public_html for grt.madanimedia.com

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
    console.log(`📂  Deploying dist/ → /grt/ (grt.madanimedia.com public_html)\n`);

    await uploadDir(client, DIST, REMOTE);

    console.log('\n✅  Deploy complete!');
    console.log('🌐  https://grt.madanimedia.com\n');

  } catch (err) {
    console.error('\n❌  FTP error:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
})();

