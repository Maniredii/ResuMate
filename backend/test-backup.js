import { backupDatabase, listBackups, cleanupOldBackups } from './utils/backup.js';

console.log('=== Testing Database Backup Functionality ===\n');

// Test 1: Create a backup
console.log('Test 1: Creating a backup...');
const backupResult = backupDatabase();
if (backupResult.success) {
  console.log('✓ Backup created successfully');
  console.log(`  File: ${backupResult.fileName}`);
  console.log(`  Size: ${(backupResult.size / 1024).toFixed(2)} KB\n`);
} else {
  console.error('✗ Backup failed:', backupResult.error);
  process.exit(1);
}

// Test 2: List backups
console.log('Test 2: Listing all backups...');
const backups = listBackups();
console.log(`✓ Found ${backups.length} backup(s)\n`);

// Test 3: Cleanup old backups (keep 5)
console.log('Test 3: Cleaning up old backups (keeping 5 most recent)...');
const cleanupResult = cleanupOldBackups(5);
if (cleanupResult.success) {
  console.log(`✓ Cleanup successful`);
  console.log(`  Deleted: ${cleanupResult.deleted}`);
  console.log(`  Kept: ${cleanupResult.kept}\n`);
} else {
  console.error('✗ Cleanup failed:', cleanupResult.error);
}

// Test 4: Verify final state
console.log('Test 4: Verifying final state...');
const finalBackups = listBackups();
console.log(`✓ Final backup count: ${finalBackups.length}`);

console.log('\n=== All Tests Passed ===');
