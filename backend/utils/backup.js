import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a backup of the SQLite database with timestamp
 * @returns {Object} Result object with success status and backup path
 */
export function backupDatabase() {
  try {
    // Define paths
    const dbPath = path.join(__dirname, '..', 'database.db');
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      throw new Error('Database file not found at: ' + dbPath);
    }

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('✓ Created backups directory');
    }

    // Generate timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
    const backupFileName = `database_backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    // Copy database file to backup location
    fs.copyFileSync(dbPath, backupPath);

    const stats = fs.statSync(backupPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);

    console.log('✓ Database backup created successfully');
    console.log(`  File: ${backupFileName}`);
    console.log(`  Size: ${fileSizeInKB} KB`);
    console.log(`  Path: ${backupPath}`);

    return {
      success: true,
      backupPath,
      fileName: backupFileName,
      size: fileSizeInBytes,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('✗ Database backup failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lists all existing database backups
 * @returns {Array} Array of backup file information
 */
export function listBackups() {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(file => file.startsWith('database_backup_') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created); // Sort by newest first

    return backups;
  } catch (error) {
    console.error('Error listing backups:', error.message);
    return [];
  }
}

/**
 * Deletes old backups, keeping only the specified number of most recent backups
 * @param {number} keepCount - Number of recent backups to keep
 * @returns {Object} Result object with deletion summary
 */
export function cleanupOldBackups(keepCount = 10) {
  try {
    const backups = listBackups();
    
    if (backups.length <= keepCount) {
      console.log(`✓ No cleanup needed. Current backups: ${backups.length}, Keep: ${keepCount}`);
      return {
        success: true,
        deleted: 0,
        kept: backups.length
      };
    }

    const backupsToDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of backupsToDelete) {
      fs.unlinkSync(backup.path);
      deletedCount++;
    }

    console.log(`✓ Cleaned up ${deletedCount} old backup(s), kept ${keepCount} most recent`);
    
    return {
      success: true,
      deleted: deletedCount,
      kept: keepCount
    };
  } catch (error) {
    console.error('Error cleaning up backups:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// If run directly from command line
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  const scriptPath = process.argv[1];
  
  // Check if this module is being run directly
  if (modulePath === scriptPath || modulePath.replace(/\\/g, '/') === scriptPath.replace(/\\/g, '/')) {
    console.log('=== Database Backup Utility ===\n');
    
    const command = process.argv[2];
    
    if (command === 'list') {
      const backups = listBackups();
      if (backups.length === 0) {
        console.log('No backups found.');
      } else {
        console.log(`Found ${backups.length} backup(s):\n`);
        backups.forEach((backup, index) => {
          const sizeKB = (backup.size / 1024).toFixed(2);
          console.log(`${index + 1}. ${backup.fileName}`);
          console.log(`   Size: ${sizeKB} KB`);
          console.log(`   Created: ${backup.created.toLocaleString()}\n`);
        });
      }
    } else if (command === 'cleanup') {
      const keepCount = parseInt(process.argv[3]) || 10;
      cleanupOldBackups(keepCount);
    } else {
      // Default: create backup
      const result = backupDatabase();
      if (!result.success) {
        process.exit(1);
      }
    }
  }
}
