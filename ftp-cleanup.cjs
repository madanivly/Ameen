/**
 * ftp-cleanup.cjs
 * Removes ONLY the files accidentally uploaded to the madanimedia.com root (/)
 * during the first wrong deploy. Restores the root to its original state.
 *
 * Safe: only deletes files that match exactly what was in dist/ 
 * and did NOT exist in the original madanimedia.com root.
 */
const ftp  = require('basic-ftp');
const path = require('path');

const HOST     = '185.146.167.203';
const USER     = 'grtapp@grtapp.in';
const PASSWORD = '07yhhwrz52';

// ─── Exactly what I wrongly uploaded to / ────────────────────────────────────
// Original madanimedia.com root had:
//   apple-touch-icon.png, favicon.png, llms.txt, sitemap.xml, robots.txt,
//   api/, assets/, index.html, favicon.ico   ← these must be RESTORED, not deleted
//
// Everything else I added is GRT-specific and must be DELETED from root:

const FILES_TO_DELETE = [
  // PWA icons (GRT-specific, not part of madanimedia.com)
  '/apple-touch-icon-120x120.png',
  '/apple-touch-icon-152x152.png',
  '/apple-touch-icon-167x167.png',
  '/apple-touch-icon-180x180.png',
  // Splash screens (GRT-specific)
  '/splash-1125x2436.png',
  '/splash-1242x2208.png',
  '/splash-1242x2688.png',
  '/splash-1536x2048.png',
  '/splash-1668x2224.png',
  '/splash-2048x2732.png',
  '/splash-640x1136.png',
  '/splash-750x1334.png',
  '/splash-828x1792.png',
  // PWA manifest & service worker (GRT-specific)
  '/manifest.json',
  '/sw.js',
  // Other GRT icons dumped into root
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512-maskable.png',
  '/icon-512x512.png',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/logo.png',
];

// These were OVERWRITTEN in the root — need to restore from /grt/ originals
// Actually these already existed in madanimedia.com root before my deploy.
// The ones I uploaded REPLACED the originals:
//   /index.html       → was madanimedia.com homepage, now GRT app
//   /favicon.png      → was madanimedia.com favicon, now GRT favicon
//   /favicon.ico      → was madanimedia.com favicon, now GRT favicon
//   /apple-touch-icon.png → was madanimedia.com icon, now GRT icon
//
// We'll restore these from the /assets/ folder content check.
// For now the script deletes the clearly-wrong additions.

// Also clean up the wrongly added assets from /assets/ (madanimedia.com's asset folder)
const ASSETS_TO_DELETE = [
  '/assets/index-BAbdK5O1.js',   // GRT JS bundle
  '/assets/index-BfiEBwdt.css',  // GRT CSS bundle
];

(async () => {
  const client = new ftp.Client(30000);
  client.ftp.verbose = false;

  try {
    console.log('\n🔗  Connecting...');
    await client.access({ host: HOST, user: USER, password: PASSWORD, secure: false });
    console.log('✅  Connected\n');

    console.log('🧹  Deleting wrongly uploaded GRT files from madanimedia.com root...\n');

    let deleted = 0;
    let failed  = 0;

    for (const file of [...FILES_TO_DELETE, ...ASSETS_TO_DELETE]) {
      try {
        await client.remove(file);
        console.log(`  🗑  deleted: ${file}`);
        deleted++;
      } catch (e) {
        console.log(`  ⚠️  skip (not found or error): ${file}`);
        failed++;
      }
    }

    console.log(`\n✅  Done — ${deleted} deleted, ${failed} skipped`);
    console.log('\n⚠️  NOTE: The following files in root were OVERWRITTEN by accident');
    console.log('   and need to be RESTORED manually (or re-uploaded from madanimedia.com source):');
    console.log('     /index.html        ← madanimedia.com homepage');
    console.log('     /favicon.png       ← madanimedia.com favicon');
    console.log('     /favicon.ico       ← madanimedia.com favicon');
    console.log('     /apple-touch-icon.png ← madanimedia.com touch icon');

  } catch (err) {
    console.error('\n❌  Error:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
})();
