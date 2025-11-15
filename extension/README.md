# Job Application Automation - Browser Extension

## Overview
A Chrome/Edge browser extension that integrates with the Job Application Automation system, allowing you to apply to jobs directly from job posting pages.

## Features

### 🚀 Quick Apply Button
- Floating button appears on Indeed, Wellfound, and LinkedIn job pages
- One-click application from any job page
- No need to copy/paste URLs

### 📊 Extension Popup
- View your profile status
- Check if resume is uploaded
- Quick access to dashboard
- Apply to current job page
- Logout functionality

### 🔐 Secure Authentication
- Login directly from extension
- Token-based authentication
- Secure API communication

## Installation

### Step 1: Load Extension in Browser

#### For Chrome:
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder
6. Extension installed! ✓

#### For Edge:
1. Open Edge
2. Go to `edge://extensions/`
3. Enable "Developer mode" (bottom left)
4. Click "Load unpacked"
5. Select the `extension` folder
6. Extension installed! ✓

### Step 2: Add Icons (Optional)
The extension needs icons. You can:
1. Create icons (16x16, 48x48, 128x128 PNG files)
2. Place them in `extension/icons/` folder
3. Name them: `icon16.png`, `icon48.png`, `icon128.png`

Or use placeholder icons (extension will work without them).

### Step 3: Start Backend
Make sure your backend server is running:
```bash
cd backend
npm run dev
```

### Step 4: Use Extension
1. Navigate to a job page (Indeed, Wellfound, LinkedIn)
2. Click the extension icon or the floating "Quick Apply" button
3. Login if not already logged in
4. Click "Apply to This Job"
5. Done! ✓

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── content.js            # Content script (runs on job pages)
├── content.css           # Floating button styles
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## How It Works

### 1. Content Script
- Runs on job pages (Indeed, Wellfound, LinkedIn)
- Adds floating "Quick Apply" button
- Detects current job URL

### 2. Popup
- Shows user status (logged in, resume uploaded)
- Provides quick apply button
- Links to main dashboard

### 3. Background Script
- Handles messages between content script and popup
- Manages extension state

### 4. API Integration
- Connects to backend at `http://localhost:5000/api`
- Uses same authentication as web app
- Calls `/job/apply-job` endpoint

## Usage

### First Time Setup
1. Click extension icon
2. Login with your credentials
3. Make sure resume is uploaded (if not, click "Open Dashboard")

### Applying to Jobs
**Method 1: Floating Button**
1. Visit a job page
2. Click the purple "Quick Apply" button (bottom right)
3. Confirm in popup
4. Application submitted!

**Method 2: Extension Icon**
1. Visit a job page
2. Click extension icon in toolbar
3. Click "Apply to This Job"
4. Application submitted!

## Supported Platforms

| Platform | URL Pattern | Status |
|----------|-------------|--------|
| Indeed | `indeed.com/viewjob*` | ✅ Supported |
| Wellfound | `wellfound.com/jobs/*` | ✅ Supported |
| LinkedIn | `linkedin.com/jobs/*` | ✅ Supported (scraping only) |

## Configuration

### Change API URL
Edit `popup.js`:
```javascript
const API_URL = 'http://localhost:5000/api';
// Change to your backend URL
```

### Change Frontend URL
Edit `popup.js` (login/register links):
```javascript
'http://localhost:5013/register'
// Change to your frontend URL
```

### Add More Platforms
Edit `manifest.json`:
```json
"content_scripts": [{
  "matches": [
    "https://www.indeed.com/viewjob*",
    "https://wellfound.com/jobs/*",
    "https://www.linkedin.com/jobs/*",
    "https://your-new-platform.com/*"  // Add here
  ]
}]
```

## Permissions

The extension requests these permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab URL |
| `storage` | Store authentication token |
| `tabs` | Open dashboard in new tab |
| `host_permissions` | Access job sites and API |

## Security

### Token Storage
- Authentication token stored in `chrome.storage.local`
- Encrypted by browser
- Cleared on logout

### API Communication
- HTTPS recommended for production
- Token sent in Authorization header
- No sensitive data in URLs

## Troubleshooting

### Extension Not Loading
- Check Developer mode is enabled
- Verify all files are in `extension/` folder
- Check browser console for errors

### Cannot Connect to Server
- Make sure backend is running (`npm run dev`)
- Check API_URL in `popup.js` matches your backend
- Verify CORS is enabled in backend

### Floating Button Not Appearing
- Refresh the job page after installing extension
- Check if URL matches patterns in `manifest.json`
- Open browser console and check for errors

### Login Fails
- Verify backend is running
- Check credentials are correct
- Clear extension storage: `chrome.storage.local.clear()`

## Development

### Testing Changes
1. Make changes to extension files
2. Go to `chrome://extensions/` or `edge://extensions/`
3. Click "Reload" button on your extension
4. Test on a job page

### Debugging
- **Popup**: Right-click extension icon → "Inspect popup"
- **Content Script**: Open DevTools on job page → Console
- **Background**: Extensions page → "Inspect views: service worker"

## Publishing (Optional)

### Chrome Web Store
1. Create developer account ($5 one-time fee)
2. Zip extension folder
3. Upload to Chrome Web Store
4. Submit for review

### Edge Add-ons
1. Create developer account (free)
2. Zip extension folder
3. Upload to Edge Add-ons
4. Submit for review

## Limitations

### Current Limitations
- Backend must be running locally
- No offline functionality
- LinkedIn auto-apply not supported (scraping only)
- Requires manual login

### Future Enhancements
- Cloud-hosted backend
- Offline mode
- Auto-login with saved credentials
- Batch apply to multiple jobs
- Application tracking
- Browser notifications

## Screenshots

### Extension Popup
```
┌─────────────────────────┐
│  🚀 Job Application     │
│  AI-Powered Auto Apply  │
├─────────────────────────┤
│ User: John Doe          │
│ Resume: ✓ Uploaded      │
├─────────────────────────┤
│ [Apply to This Job]     │
│ [Open Dashboard]        │
│ [Logout]                │
└─────────────────────────┘
```

### Floating Button
```
Job Page
─────────────────────────
                         │
                         │
                    ┌────┴────┐
                    │ ⚡ Quick │
                    │  Apply  │
                    └─────────┘
```

## Support

### Issues
- Backend not connecting: Check if server is running
- Extension not working: Reload extension
- Login fails: Verify credentials

### Resources
- Main App: `http://localhost:5013`
- API Docs: `http://localhost:5000/api`
- GitHub: [Your repo URL]

## License
Same as main application

## Version History

### v1.0.0 (Current)
- Initial release
- Basic popup functionality
- Floating quick apply button
- Indeed, Wellfound, LinkedIn support
- Secure authentication
