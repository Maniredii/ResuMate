# Quick Apply Feature Guide

## Overview
The Quick Apply feature automatically fills job application forms with your saved profile information, saving you time when applying to multiple jobs.

## Setup Instructions

### 1. Install the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension icon should appear in your toolbar

### 2. Set Up Your Profile
1. Click the extension icon in your toolbar
2. Log in with your account credentials
3. Click the **Profile** tab
4. Fill out all relevant information:
   - Personal Information (name, email, phone)
   - Location (city, state, country, zip code)
   - Social Links (LinkedIn, Portfolio, GitHub)
   - Work Experience
   - Education
   - Preferences (work authorization, relocation, sponsorship)
   - Cover Letter Template
5. Click **Save Profile**

### 3. Using Quick Apply

#### Method 1: Floating Button (Recommended)
1. Navigate to any job application page on supported platforms:
   - Indeed
   - LinkedIn
   - Wellfound (AngelList)
   - Greenhouse
   - Lever
   - Workday
2. Look for the **Quick Apply** floating button in the bottom-right corner
3. Click the button to automatically fill the form
4. Review the filled information
5. Submit the application

#### Method 2: Extension Popup
1. Navigate to a job page
2. Click the extension icon
3. Click **Apply to This Job** (if on a supported job platform)

## Supported Platforms
- ✅ Indeed
- ✅ LinkedIn Jobs
- ✅ Wellfound (AngelList)
- ✅ Greenhouse.io
- ✅ Lever.co
- ✅ Workday

## Features

### Smart Field Detection
The extension automatically detects and fills:
- Name fields (first, last, full name)
- Contact information (email, phone)
- Location fields (city, state, country, zip)
- Social media links (LinkedIn, GitHub, Portfolio)
- Cover letter/motivation text areas
- Custom text fields

### Visual Feedback
- Filled fields are highlighted in green
- Success/error messages appear after auto-fill
- Field borders turn green to show what was filled

### Privacy & Security
- All profile data is stored locally in your browser
- No data is sent to external servers (except when applying through the backend API)
- You can clear your profile data anytime from Chrome settings

## Tips for Best Results

1. **Complete Your Profile**: The more information you provide, the more fields can be auto-filled
2. **Review Before Submitting**: Always review auto-filled information before submitting
3. **Update Regularly**: Keep your profile up-to-date with current information
4. **Customize Cover Letters**: Use placeholders in your template like `[Company Name]` that you can quickly replace
5. **Test First**: Try the feature on a test application to see how it works

## Troubleshooting

### Quick Apply Button Not Appearing
- Refresh the page
- Check if you're on a supported platform
- Ensure the extension is enabled in `chrome://extensions/`

### Fields Not Being Filled
- Make sure you've saved your profile in the Profile tab
- Some fields may have custom names that aren't detected
- Try manually filling those fields

### Extension Not Working
1. Reload the extension in `chrome://extensions/`
2. Check browser console for errors (F12)
3. Ensure backend server is running (if using full features)

## Keyboard Shortcuts
- None currently (coming soon!)

## Future Enhancements
- [ ] Resume auto-upload
- [ ] Multi-language support
- [ ] Custom field mapping
- [ ] Application tracking
- [ ] Keyboard shortcuts
- [ ] Bulk apply to multiple jobs

## Support
For issues or questions, check the main README.md or contact support.
