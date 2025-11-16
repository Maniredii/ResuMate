# 🔍 Debug Guide - Profile Not Updating

## Issue
Profile data is not saving/updating when clicking "Save Profile" button.

## Debugging Steps Added

I've added comprehensive logging to help identify the issue. Follow these steps:

### Step 1: Open Browser Console
```
1. Click extension icon to open popup
2. Right-click anywhere in the popup
3. Select "Inspect" or "Inspect Element"
4. Click on "Console" tab
5. Keep this open while testing
```

### Step 2: Go to Profile Tab
```
1. In the extension popup, click "Profile" tab
2. Check console for messages:
   ✅ "[Profile] showProfileSetup called"
   ✅ "[Profile] Profile from backend: ..."
   ✅ "[Profile] Profile from local storage: ..."
   ✅ "[Profile] Form found, attaching submit handler"
```

### Step 3: Fill and Save Profile
```
1. Fill in some profile fields
2. Click "Save Profile" button
3. Check console for messages:
   ✅ "[Profile] Form submitted"
   ✅ "[Profile] Saving profile: {...}"
   ✅ "[Storage] Saving profile to chrome.storage.local: {...}"
   ✅ "[Storage] Profile saved successfully"
   ✅ "[Storage] Verification - Profile in storage: {...}"
   ✅ "[Profile] Saved to local storage"
   ✅ "[Profile] Backend save result: true/false"
   ✅ "[Profile] Showing success message"
```

### Step 4: Verify Data Persists
```
1. Close the extension popup
2. Click extension icon again
3. Go to Profile tab
4. Check console for:
   ✅ "[Storage] Loading profile from chrome.storage.local"
   ✅ "[Storage] Profile loaded: {...}"
5. Verify your data is still there in the form fields
```

## Common Issues & Solutions

### Issue 1: Form Not Found
**Console Message**: `[Profile] Form not found!`

**Cause**: The profile form HTML is not being created

**Solution**:
```javascript
// Check if tabContent exists
const tabContent = document.getElementById('tab-content');
if (!tabContent) {
  console.error('tab-content div not found!');
}
```

### Issue 2: Submit Handler Not Attaching
**Console Message**: No "[Profile] Form found" message

**Cause**: Form element doesn't exist when trying to attach handler

**Solution**: Make sure you're on the Profile tab when checking

### Issue 3: Storage Permission Error
**Console Message**: `Error saving profile: ... permission denied`

**Cause**: Extension doesn't have storage permission

**Solution**:
```json
// Check manifest.json has:
"permissions": [
  "storage"
]
```

### Issue 4: Data Not Persisting
**Console Message**: Profile saves but loads as null

**Cause**: Storage might be cleared or quota exceeded

**Solution**:
```javascript
// Check storage quota
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log('Storage used:', bytes, 'bytes');
});
```

### Issue 5: Backend Sync Failing
**Console Message**: `[Profile] Backend save result: false`

**Cause**: Backend server not running or API error

**Solution**: This is OK - profile still saves locally

## Manual Testing Commands

Open browser console and run these commands:

### Check if profile exists
```javascript
chrome.storage.local.get(['userProfile'], (result) => {
  console.log('Current profile:', result.userProfile);
});
```

### Manually save a test profile
```javascript
chrome.storage.local.set({
  userProfile: {
    personalInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    }
  }
}, () => {
  console.log('Test profile saved');
});
```

### Clear profile (if needed)
```javascript
chrome.storage.local.remove('userProfile', () => {
  console.log('Profile cleared');
});
```

### Check all storage
```javascript
chrome.storage.local.get(null, (items) => {
  console.log('All storage:', items);
});
```

## Expected Console Output (Success)

When everything works correctly, you should see:

```
[Profile] showProfileSetup called
[Storage] Loading profile from chrome.storage.local
[Storage] Profile loaded: null (or existing profile)
[Profile] Profile from local storage: null (or existing profile)
[Profile] Form found, attaching submit handler

(User fills form and clicks Save)

[Profile] Form submitted
[Profile] Saving profile: {personalInfo: {...}, ...}
[Storage] Saving profile to chrome.storage.local: {...}
[Storage] Profile saved successfully
[Storage] Verification - Profile in storage: {...}
[Profile] Saved to local storage
[Profile] Backend save result: true
[Profile] Showing success message

(User closes and reopens popup)

[Profile] showProfileSetup called
[Storage] Loading profile from chrome.storage.local
[Storage] Profile loaded: {personalInfo: {...}, ...}
[Profile] Profile from local storage: {personalInfo: {...}, ...}
```

## Troubleshooting Checklist

- [ ] Extension is loaded and enabled
- [ ] Extension has storage permission
- [ ] Browser console is open
- [ ] On Profile tab when testing
- [ ] Form fields are visible
- [ ] Save button is clickable
- [ ] Console shows log messages
- [ ] No error messages in console
- [ ] Success message appears after save
- [ ] Data persists after closing popup

## If Still Not Working

### Step 1: Check Extension Permissions
```
1. Go to chrome://extensions/
2. Find your extension
3. Click "Details"
4. Scroll to "Permissions"
5. Verify "storage" is listed
```

### Step 2: Reload Extension
```
1. Go to chrome://extensions/
2. Find your extension
3. Click reload icon 🔄
4. Try saving again
```

### Step 3: Check for Errors
```
1. Open extension popup
2. Open console (right-click → Inspect)
3. Look for red error messages
4. Copy error message
5. Report the error
```

### Step 4: Try Incognito Mode
```
1. Open incognito window
2. Enable extension in incognito
3. Try saving profile
4. Check if it works there
```

### Step 5: Clear Extension Storage
```javascript
// In console:
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
  // Try saving again
});
```

## Report Format

If issue persists, please provide:

1. **Browser Console Output**
   - Copy all messages starting with [Profile] or [Storage]
   
2. **Error Messages**
   - Any red error messages
   
3. **Steps Taken**
   - What you did before the issue
   
4. **Browser Info**
   - Chrome version
   - Operating system
   
5. **Extension State**
   - Is it loaded?
   - Any errors on extensions page?

## Quick Fix Attempts

### Fix 1: Force Reload Everything
```
1. Close all extension popups
2. Go to chrome://extensions/
3. Click reload on extension
4. Close all Chrome windows
5. Reopen Chrome
6. Try again
```

### Fix 2: Reinstall Extension
```
1. Go to chrome://extensions/
2. Remove extension
3. Reload page
4. Load unpacked again
5. Try saving profile
```

### Fix 3: Check Storage Directly
```
1. Open extension popup
2. Open console
3. Run: chrome.storage.local.get(null, console.log)
4. Check if userProfile key exists
5. Check if data is there
```

---

**Next Steps**: 
1. Reload extension
2. Open console
3. Try saving profile
4. Check console messages
5. Report what you see
