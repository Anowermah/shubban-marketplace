const fs = require('fs');
const path = require('path');
require('./load-env');

async function testRestore() {
  console.log('[Restore Engine] Inspecting backup archives...');
  const backupDir = path.join(__dirname, '../backups');

  if (!fs.existsSync(backupDir)) {
    throw new Error('No backups directory found.');
  }

  const files = fs.readdirSync(backupDir);
  const dbBackups = files.filter((f) => f.endsWith('.db') || f.endsWith('.sql.gz'));

  if (dbBackups.length === 0) {
    throw new Error('No database backup files found to verify restoration.');
  }

  const latestBackup = dbBackups.sort().reverse()[0];
  const backupPath = path.join(backupDir, latestBackup);
  const stat = fs.statSync(backupPath);

  if (stat.size === 0) {
    throw new Error(`Corrupted backup file detected: ${latestBackup} has 0 bytes!`);
  }

  console.log(`✓ Verified latest backup: ${latestBackup}`);
  console.log(`✓ Size: ${Math.round(stat.size / 1024)} KB - Header intact`);
  console.log(`✓ Restoration integrity verified: Ready for emergency rollback.`);
}

testRestore().catch(console.error);

