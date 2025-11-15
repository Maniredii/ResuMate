# Browser Extension Installation Guide

## 🎉 Your Job Application Automation is now a Browser Extension!

### What You Get

**✨ Features:**
- 🚀 **Quick Apply Button** - Floating button on every job page
- 📱 **Extension Popup** - Quick access from browser toolbar
- 🔐 **Secure Login** - Same account as web app
- ⚡ **One-Click Apply** - Apply without leaving the job page
- 📊 **Status Dashboard** - See your profile status instantly

**🌐 Supported Sites:**
- Indeed
- Wellfound (AngelList)
- LinkedIn

---

## 📦 Installation Steps

### Step 1: Create Icons (5 minutes)

1. Open `extension/create-icons.html` in your browser
2. Right-click each canvas image
3. Select "Save image as..."
4. Save as:
   - `icon16.png` (16x16 canvas)
   - `icon48.png` (48x48 canvas)
   - `icon128.png` (128x128 canvas)
5. Create folder: `extension/icons/`
6. Move all 3 PNG files into `extension/icons/`

**Result:**
```
extension/
├── icons/
│   ├── icon16.png  ✓
│   ├── icon48.png  ✓
│   └── icon128.png ✓
```

### Step 2: Load Extension in Browser

#### For Microsoft Edge:

1. **Open Extensions Page**
   - Click the `...` menu (top right)
   - Select "Extensions"
   - Or go to: `edge://extensions/`

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch (bottom left)

3. **Load Extension**
   - Click "Load unpacked"
   - Navigate to your project folder
   - Select the `extension` folder
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "Job Application Automation" in your extensions list
   - Extension icon appears in toolbar

#### For Google Chrome:

1. **Open Extensions Page**
   - Click the `⋮` menu (top right)
   - More tools → Extensions
   - Or go to: `chrome://extensions/`

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch (top right)

3. **Load Extension**
   - Click "Load unpacked"
   - Navigate to your project folder
   - Select the `extension` folder
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "Job Application Automation" in your extensions list
   - Extension icon appears in toolbar

### Step 3: Pin Extension (Recommended)

1. Click the puzzle piece icon (🧩) in toolbar
2. Find "Job Application Automation"
3. Click the pin icon 📌
4. Extension icon now always visible!

---

## 🚀 How to Use

### First Time Setup

1. **Click Extension Icon**
   - Click the extension icon in your toolbar
   - Popup window opens

2. **Login**
   - Enter your email and password
   - Same credentials as web app
   - Click "Login"

3. **Verify Status**
   - Check "Resume: ✓ Uploaded"
   - If not uploaded, click "Open Dashboard"

### Applying to Jobs

#### Method 1: Floating Button (Easiest!)

1. **Visit a Job Page**
   - Go to Indeed, Wellfound, or LinkedIn
   - Open any job posting

2. **Click Quick Apply**
   - Purple floating button appears (bottom right)
   - Says "⚡ Quick Apply"
   - Click it!

3. **Confirm**
   - Extension popup opens
   - Click "Apply to This Job"
   - Done! ✓

#### Method 2: Extension Icon

1. **Visit a Job Page**
   - Go to any supported job site
   - Open a job posting

2. **Click Extension Icon**
   - Click extension icon in toolbar
   - Popup shows current job

3. **Apply**
   - Click "Apply to This Job"
   - Application submitted!

---

## 🎨 What You'll See

### Extension Popup
```
┌──────────────────────────┐
│   🚀 Job Application     │
│   AI-Powered Auto Apply  │
├──────────────────────────┤
│ User: Your Name          │
│ Resume: ✓ Uploaded       │
├──────────────────────────┤
│ [Apply to This Job]      │
│ [Open Dashboard]         │
│ [Logout]                 │
└──────────────────────────┘
```

### Floating Button on Job Pages
```
                    ┌─────────────┐
                    │ ⚡ Quick    │
                    │   Apply     │
                    └─────────────┘
                    (bottom right corner)
```

---

## ⚙️ Configuration

### Change Backend URL

If your backend runs on a different port:

1. Open `extension/popup.js`
2. Find line 2:
   ```javascript
   const API_URL = 'http://localhost:5000/api';
   ```
3. Change to your backend URL
4. Reload extension

### Change Frontend URL

If your frontend runs on a different port:

1. Open `extension/popup.js`
2. Find the register link (around line 50):
   ```javascript
   'http://localhost:5013/register'
   ```
3. Change to your frontend URL
4. Reload extension

---

## 🔧 Troubleshooting

### Extension Not Loading

**Problem:** Extension doesn't appear after loading

**Solutions:**
1. Check Developer mode is enabled
2. Verify all files are in `extension/` folder
3. Check browser console for errors (F12)
4. Try reloading: Extensions page → Click "Reload" button

