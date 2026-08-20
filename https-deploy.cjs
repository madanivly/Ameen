/**
 * https-deploy.cjs
 * Deploys dist/ to the live server via HTTPS using a temporary PHP receiver.
 *
 * Steps:
 *   1. Upload deploy_receiver.php to /api/ via multipart POST to the existing api.php
 *      — actually we upload it as a raw file via a curl-like fetch
 *   2. Upload the dist ZIP to the receiver
 *   3. Trigger extraction
 *   4. Receiver self-destructs
 */

const fs   = require('fs');
const path = require('path');
const http  = require('https');

const BASE_URL    = 'https://grt.madanimedia.com';
const TOKEN       = 'grt_deploy_2026_xK9mPqZ7';
const RECEIVER    = `${BASE_URL}/api/deploy_receiver.php?token=${TOKEN}`;
const DIST_ZIP    = path.join(__dirname, 'pwa_deploy.zip');
const RECEIVER_PHP = path.join(__dirname, 'api', 'deploy_receiver.php');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { timeout: 30000 }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

function httpsPost(url, data, contentType = 'application/octet-stream') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const opts = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method:   'POST',
      timeout:  120000,
      headers: {
        'Content-Type':   contentType,
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Upload timed out')));
    req.write(data);
    req.end();
  });
}

async function deploy() {
  console.log('\n🚀 HTTPS Deploy via PHP receiver\n');

  // ── Step 1: Check if receiver is already live ─────────────────
  console.log('1️⃣  Checking receiver status...');
  try {
    const check = await httpsGet(`${RECEIVER}&action=status`);
    if (check.status === 200) {
      const j = JSON.parse(check.body);
      if (j.ok) {
        console.log(`   ✅ Receiver already live (PHP ${j.php})`);
      } else {
        throw new Error('Receiver not ready');
      }
    } else if (check.status === 403 || check.status === 404) {
      console.log('   ⚠️  Receiver not found — need to upload it first');
      console.log('\n   ❌ Cannot auto-upload receiver via HTTPS without FTP/SSH.');
      console.log('   👉 Please upload api/deploy_receiver.php manually via cPanel File Manager');
      console.log('      into: public_html/api/deploy_receiver.php');
      console.log('   Then re-run: node https-deploy.cjs\n');
      process.exit(1);
    }
  } catch (e) {
    if (e.message.includes('404') || e.code === 'ECONNREFUSED') {
      console.log('   ❌ Receiver not reachable. Upload api/deploy_receiver.php first.');
      process.exit(1);
    }
    throw e;
  }

  // ── Step 2: Upload ZIP ────────────────────────────────────────
  console.log('\n2️⃣  Uploading dist ZIP...');
  if (!fs.existsSync(DIST_ZIP)) {
    console.error(`   ❌ ${DIST_ZIP} not found. Run: npm run build first.`);
    process.exit(1);
  }
  const zipData = fs.readFileSync(DIST_ZIP);
  console.log(`   📦 ZIP size: ${(zipData.length / 1024 / 1024).toFixed(2)} MB`);

  const uploadRes = await httpsPost(`${RECEIVER}&action=upload`, zipData);
  const uploadJson = JSON.parse(uploadRes.body);
  if (!uploadJson.ok) {
    console.error('   ❌ Upload failed:', uploadJson);
    process.exit(1);
  }
  console.log(`   ✅ Uploaded ${uploadJson.bytes.toLocaleString()} bytes`);

  // ── Step 3: Extract ───────────────────────────────────────────
  console.log('\n3️⃣  Extracting files on server...');
  const extractRes = await httpsGet(`${RECEIVER}&action=extract`);
  const extractJson = JSON.parse(extractRes.body);
  if (!extractJson.ok) {
    console.error('   ❌ Extraction failed:', extractJson);
    process.exit(1);
  }
  console.log(`   ✅ Extracted ${extractJson.extracted} files`);
  if (extractJson.failed && extractJson.failed.length > 0) {
    console.warn('   ⚠️  Failed files:', extractJson.failed);
  }

  // ── Done ──────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`✅ Deploy complete! ${extractJson.extracted} files live.`);
  console.log(`🌐 https://grt.madanimedia.com`);
  console.log('========================================\n');
}

deploy().catch(err => {
  console.error('\n❌ Deploy error:', err.message);
  process.exit(1);
});
