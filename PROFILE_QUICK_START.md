# Profile Feature - Quick Start Guide

## ✅ Profile Management is Ready!

You now have a complete profile management system that saves user details to the database and syncs with the browser extension.

---

## 🚀 How to Use (3 Steps)

### Step 1: Access Profile Page (Web App)

1. **Start the frontend** (if not running):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open your browser** and go to: `http://localhost:5173`

3. **Log in** with your account

4. **Click "Profile"** in the navigation bar

5. **Fill out your information:**
   - Personal info (name, email, phone)
   - Location (city, state, country)
   - Professional links (LinkedIn, GitHub, Portfolio)
   - Work experience
   - Education
   - Preferences
   - Cover letter template

6. **Click "Save Profile"**

7. ✅ **Done!** Your profile is saved to the database

---

### Step 2: Use Profile in Extension

1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Find "Job Application Automation"
   - Click the reload button (🔄)

2. **Click the extension icon** in your toolbar

3. **Go to the "Profile" tab**

4. **Your profile loads automatically** from the database!

5. **Update if needed** and click "Save Profile"

6. ✅ **Synced!** Changes saved to database

---

### Step 3: Use Quick Apply

1. **Navigate to any job application page:**
   - Indeed
   - LinkedIn
   - Wellfound
   - Greenhouse
   - Lever
   - Workday

2. **Look for the "Quick Apply" button** (bottom-right corner)

3. **Click it** - form fills automatically with your profile!

4. **Review the filled information**

5. **Submit the application**

6. ✅ **Done!** Application submitted in 30 seconds

---

## 📍 Where to Find Profile

### Web App:
```
Navigation Bar → Profile
or
Direct URL: http://localhost:5173/profile
```

### Extension:
```
Extension Icon → Profile Tab
```

---

## 🔄 Data Sync

Your profile data is automatically synced:

```
Web App ←→ Database ←→ Extension
```

- **Update in web app** → Syncs to database → Available in extension
- **Update in extension** → Syncs to database → Available in web app
- **Offline?** Extension uses local storage as fallback

---

## 📊 What Gets Saved

### Personal Information:
- ✅ First Name, Last Name
- ✅ Email, Phone
- ✅ City, State, Country, Zip Code

### Professional Links:
- ✅ LinkedIn Profile
- ✅ Portfolio/Website
- ✅ GitHub Profile

### Work Experience:
- ✅ Current Job Title
- ✅ Current Company
- ✅ Years of Experience

### Education:
- ✅ Degree
- ✅ Major/Field of Study
- ✅ University/College
- ✅ Graduation Year

### Preferences:
- ✅ Work Authorization
- ✅ Willing to Relocate
- ✅ Requires Sponsorship

### Additional:
- ✅ Cover Letter Template

---

## 🎯 Benefits

### Time Savings:
- **Before**: Fill out every application manually (5-10 min each)
- **After**: Click Quick Apply button (30 seconds)
- **Savings**: 90% time reduction!

### Consistency:
- Same information across all applications
- No typos or mistakes
- Professional presentation

### Convenience:
- Fill profile once, use everywhere
- Update anytime from web or extension
- Auto-sync keeps data current

---

## 🧪 Test It Out

### Test on Sample Form:
1. Open `extension/test-form.html` in your browser
2. Click the "Quick Apply" button
3. Watch the form auto-fill with your profile data!
4. ✅ Verify all fields are filled correctly

### Test on Real Job Page:
1. Go to Indeed.com or LinkedIn.com
2. Find a job application
3. Click "Quick Apply" button
4. Review and submit!

---

## 💡 Pro Tips

1. **Fill Complete Profile**: The more fields you fill, the more auto-fill can do
2. **Update Regularly**: Keep your profile current with latest info
3. **Customize Cover Letters**: Edit the auto-filled cover letter for each job
4. **Test First**: Use test-form.html to verify everything works
5. **Sync Check**: If data seems old, reload extension to sync from database

---

## 🔧 Troubleshooting

### Profile Not Saving (Web App):
- ✅ Check backend server is running (`npm start` in backend folder)
- ✅ Check browser console (F12) for errors
- ✅ Verify you're logged in

### Profile Not Loading (Extension):
- ✅ Reload extension in `chrome://extensions/`
- ✅ Check backend server is accessible
- ✅ Verify you're logged in to extension

### Auto-Fill Not Working:
- ✅ Confirm profile is saved (check Profile tab)
- ✅ Refresh the job application page
- ✅ Test on test-form.html first

---

## 📁 API Endpoints

The profile system uses these endpoints:

```
GET    /api/profile/profile  - Fetch user profile
PUT    /api/profile/profile  - Update user profile
DELETE /api/profile/profile  - Clear profile data
```

All endpoints require JWT authentication.

---

## 🎉 You're All Set!

Your profile management system is ready to use:

1. ✅ Backend API running with profile routes
2. ✅ Frontend Profile page accessible
3. ✅ Extension syncs with database
4. ✅ Quick Apply uses profile data

**Start filling your profile and save hours on job applications!**

---

## 📖 More Information

- **Detailed Guide**: See `PROFILE_FEATURE_SUMMARY.md`
- **Quick Apply Guide**: See `extension/QUICK_APPLY_GUIDE.md`
- **Extension Setup**: See `extension/SETUP.md`

---

**Happy job hunting! 🚀**
