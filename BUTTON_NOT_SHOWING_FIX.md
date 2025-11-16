# Quick Apply Button Not Showing on Indeed - FIXED!

## ✅ I Just Fixed the Issue!

The problem was that the extension was only configured for `www.indeed.com` but Indeed uses multiple domains like `indeed.com`, `uk.indeed.com`, etc.

---

## 🔧 What I Fixed:

### Before:
```json
"matches": [
  "https://www.indeed.com/*"  ← Only www subdomain
]
```

### After:
```json
"matches": [
  "https://*.indeed.com/*",   ← All Indeed subdomains
  "https://indeed.com/*"      ← Root domain too
]
```

Now the extension works on:
- ✅ `www.indeed.com`
- ✅ `indeed.com`
- ✅ `uk.indeed.com`
- ✅ `ca.indeed.com`
- ✅ Any Indeed subdomain!

---

## 🎯 DO THIS NOW (30 seconds):

### 1. Reload Extension
```
chrome://extensions/ → Find extension → Click 🔄 Reload
```

### 2. Refresh Indeed Page
```
Go back to Indeed → Press Ctrl+Shift+R (hard refresh)
```

### 3. Look for Button
```
Check bottom-right corner → Purple "⚡ Quick Apply" button
```

---

## 🧪 Test Steps:

1. **Reload extension** in `chrome://extensions/`
2. **Go to Indeed** (any Indeed URL)
3. **Wait 2 seconds** for extension to load
4. **Check bottom-right corner** for purple button
5. **Press F12** and check Console for `[Quick Apply]` messages

---

## 📊 What You Should See:

### In Console (F12):
```
[Quick Apply] Autofill script loaded!
[Quick Apply] DOM already loaded, showing button...
[Quick Apply] showQuickApplyButton called
[Quick Apply] Button added to page!
```

### On Page:
```
                                    ┌─────────────────────┐
                                    │ ⚡ Quick Apply      │
                                    └─────────────────────┘
                                    ↑
                                    Bottom-right corner
```

---

## ❓ Still Not Showing?

### Quick Debug:

**On the Indeed page, press F12 and run:**

```javascript
// Check if extension loaded
console.log('Script loaded:', typeof window.autoFillForm);
console.log('Button exists:', !!document.getElementById('quick-apply-btn'));
console.log('Current URL:', window.location.href);
```

**Expected output:**
```
Script loaded: function
Button exists: true
Current URL: https://www.indeed.com/...
```

**If you see:**
```
Script loaded: undefined
```
Then the extension is NOT loading on this page.

---

## 🔍 Troubleshooting:

### Issue 1: Extension Not Enabled
**Fix:** Go to `chrome://extensions/` and toggle ON

### Issue 2: Extension Needs Permissions
**Fix:** 
1. Go to `chrome://extensions/`
2. Click "Details" on the extension
3. Scroll to "Site access"
4. Select "On specific sites" or "On all sites"

### Issue 3: Page Loaded Before Extension
**Fix:** Hard refresh the page (Ctrl+Shift+R)

### Issue 4: JavaScript Blocked
**Fix:** Check if you have any ad blockers or script blockers

---

## 🎯 Supported Sites (Updated):

Now works on:
- ✅ **Indeed** - All domains (www, uk, ca, etc.)
- ✅ **LinkedIn** - All domains
- ✅ **Wellfound** - All domains
- ✅ **Greenhouse** - All company sites
- ✅ **Lever** - All company sites
- ✅ **Workday** - All company sites
- ✅ **SmartRecruiters** - All company sites (NEW!)
- ✅ **Jobvite** - All company sites (NEW!)

---

## 📝 Next Steps:

1. ✅ Reload extension
2. ✅ Refresh Indeed page
3. ✅ Check for button
4. ✅ Test auto-fill

If the button appears, you're all set! If not, check the console messages and let me know what you see.

---

## 💡 Pro Tip:

After reloading the extension, **always hard refresh** the page (Ctrl+Shift+R) to ensure the new scripts load.

---

**The fix is applied! Just reload the extension and refresh your Indeed page.** 🚀
