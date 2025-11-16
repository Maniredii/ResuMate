# Test Street Address Update

## 🧪 Let's Test Street Address Specifically

Follow these steps to verify street address is saving correctly:

---

## Step 1: Open Profile Page

1. Go to: `http://localhost:5173/profile`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab

---

## Step 2: Test Street Address Input

1. **Find the "Street Address" field** (should be at the top of Location section)
2. **Type something** like: `123 Test Street, Apt 4B`
3. **Watch the console** - you should see:
   ```
   [Profile] Location change: streetAddress = 123 Test Street, Apt 4B
   [Profile] Updated profile: {personalInfo: {...}, ...}
   ```

### If You See These Messages:
✅ The input is working and updating the state!

### If You DON'T See These Messages:
❌ The input handler isn't firing - there's a JavaScript error

---

## Step 3: Save the Profile

1. **Scroll to bottom**
2. **Click "Save Profile"**
3. **Watch the console** - you should see:
   ```
   [Profile] Saving profile... {personalInfo: {location: {streetAddress: "123 Test Street, Apt 4B", ...}}, ...}
   [Profile] Save response: {message: "Profile updated successfully", profile: {...}}
   [Profile] Updating local state with saved profile
   ```

### Check the Save Response:
Look for `streetAddress` in the response:
```javascript
profile: {
  personalInfo: {
    location: {
      streetAddress: "123 Test Street, Apt 4B",  ← Should be here!
      city: "...",
      state: "...",
      ...
    }
  }
}
```

---

## Step 4: Verify Persistence

1. **Refresh the page** (F5)
2. **Check the Street Address field**
3. **Should show**: `123 Test Street, Apt 4B`

### If YES:
✅ Street address is saving correctly!

### If NO:
❌ Not persisting - check backend logs

---

## Step 5: Check Backend

**In the backend console, you should see:**
```
[Profile] Updated profile for user 1
```

**If you don't see this:**
- Backend isn't receiving the request
- Check Network tab for errors

---

## Manual API Test

**Run this in the browser console (F12):**

```javascript
// Get current profile
fetch('http://localhost:5000/api/profile/profile', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(res => res.json())
.then(data => {
  console.log('Current profile:', data.profile);
  console.log('Street Address:', data.profile.personalInfo.location.streetAddress);
});
```

**Expected output:**
```
Current profile: {personalInfo: {...}, ...}
Street Address: 123 Test Street, Apt 4B
```

---

## Update Street Address via API

**Run this in console to test saving:**

```javascript
// Update street address
fetch('http://localhost:5000/api/profile/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    profile: {
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        location: {
          streetAddress: '456 API Test Street',  // ← Testing this
          city: 'Test City',
          state: 'Test State',
          country: 'USA',
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
    }
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Save response:', data);
  console.log('✅ Street Address in response:', data.profile.personalInfo.location.streetAddress);
  
  // Verify it saved
  return fetch('http://localhost:5000/api/profile/profile', {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  });
})
.then(res => res.json())
.then(data => {
  console.log('✅ Verified - Street Address:', data.profile.personalInfo.location.streetAddress);
})
.catch(err => {
  console.error('❌ Error:', err);
});
```

**Expected output:**
```
✅ Save response: {message: "Profile updated successfully", profile: {...}}
✅ Street Address in response: 456 API Test Street
✅ Verified - Street Address: 456 API Test Street
```

---

## Common Issues

### Issue 1: Field is Empty After Refresh
**Cause**: Not saving to database
**Check**: Backend console for save message
**Fix**: Ensure backend is running

### Issue 2: Can Type But Doesn't Save
**Cause**: Save button not working
**Check**: Console for save messages
**Fix**: Check for JavaScript errors

### Issue 3: Saves But Shows Old Value
**Cause**: Frontend not updating after save
**Check**: Console for "Updating local state" message
**Fix**: I just added this - refresh page

### Issue 4: Console Shows Error
**Cause**: Various - need to see the error
**Action**: Copy the error message and tell me

---

## What to Report

If street address still isn't working, tell me:

1. **Console messages** when you type in the field
2. **Console messages** when you click Save
3. **Does it persist after refresh?** (Yes/No)
4. **What does the API test show?** (run the manual test above)
5. **Any error messages?**

This will help me pinpoint the exact issue!

---

## Quick Summary

✅ **Street address field exists** in the form
✅ **Backend saves it** correctly
✅ **Backend returns it** correctly
✅ **Frontend has the field** in state
✅ **Input handler is correct**

If it's still not working, there might be a specific issue with your data. Run the tests above and let me know what you see!
