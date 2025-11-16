# Profile Edit Guide

## ✅ Your Profile is Fully Editable!

All fields in your profile can be changed anytime. Here's how:

---

## 🌐 Web App (Recommended)

### Access Profile:
1. Go to: `http://localhost:5173`
2. Log in
3. Click **"Profile"** in navigation bar

### Edit Any Field:
1. Click in any field
2. Change the value
3. Scroll to bottom
4. Click **"Save Profile"**
5. ✅ Success message appears
6. ✅ Changes saved to database

### Fields You Can Edit:

#### Personal Information:
- ✏️ First Name
- ✏️ Last Name
- 🔒 Email (cannot change - account identifier)
- ✏️ Phone Number

#### Location:
- ✏️ Street Address (NEW!)
- ✏️ City
- ✏️ State/Province
- ✏️ Country
- ✏️ Zip Code

#### Professional Links:
- ✏️ LinkedIn Profile
- ✏️ Portfolio/Website
- ✏️ GitHub Profile

#### Work Experience:
- ✏️ Current Job Title
- ✏️ Current Company
- ✏️ Years of Experience

#### Education:
- ✏️ Degree
- ✏️ Major/Field of Study
- ✏️ University/College
- ✏️ Graduation Year

#### Preferences:
- ✏️ Work Authorization
- ✏️ Willing to Relocate (checkbox)
- ✏️ Requires Sponsorship (checkbox)

#### Additional:
- ✏️ Cover Letter Template

---

## 🔌 Browser Extension

### Access Profile:
1. Click extension icon
2. Go to **"Profile"** tab

### Edit Any Field:
1. Scroll through the form
2. Change any field
3. Click **"Save Profile"**
4. ✅ Saves to local storage AND database

### Sync:
- Changes sync to database automatically
- Available in web app immediately
- Available for auto-fill immediately

---

## 🔄 How Editing Works

### Data Flow:
```
You edit field → Click Save → Saves to database → Syncs everywhere
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
              Web App Profile              Extension Profile
                    ↓                               ↓
              Can edit again              Can edit again
```

### Real-Time Updates:
- ✅ Edit in web app → Available in extension
- ✅ Edit in extension → Available in web app
- ✅ Changes persist across sessions
- ✅ Auto-fill uses latest data

---

## 📝 Edit Examples

### Example 1: Update Phone Number
1. Go to Profile page
2. Find "Phone Number" field
3. Change: `+1 (555) 123-4567` → `+1 (555) 987-6543`
4. Click "Save Profile"
5. ✅ Updated!

### Example 2: Add Street Address
1. Go to Profile page
2. Find "Street Address" field (NEW!)
3. Enter: `123 Main Street, Apt 4B`
4. Click "Save Profile"
5. ✅ Address saved!

### Example 3: Update Work Experience
1. Go to Profile page
2. Scroll to "Work Experience"
3. Change "Current Job Title"
4. Change "Current Company"
5. Click "Save Profile"
6. ✅ Work info updated!

### Example 4: Edit Cover Letter
1. Go to Profile page
2. Scroll to "Cover Letter Template"
3. Edit the text
4. Click "Save Profile"
5. ✅ New template saved!

---

## 🚫 What You CANNOT Edit

### Email Address:
- ❌ Email field is **disabled** (grayed out)
- 📧 Email is your account identifier
- 🔐 Used for login
- 💡 To change email, you need to create a new account

---

## 💡 Pro Tips

### Tip 1: Edit Often
- Keep your profile up-to-date
- Update when you change jobs
- Update when you move
- Update skills regularly

### Tip 2: Test After Editing
- After major changes, test auto-fill
- Open `extension/test-form.html`
- Click "Quick Apply"
- Verify new data fills correctly

### Tip 3: Use Web App for Major Edits
- Web app has larger form
- Easier to see all fields
- Better for extensive changes
- Extension good for quick updates

### Tip 4: Save Frequently
- Click "Save Profile" after each section
- Don't lose your changes
- Success message confirms save

---

## 🔍 Verify Your Edits

### Check in Web App:
1. Go to Profile page
2. Verify fields show your changes
3. If not, refresh page

### Check in Extension:
1. Click extension icon
2. Go to Profile tab
3. Verify fields show your changes
4. If not, reload extension

### Check in Database:
Your changes are stored in:
- Database: `users.profile_data` column
- Format: JSON string
- Persists across sessions

---

## 🐛 Troubleshooting

### Changes Not Saving:
1. ✅ Check success message appears
2. ✅ Check browser console for errors (F12)
3. ✅ Verify backend server is running
4. ✅ Try refreshing the page

### Changes Not Syncing:
1. ✅ Reload extension in chrome://extensions/
2. ✅ Refresh web app page
3. ✅ Check you're logged in
4. ✅ Verify same account in both places

### Field Appears Empty:
1. ✅ Refresh the page
2. ✅ Check if you saved after editing
3. ✅ Verify backend is running
4. ✅ Check browser console for errors

---

## ✅ Summary

### Editing Capability:
- ✅ **All fields editable** (except email)
- ✅ Edit in web app or extension
- ✅ Changes save to database
- ✅ Syncs across all platforms
- ✅ Available for auto-fill immediately

### New Field:
- ✅ **Street Address** added
- ✅ Optional field
- ✅ Auto-fills on job applications
- ✅ Editable anytime

### How to Edit:
1. Open Profile page (web or extension)
2. Change any field
3. Click "Save Profile"
4. Done! ✅

---

## 🎯 Next Steps

1. **Update your profile** with street address
2. **Edit any outdated information**
3. **Test auto-fill** on test-form.html
4. **Apply to jobs** with complete info!

Your profile is fully editable and ready to use! 🚀