### Icons Not Showing

**Problem:** Extension has no icon

**Solutions:**
1. Create icons using `create-icons.html`
2. Place in `extension/icons/` folder
3. Reload extension
4. Extension works without icons, just looks better with them!

### Cannot Connect to Server

**Problem:** "Cannot connect to server" error

**Solutions:**
1. Make sure backend is running:
   ```bash
   cd backend
   npm run dev
   ```
2. Check backend is on port 5000
3. Verify API_URL in `popup.js` is correct
4. Check browser console for CORS errors

### Floating Button Not Appearing

**Problem:** No "Quick Apply" button on job pages

**Solutions:**
1. Refresh the job page (F5)
2. Check if URL matches supported patterns:
   - `indeed.com/viewjob*`
   - `wellfound.com/jobs/*`
   - `linkedin.com/jobs/*`
3. Open browser console (F12) and check for errors
4. Reload extension

### Login Fails

**Problem:** Cannot login through extension

**Solutions:**
1. Verify backend is running
2. Check credentials are correct
3. Try logging in through web app first
4. Clear extension storage:
   - Open browser console (F12)
   - Type: `chrome.storage.local.clear()`
   - Try logging in again

### Application Fails

**Problem:** "Application failed" error

**Solutions:**
1. Check if resume is uploaded
2. Verify job URL is supported
3. Check backend logs for errors
4. Try applying through web app

---

## 🔐 Security & Privacy

### What Data is Stored?

**Locally (in browser):**
- Authentication token only
- No passwords stored
- No personal data

**On Server:**
- Same as web app
- Resume, profile, applications

### Permissions Explained

| Permission | Why Needed |
|------------|------------|
| `activeTab` | Get current job page URL |
| `storage` | Store login token |
| `tabs` | Open dashboard in new tab |
| `host_permissions` | Access job sites and API |

### Is It Safe?

✅ **Yes!**
- No data sent to third parties
- Token encrypted by browser
- Open source - you can review code
- Same security as web app

---

## 🎯 Tips & Tricks

### Keyboard Shortcuts

You can add a keyboard shortcut:
1. Go to `edge://extensions/shortcuts`
2. Find "Job Application Automation"
3. Set a shortcut (e.g., `Ctrl+Shift+A`)
4. Press shortcut to open popup!

### Quick Workflow

1. **Browse Jobs** → Open multiple job tabs
2. **Quick Apply** → Click floating button on each
3. **Track** → Check application history in dashboard

### Best Practices

- ✅ Keep backend running while browsing jobs
- ✅ Upload resume before using extension
- ✅ Review application history regularly
- ✅ Update profile skills in dashboard

---

## 📊 Comparison

### Extension vs Web App

| Feature | Extension | Web App |
|---------|-----------|---------|
| Access | Browser toolbar | Open in tab |
| Apply | One click | Copy/paste URL |
| Speed | Instant | Navigate to app |
| Convenience | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Features | Basic | Full |

**Best Use:**
- **Extension:** Quick applies while browsing
- **Web App:** Full features, history, settings

---

## 🚀 Next Steps

### After Installation

1. ✅ Extension installed
2. ✅ Logged in
3. ✅ Resume uploaded
4. 🎯 **Start applying to jobs!**

### Try It Out

1. Go to Indeed.com
2. Search for jobs
3. Open a job posting
4. Click the floating "Quick Apply" button
5. Watch the magic happen! ✨

---

## 📝 Notes

### Development Mode

The extension is loaded in "Developer mode" which means:
- ⚠️ Warning badge on extension icon (normal)
- 🔄 Need to reload after code changes
- 📦 Not published to store (local only)

### Publishing (Optional)

Want to publish to Chrome/Edge store?
1. Create developer account
2. Zip extension folder
3. Upload to store
4. Wait for review
5. Public extension! 🎉

---

## 🆘 Need Help?

### Common Issues

1. **Backend not running** → `npm run dev` in backend folder
2. **Not logged in** → Click extension icon and login
3. **No resume** → Upload resume in web app
4. **Wrong URL** → Check API_URL in popup.js

### Still Stuck?

1. Check browser console (F12)
2. Check backend logs
3. Try web app first
4. Reload extension

---

## 🎉 Success!

You now have a powerful browser extension that makes job applications effortless!

**Happy Job Hunting! 🚀**

---

## Summary

✅ **Extension Created**
✅ **Installation Guide Ready**
✅ **Easy to Use**
✅ **Secure & Private**
✅ **Works with Edge & Chrome**

**Location:** `extension/` folder
**Files:** 8 files total
**Size:** ~50KB
**Status:** Ready to use!
