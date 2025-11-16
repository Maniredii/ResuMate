# Fix Quick Apply Button Not Showing

## 🎯 Quick Fix (3 Steps)

### Step 1: Reload the Extension
1. Open Chrome
2. Go to: `chrome://extensions/`
3. Find "Job Application Automation"
4. Click the **🔄 Reload** button

### Step 2: Test the Button
1. Open the file: `extension/button-test.html` in Chrome
2. Wait 2 seconds for the extension to load
3. Check the **bottom-right corner** for the purple button
4. Look at the checklist on the page - it should show green checkmarks

### Step 3: Check Console
1. On the test page, press **F12** to open Developer Tools
2. Go to the **Console** tab
3. You should see messages like:
   ```
   [Quick Apply] Autofill script loaded!
   [Quick Apply] DOM already loaded, showing button...
   [Quick Apply] showQuickApplyButton called
   [Quick Apply] Button added to page!
   ```

---

## ✅ If Button Appears on Test Page

Great! The extension is working. Now test on real job sites:

### Supported Sites:
- ✅ `https://www.indeed.com/*`
- ✅ `https://wellfound.com/*`
- ✅ `https://www.linkedin.com/*`
- ✅ `https://*.greenhouse.io/*`
- ✅ `https://*.lever.co/*`
- ✅ `https://*.workday.com/*`

**Note:** The button only appears on pages matching these patterns!

### Test on Indeed:
1. Go to: `https://www.indeed.com`
2. Search for any job
3. Open a job posting
4. Look for the button in bottom-right corner

---

## ❌ If Button Does NOT Appear

### Fix 1: Check Extension is Enabled
1. Go to `chrome://extensions/`
2. Make sure "Job Application Automation" has the toggle **ON** (blue)
3. Reload the extension

### Fix 2: Check File Exists
Make sure this file exists: `extension/autofill.js`

If it's missing, the button won't work.

### Fix 3: Manually Create Button (Test)
1. Open `extension/button-test.html`
2. Click the **"Manually Create Button"** button
3. If the button appears, the extension isn't loading the script
4. If the button doesn't appear, there's a JavaScript error

### Fix 4: Check Manifest
Open `extension/manifest.json` and verify it has:

```json
"content_scripts": [
  {
    "matches": [
      "https://www.indeed.com/*",
      "https://wellfound.com/*",
      "https://www.linkedin.com/*",
      "https://*.greenhouse.io/*",
      "https://*.lever.co/*",
      "https://*.workday.com/*",
      "https://*.myworkdayjobs.com/*"
    ],
    "js": ["autofill.js", "content.js"],
    "css": ["content.css"],
    "run_at": "document_idle"
  }
]
```

---

## 🔍 Debugging

### Check if Script Loaded:
1. Open any webpage
2. Press **F12** → Console
3. Type: `window.autoFillForm`
4. Press Enter
5. **If it shows `function`** → Script loaded ✓
6. **If it shows `undefined`** → Script not loaded ✗

### Check Console for Errors:
1. Press **F12** → Console
2. Look for red error messages
3. Common errors:
   - `chrome.storage is not defined` → Extension not loaded
   - `Cannot read property 'appendChild'` → DOM not ready
   - No messages at all → Script not injected

---

## 🎯 Expected Behavior

When working correctly:

### On Test Page (button-test.html):
- ✅ Green checkmarks in checklist
- ✅ Purple button in bottom-right
- ✅ Console shows "[Quick Apply]" messages
- ✅ Button says "⚡ Quick Apply"

### On Job Sites:
- ✅ Button appears automatically
- ✅ Click button → Form fills
- ✅ Success message shows

---

## 📝 Still Not Working?

### Try This:
1. **Close ALL Chrome windows**
2. **Reopen Chrome**
3. **Go to chrome://extensions/**
4. **Reload the extension**
5. **Open button-test.html**
6. **Wait 3 seconds**
7. **Check bottom-right corner**

### If Still Broken:
1. Open `extension/button-test.html`
2. Press **F12**
3. Take a screenshot of:
   - The checklist section
   - The console output
4. Check if any errors are shown

---

## 🚀 Quick Test Command

Open `extension/button-test.html` and paste this in the console:

```javascript
// Force create button
const btn = document.createElement('button');
btn.id = 'quick-apply-btn';
btn.innerHTML = '⚡ Quick Apply';
btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;border-radius:50px;padding:14px 24px;font-size:15px;font-weight:600;cursor:pointer;';
document.body.appendChild(btn);
console.log('Button created!');
```

If this creates a button, the extension is not loading the script automatically.

---

## ✅ Summary

1. **Reload extension** in chrome://extensions/
2. **Open button-test.html** to test
3. **Check console** for [Quick Apply] messages
4. **Look for button** in bottom-right corner
5. **Test on real job sites** (Indeed, LinkedIn, etc.)

The button should appear automatically on supported job sites!
