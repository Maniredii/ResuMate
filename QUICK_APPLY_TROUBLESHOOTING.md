# Quick Apply Button Not Visible - Troubleshooting

## 🔍 Step-by-Step Debugging

### Step 1: Reload the Extension
1. Open Chrome and go to: `chrome://extensions/`
2. Find "Job Application Automation"
3. Click the **🔄 Reload** button
4. ✅ Extension reloaded

### Step 2: Test on the Test Page
1. Open `extension/test-form.html` in your browser
2. Open Developer Tools (Press **F12**)
3. Go to the **Console** tab
4. Look for these messages:
   ```
   [Quick Apply] Autofill script loaded!
   [Quick Apply] DOM already loaded, showing button...
   [Quick Apply] showQuickApplyButton called
   [Quick Apply] Button added to page!
   ```
5. Look in the **bottom-right corner** of the page for the purple button

### Step 3: Check for Errors
If you see errors in the console:

**Error: "Cannot read property 'appendChild'"**
- The script is running before the page loads
- This should be fixed by the DOMContentLoaded check

**Error: "chrome.storage is not defined"**
- The script is not running as a content script
- Check manifest.json permissions

**No console messages at all:**
- The script is not loading
- Check manifest.json content_scripts section

### Step 4: Verify Manifest Configuration

Open `extension/manifest.json` and verify:

```json
{
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
}
```

### Step 5: Test on Real Job Sites

After confirming it works on test-form.html:

1. Go to a job site (e.g., `https://www.indeed.com`)
2. Open Developer Tools (F12)
3. Check Console for the Quick Apply messages
4. Look for the button in bottom-right corner

**Note:** The button only appears on pages that match the patterns in manifest.json

### Step 6: Check File Permissions

Make sure the files exist:
```
extension/
├── autofill.js  ✓ Must exist
├── content.js   ✓ Must exist
├── manifest.json ✓ Must exist
└── popup.js     ✓ Must exist
```

### Step 7: Clear Extension Storage (If Needed)

If the button still doesn't appear:

1. Open Developer Tools (F12)
2. Go to **Application** tab
3. Expand **Storage** → **Local Storage**
4. Find `chrome-extension://[your-extension-id]`
5. Right-click → **Clear**
6. Reload the page

---

## 🎯 Quick Fixes

### Fix 1: Force Reload Everything
```bash
1. Close all Chrome windows
2. Reopen Chrome
3. Go to chrome://extensions/
4. Reload the extension
5. Test on test-form.html
```

### Fix 2: Check if Script is Blocked
1. Open test-form.html
2. Press F12
3. Go to **Network** tab
4. Reload page
5. Look for `autofill.js` in the list
6. If it's red or missing, the script isn't loading

### Fix 3: Verify Content Script Injection
1. Open test-form.html
2. Press F12
3. Go to **Console** tab
4. Type: `window.autoFillForm`
5. Press Enter
6. If it says `undefined`, the script didn't load
7. If it shows `function`, the script loaded successfully

---

## 🧪 Manual Test

If automatic loading fails, test manually:

1. Open test-form.html
2. Press F12 → Console
3. Copy and paste this code:

```javascript
// Create button manually
const btn = document.createElement('button');
btn.id = 'quick-apply-btn';
btn.innerHTML = '⚡ Quick Apply';
btn.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
`;
document.body.appendChild(btn);
console.log('Button added!');
```

4. Press Enter
5. You should see the button appear

If this works, the issue is with the extension loading, not the button code.

---

## 🔧 Common Issues

### Issue 1: Button Not Visible on Job Sites
**Cause:** URL doesn't match manifest patterns
**Fix:** Check if the job site URL matches the patterns in manifest.json

### Issue 2: Button Appears Then Disappears
**Cause:** Page JavaScript is removing it
**Fix:** The button has high z-index (999999), but some sites may still remove it

### Issue 3: Console Shows "chrome.storage is not defined"
**Cause:** Script not running as content script
**Fix:** Verify manifest.json has correct content_scripts configuration

### Issue 4: No Console Messages
**Cause:** Script not loading at all
**Fix:** 
- Check file path in manifest.json
- Verify autofill.js exists
- Reload extension

---

## ✅ Expected Behavior

When working correctly:

1. **Console shows:**
   ```
   [Quick Apply] Autofill script loaded!
   [Quick Apply] DOM already loaded, showing button...
   [Quick Apply] showQuickApplyButton called
   [Quick Apply] Button added to page!
   ```

2. **Button appears:**
   - Bottom-right corner
   - Purple gradient background
   - Lightning bolt icon
   - "Quick Apply" text

3. **Button works:**
   - Click it
   - Shows "Filling..." with spinner
   - Form fields fill with data
   - Shows success message

---

## 📞 Still Not Working?

### Check These:

1. ✅ Extension is enabled in chrome://extensions/
2. ✅ Extension has been reloaded after changes
3. ✅ autofill.js file exists and has content
4. ✅ manifest.json includes autofill.js in content_scripts
5. ✅ You're testing on a supported URL pattern
6. ✅ Browser console shows no errors
7. ✅ Profile is saved (check Profile tab in extension)

### Debug Commands:

Open console on any page and run:

```javascript
// Check if autofill script loaded
console.log(typeof window.autoFillForm);
// Should show: "function"

// Check if button exists
console.log(document.getElementById('quick-apply-btn'));
// Should show: <button> element or null

// Manually trigger button creation
if (window.showQuickApplyButton) {
  window.showQuickApplyButton();
}
```

---

## 🎯 Next Steps

1. **Reload extension** in chrome://extensions/
2. **Open test-form.html** in browser
3. **Press F12** to open console
4. **Look for console messages** starting with [Quick Apply]
5. **Look for button** in bottom-right corner
6. **Click button** to test auto-fill

If you see the console messages but no button, there may be a CSS issue.
If you see no console messages, the script isn't loading.

---

## 📝 Report Issue

If still not working, provide:
1. Console messages (screenshot)
2. Network tab (screenshot)
3. URL you're testing on
4. Chrome version
5. Extension manifest.json content

This will help diagnose the issue!
