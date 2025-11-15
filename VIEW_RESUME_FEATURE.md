# View Resume Feature

## Overview
Added functionality to view and download the uploaded resume directly from the application.

## Features Added

### 1. View Resume
- Opens resume in a new browser tab
- Displays the .docx file inline
- No download required for quick viewing

### 2. Download Resume
- Downloads the resume file to your computer
- Saves as `resume.docx`
- One-click download

## Implementation

### Backend Endpoints

#### GET /api/upload/view-resume
Opens the resume in the browser for viewing.

**Authentication:** Required (JWT token)

**Response:** Streams the .docx file with `Content-Disposition: inline`

**Usage:**
```
GET http://localhost:5000/api/upload/view-resume?token=YOUR_JWT_TOKEN
```

#### GET /api/upload/download-resume
Downloads the resume file.

**Authentication:** Required (JWT token in header)

**Response:** Streams the .docx file with `Content-Disposition: attachment`

**Usage:**
```javascript
fetch('http://localhost:5000/api/upload/download-resume', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
```

### Frontend Integration

#### Dashboard
Added two buttons in the "Resume Status" card:
- **View Resume** - Opens in new tab
- **Download** - Downloads to computer

```jsx
{hasResume && (
  <div className="flex gap-2 mt-3">
    <a href="..." target="_blank" className="...">
      View Resume
    </a>
    <button onClick={handleDownload} className="...">
      Download
    </button>
  </div>
)}
```

#### Settings Page
Added two buttons next to "Resume Status":
- **View** - Opens in new tab
- **Download** - Downloads to computer

```jsx
{user?.resume_path && (
  <div className="flex gap-2">
    <a href="..." target="_blank" className="...">
      View
    </a>
    <button onClick={handleDownload} className="...">
      Download
    </button>
  </div>
)}
```

## User Experience

### Viewing Resume
1. Click "View Resume" or "View" button
2. New browser tab opens
3. Resume displays in browser (if browser supports .docx)
4. Can read, scroll, and review content
5. Close tab when done

### Downloading Resume
1. Click "Download" button
2. Browser downloads file automatically
3. File saved as `resume.docx` in Downloads folder
4. Can open with Microsoft Word or compatible app

## Security

### Authentication
- Both endpoints require JWT authentication
- Token validated before serving file
- Only user's own resume can be accessed

### File Access Control
- User ID extracted from JWT token
- Resume path retrieved from database for that user
- File path validated to prevent directory traversal
- File existence checked before streaming

### Error Handling
```javascript
// No resume uploaded
404: "Resume not found"

// File doesn't exist on disk
404: "File not found"

// Streaming error
500: "Stream error"

// Authentication failure
401: "Unauthorized"
```

## Technical Details

### File Streaming
```javascript
// Set headers
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
res.setHeader('Content-Disposition', 'inline; filename="resume.docx"');

// Stream file
const fileStream = fs.createReadStream(resumePath);
fileStream.pipe(res);
```

### Download Implementation
```javascript
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'resume.docx';
a.click();
```

## Files Modified

### Backend
- `backend/routes/upload.js`
  - Added `GET /view-resume` endpoint
  - Added `GET /download-resume` endpoint

### Frontend
- `frontend/src/services/api.js`
  - Added `viewResume()` method
  - Added `downloadResume()` method

- `frontend/src/pages/Dashboard.jsx`
  - Added View/Download buttons to Resume Status card

- `frontend/src/pages/Settings.jsx`
  - Added View/Download buttons to Resume Status section

## UI Components

### Button Styles

**View Button:**
- Blue background (`bg-blue-100`)
- Blue text (`text-blue-700`)
- Hover effect (`hover:bg-blue-200`)
- Small size (`text-xs` or `text-sm`)

**Download Button:**
- Green background (`bg-green-100`)
- Green text (`text-green-700`)
- Hover effect (`hover:bg-green-200`)
- Small size (`text-xs` or `text-sm`)

### Placement

**Dashboard:**
```
┌─────────────────────────┐
│ Resume Status           │
│ ✓ Uploaded              │
│ Resume is ready...      │
│ [View Resume] [Download]│
└─────────────────────────┘
```

**Settings:**
```
Resume Status
✓ Resume uploaded    [View] [Download]
```

## Benefits

### For Users
- ✅ Quick access to resume
- ✅ No need to remember file location
- ✅ View without downloading
- ✅ Download fresh copy anytime
- ✅ Verify resume content before applying

### For System
- ✅ Secure file access
- ✅ Authenticated endpoints
- ✅ Efficient file streaming
- ✅ No temporary files created

## Testing

### Test Cases
1. ✅ View resume with valid token
2. ✅ Download resume with valid token
3. ✅ View resume without token (should fail)
4. ✅ View resume for user without uploaded resume (should fail)
5. ✅ Download resume when file doesn't exist (should fail)
6. ✅ View button opens new tab
7. ✅ Download button saves file

### Expected Behavior
- View opens in new tab
- Download saves to Downloads folder
- Buttons only visible when resume exists
- Error messages for failures
- Secure access (own resume only)

## Browser Compatibility

### View Resume
- **Chrome/Edge:** Opens in browser with Word Online viewer
- **Firefox:** May prompt to download
- **Safari:** May prompt to download

### Download Resume
- **All Browsers:** Downloads to default Downloads folder
- **File Name:** `resume.docx`
- **File Type:** Microsoft Word Document

## Future Enhancements

1. **Preview Modal:** Show resume preview in modal instead of new tab
2. **PDF Conversion:** Convert .docx to PDF for viewing
3. **Version History:** View previous versions of resume
4. **Rename Download:** Use original filename instead of generic name
5. **Print Option:** Direct print from browser
6. **Share Link:** Generate temporary share link
7. **Compare Versions:** Compare current vs original resume

## Troubleshooting

### View Button Not Working
- Check if popup blocker is enabled
- Verify JWT token is valid
- Check browser console for errors

### Download Not Starting
- Check browser download settings
- Verify sufficient disk space
- Check browser console for errors

### File Not Found Error
- Resume may have been deleted from server
- Re-upload resume
- Contact administrator

## Summary

The View Resume feature provides users with convenient access to their uploaded resume directly from the application. With secure authentication and efficient file streaming, users can quickly view or download their resume whenever needed.

**Status:** ✅ Implemented and tested
**Locations:** Dashboard, Settings
**Endpoints:** `/api/upload/view-resume`, `/api/upload/download-resume`
