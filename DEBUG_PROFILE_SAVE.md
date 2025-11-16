# Debug Profile Save Issue

## 🔍 Let's Find Out What's Happening

Follow these steps to debug why your profile changes aren't saving:

---

## Step 1: Check Browser Console

1. **Open the Profile page**: `http://localhost:5173/profile`
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Make a change** to any field
5. **Click "Save Profile"**
6. **Look for these messages:**

### Expected Console Output:
```
[Profile] Saving profile... {personalInfo: {...}, workExperience: {...}, ...}
[Profile] Save response: {message: "Profile updated successfully", profile: {...}}
[Profile] Updating local state with saved profile
```

### If You See Errors:
```
[Profile] Failed to save profile: Error: ...
[Profile] Error details: {...}
```

**Copy the error message and tell me what it says!**

---

## Step 2: Check Network Tab

1. **Stay on Profile page with F12 open**
2. **Go to Network tab**
3. **Make a change** to any field
4. **Click "Save Profile"**
5. **Look for a request** to `/profile/profile`

### Check the Request:
- **Method**: Should be `PUT`
- **Status**: Should be `200` (green)
- **Response**: Click on it and check the "Response" tab

### If Status is Red (400, 500, etc.):
- Click on the request
- Go to "Response" tab
- Copy the error message
- Tell me what it says!

---

## Step 3: Verify Backend is Running

1. **Check if backend is running**
2. **Open a new tab**
3. **Go to**: `http://localhost:5000/api/health`

### Expected Response:
```json
{
  "status": "ok",
  "message": "Job Application Automation API is running",
  "timestamp": "2025-11-15T..."
}
```

### If You Get an Error:
- Backend is not running!
- Start it: `cd backend && npm start`

---

## Step 4: Test Profile Save Manually

**Open Console (F12) on Profile page and run:**

```javascript
// Test save manually
const testProfile = {
  personalInfo: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '1234567890',
    location: {
      streetAddress: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      zipCode: '12345'
    },
    linkedIn: '',
    portfolio: '',
    github: ''
  },
  workExperience: {
    currentCompany: '',
    currentTitle: '',
    yearsOfExperience: ''
  },
  education: {
    degree: '',
    major: '',
    university: '',
    graduationYear: ''
  },
  preferences: {
    desiredSalary: '',
    willingToRelocate: false,
    requiresSponsorship: false,
    workAuthorization: ''
  },
  additionalInfo: {
    coverLetterTemplate: ''
  }
};

// Try to save
fetch('http://localhost:5000/api/profile/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ profile: testProfile })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Save successful:', data);
})
.catch(err => {
  console.error('❌ Save failed:', err);
});
```

### Expected Output:
```
✅ Save successful: {message: "Profile updated successfully", profile: {...}}
```

### If You See Error:
Copy the error and tell me!

---

## Step 5: Check Database

**On backend console, you should see:**
```
[Profile] Updated profile for user 1
```

If you don't see this, the backend isn't receiving the request.

---

## Common Issues & Fixes

### Issue 1: "Failed to fetch"
**Cause**: Backend not running
**Fix**: Start backend with `cd backend && npm start`

### Issue 2: "401 Unauthorized"
**Cause**: Not logged in or token expired
**Fix**: Log out and log in again

### Issue 3: "Network Error"
**Cause**: Backend on wrong port
**Fix**: Check backend is on port 5000

### Issue 4: Changes Don't Persist
**Cause**: Frontend not updating state after save
**Fix**: I just added code to fix this - refresh the page

### Issue 5: Success Message Shows But Data Doesn't Change
**Cause**: Frontend state not updating
**Fix**: 
1. Refresh the page after saving
2. Check if data persists after refresh
3. If yes, it's saving correctly!

---

## Quick Test

1. **Change your first name** to "TestName123"
2. **Click "Save Profile"**
3. **Wait for success message**
4. **Refresh the page** (F5)
5. **Check if first name is still "TestName123"**

### If YES:
✅ Saving works! The issue is just the UI not updating immediately.
✅ I just fixed this - refresh the page and try again.

### If NO:
❌ Not saving to database. Check console for errors.

---

## What to Tell Me

Please provide:

1. **Console messages** when you click Save (screenshot or copy text)
2. **Network tab** - status code of the PUT request
3. **Any error messages** in red
4. **Does data persist after page refresh?** (Yes/No)
5. **Is backend running?** (Yes/No)

This will help me identify the exact issue!

---

## Quick Fix to Try Now

1. **Refresh the Profile page** (F5)
2. **Make a change**
3. **Click "Save Profile"**
4. **Wait for success message**
5. **Refresh the page again** (F5)
6. **Check if change persisted**

If the change persists after refresh, the save is working - I just fixed the UI update issue!
