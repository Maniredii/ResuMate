# Database Backups

This directory contains automated backups of the SQLite database.

## Backup File Naming Convention

Backup files follow this format:
```
database_backup_YYYY-MM-DD_HH-MM-SS.db
```

Example: `database_backup_2024-11-15_14-30-45.db`

## Creating Backups

### Manual Backup
Run the backup script manually:
```bash
npm run backup
```

### Programmatic Backup
You can also create backups programmatically in your code:
```javascript
import { backupDatabase } from './utils/backup.js';

const result = backupDatabase();
if (result.success) {
  console.log('Backup created:', result.backupPath);
}
```

## Managing Backups

### List All Backups
```bash
npm run backup:list
```

### Cleanup Old Backups
Keep only the 10 most recent backups:
```bash
npm run backup:cleanup
```

Keep a specific number of backups:
```bash
npm run backup:cleanup 5
```

## Restoring from Backup

To restore from a backup:

1. Stop the application server
2. Navigate to the backend directory
3. Replace the current database with a backup:
   ```bash
   cp backups/database_backup_YYYY-MM-DD_HH-MM-SS.db database.db
   ```
4. Restart the application server

## Backup Best Practices

- Create backups before major updates or migrations
- Keep backups in a separate location for disaster recovery
- Test restore procedures periodically
- Consider automating backups with cron jobs or scheduled tasks

## Automated Cleanup

The cleanup utility keeps the most recent backups and removes older ones to save disk space. By default, it keeps the 10 most recent backups.
