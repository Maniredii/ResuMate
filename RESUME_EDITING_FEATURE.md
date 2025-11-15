# Resume In-Place Editing Feature

## Overview
Instead of creating multiple tailored resume copies, the system now edits the existing resume file in place, saving storage space and keeping everything organized.

## How It Works

### 1. First Time Application
- When you apply to your first job, the system creates a backup of your original resume
- The backup is saved as `[filename]_original.docx` (or `.txt`)
- Your main resume file is then updated with tailored content

### 2. Subsequent Applications
- Each time you apply to a new job, your resume is tailored and updated in place
- The original backup remains untouched
- No new files are created - space efficient!

### 3. Restoring Original Resume
- You can restore your original resume anytime from Settings
- The backup file is copied back to replace the tailored version
- Your original resume is preserved forever

## Features

### ✅ Space Efficient
- No multiple copies of tailored resumes
- Only one backup file created (first time only)
- Main resume file is updated in place

### ✅ Word Document Format Only
- **Word Documents (.docx)**: Only format supported for resumes
- Proper formatting preservation
- Professional document editing

### ✅ Safe Backup System
- Original resume is backed up automatically
- Backup is created only once (first application)
- Restore functionality available in Settings

### ✅ Seamless Integration
- Works with existing auto-apply workflow
- No changes needed to user workflow
- Transparent to the user

## Technical Implementation

### New Service: `document.service.js`

**Functions:**
- `readWordDocument(filePath)` - Reads .docx files
- `updateWordDocument(filePath, newContent)` - Updates .docx files in place
- `createResumeBackup(filePath)` - Creates backup (first time only)
- `restoreOriginalResume(filePath)` - Restores from backup
- `readResumeContent(filePath)` - Reads any resume format
- `updateResumeContent(filePath, newContent)` - Updates any resume format

### Dependencies Added
- `docx` - For creating/editing Word documents
- `mammoth` - For reading Word documents

### Updated Files

**Backend:**
1. `backend/services/document.service.js` - New service for document handling
2. `backend/routes/job.js` - Updated to use in-place editing
3. `package.json` - Added docx and mammoth dependencies

**Frontend:**
1. `frontend/src/pages/Settings.jsx` - Added restore resume button
2. `frontend/src/services/api.js` - Added restore API method

## API Endpoints

### POST /api/job/restore-original-resume
Restores the original resume from backup.

**Request:** None (uses authenticated user)

**Response:**
```json
{
  "message": "Original resume restored successfully",
  "resumePath": "backend/uploads/resumes/5_1234567890_resume.docx"
}
```

**Error Response:**
```json
{
  "error": "Backup Not Found",
  "message": "No backup of the original resume was found."
}
```

## User Workflow

### Applying to Jobs
1. User clicks "Apply to Job"
2. System creates backup (if first time)
3. System reads current resume
4. AI tailors resume for the job
5. System updates resume file in place
6. Auto-apply uses the updated resume
7. Application is submitted

### Restoring Original
1. User goes to Settings
2. Scrolls to "Resume Management" section
3. Clicks "Restore Original Resume"
4. Confirms the action
5. Original resume is restored
6. Success message is displayed

## File Structure

```
backend/uploads/resumes/
├── 5_1763193050517_sample_resume.docx          # Current (tailored) resume
└── 5_1763193050517_sample_resume_original.docx # Original backup
```

**Note:** Only .docx (Word Document) files are accepted for resumes.

## Benefits

### For Users
- ✅ No clutter from multiple resume files
- ✅ Always know which resume is current
- ✅ Can restore original anytime
- ✅ Saves storage space

### For System
- ✅ Reduced storage usage
- ✅ Simpler file management
- ✅ No need to track multiple versions
- ✅ Cleaner database records

## Important Notes

1. **Backup is Created Once**: The original backup is only created the first time you apply to a job. It's never overwritten.

2. **Word Document Support**: The system properly handles .docx files, preserving basic formatting.

3. **Restore Confirmation**: Users must confirm before restoring to prevent accidental overwrites.

4. **Database Records**: The database stores the path to the main resume file (which contains tailored content after applications).

5. **Manual Applications**: If auto-apply fails, users can still apply manually using the tailored resume.

6. **DOCX Only**: Only Word documents (.docx) are accepted for resumes to ensure proper editing and formatting.

## Future Enhancements

- Version history (keep last N tailored versions)
- Compare current vs original resume
- Export tailored resume as separate file
- Batch restore for multiple users
- Resume templates with better formatting preservation
