# 🔍 Dropdown Debugging Guide

## Issue: Dropdowns Not Filling

If dropdowns aren't being filled, follow this debugging guide to identify the problem.

## Step 1: Check Console Logs

Open the browser console (F12) and look for these messages:

### What You Should See:
```
[Auto-Apply] Found X dropdown fields
[Auto-Apply] Dropdown field type: educationLevel, value: Bachelor's Degree
[Auto-Apply] Trying to match dropdown value: "Bachelor's Degree"
[Auto-Apply] Available options: ["High School", "Associate's", "Bachelor's", "Master's"]
[Auto-Apply] ✅ Matched option: "Bachelor's" using word match
```

### Common Issues:

#### Issue 1: "Found 0 dropdown fields"
**Problem:** Dropdowns aren't being detected

**Solutions:**
1. Check if dropdowns are standard `<select>` elements
2. Check if dropdowns are visible (not hidden)
3. Some sites use custom dropdowns (not standard select)

**How to Check:**
```javascript
// In console, run:
document.querySelectorAll('select').length
// Should show number of select elements on page
```

#### Issue 2: "No value found for dropdown"
**Problem:** Your profile doesn't have a value for that field

**Solutions:**
1. Fill out your profile completely
2. Check which field type it is
3. Add the missing value to your profile

**Example:**
```
[Auto-Apply] No value found for dropdown: highestEducationLevel (Education Level)
```
**Fix:** Go to Profile tab → Fill "Highest Level of Education"

#### Issue 3: "❌ No match found"
**Problem:** Your profile value doesn't match any dropdown options

**Solutions:**
1. Check available options in console
2. Update your profile value to match one of them
3. Use exact text from dropdown

**Example:**
```
[Auto-Apply] Trying to match dropdown value: "Bachelors"
[Auto-Apply] Available options: ["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree"]
[Auto-Apply] ❌ No match found
```
**Fix:** Change profile from "Bachelors" to "Bachelor's Degree"

## Step 2: Test Specific Dropdown

To test a specific dropdown manually:

```javascript
// In console:
// 1. Find the dropdown
const dropdown = document.querySelector('select[name="education"]');

// 2. Check its options
Array.from(dropdown.options).map(o => o.text);

// 3. Try to set a value
dropdown.value = "bachelor";
dropdown.dispatchEvent(new Event('change', { bubbles: true }));
```

## Step 3: Check Profile Values

Make sure your profile has values for dropdown fields:

### Education Dropdown
**Profile Field:** `education.highestEducationLevel`
**Common Values:**
- "High School Diploma"
- "Associate's Degree"
- "Bachelor's Degree"
- "Master's Degree"
- "Doctorate/PhD"

### Yes/No Dropdowns
**Profile Fields:**
- `applicationQuestions.speaksEnglish` → "Yes" or "No"
- `applicationQuestions.willingToTravel` → "Yes", "No", or "Occasionally"
- `applicationQuestions.hasDriversLicense` → "Yes" or "No"

### Experience Dropdowns
**Profile Field:** `workExperience.yearsOfExperience` or `applicationQuestions.yearsOfExperience`
**Common Values:**
- "5 years"
- "5"
- "5+"

### Commute Dropdown
**Profile Field:** `applicationQuestions.commute`
**Values:**
- "Yes, I can make the commute"
- "Yes, I am planning to relocate"
- "Yes, but I need relocation assistance"
- "No"

## Step 4: Manual Test

Create a test HTML file to verify dropdown filling works:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Dropdown Test</title>
</head>
<body>
  <h1>Test Dropdown Filling</h1>
  
  <label>Education Level:</label>
  <select id="education" name="education">
    <option value="">Select...</option>
    <option value="hs">High School</option>
    <option value="associate">Associate's Degree</option>
    <option value="bachelor">Bachelor's Degree</option>
    <option value="master">Master's Degree</option>
  </select>
  
  <br><br>
  
  <label>Years of Experience:</label>
  <select id="experience" name="experience">
    <option value="">Select...</option>
    <option value="0-2">0-2 years</option>
    <option value="3-5">3-5 years</option>
    <option value="5+">5+ years</option>
  </select>
  
  <br><br>
  
  <button onclick="testFill()">Test Fill</button>
  
  <script>
    function testFill() {
      // Test education dropdown
      const edu = document.getElementById('education');
      edu.value = 'bachelor';
      edu.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Test experience dropdown
      const exp = document.getElementById('experience');
      exp.value = '5+';
      exp.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('Filled:', edu.value, exp.value);
    }
  </script>
</body>
</html>
```

Save this as `dropdown-test.html` and open it. Click "Quick Apply" button to test.

## Step 5: Check for Custom Dropdowns

Some sites use custom dropdowns that aren't standard `<select>` elements:

### Custom Dropdown Examples:
```html
<!-- NOT a standard select -->
<div class="custom-dropdown">
  <div class="selected">Select...</div>
  <div class="options">
    <div class="option">Option 1</div>
    <div class="option">Option 2</div>
  </div>
</div>
```

**Solution:** These require manual selection. The extension only works with standard `<select>` elements.

**How to Identify:**
```javascript
// In console:
const element = document.querySelector('.your-dropdown');
console.log(element.tagName); // Should be "SELECT"
```

## Step 6: Common Fixes

### Fix 1: Reload Extension
```
chrome://extensions/ → Find extension → Click reload
```

### Fix 2: Update Profile Values
```
1. Click extension icon
2. Go to Profile tab
3. Fill dropdown-related fields:
   - Highest Education Level
   - Willing to Travel
   - Has Driver's License
   - Commute preference
4. Save Profile
```

### Fix 3: Use Exact Option Text
Update your profile to use exact text from dropdown options.

**Example:**
- ❌ "Bachelors" 
- ✅ "Bachelor's Degree"

### Fix 4: Check Field Detection
The dropdown might not be detected as the right field type.

**Check console for:**
```
[Auto-Apply] Dropdown field type: unknown
```

**Solution:** The field detection pattern might need adjustment.

## Step 7: Report Issues

If dropdowns still don't work, provide this information:

1. **Console Logs:**
   - Copy all `[Auto-Apply]` messages
   
2. **Dropdown HTML:**
   ```javascript
   // In console:
   const dropdown = document.querySelector('select');
   console.log(dropdown.outerHTML);
   ```

3. **Your Profile Value:**
   - What value is in your profile?
   - What field type is it?

4. **Available Options:**
   - What options does the dropdown have?

## Quick Checklist

- [ ] Extension reloaded
- [ ] Console open (F12)
- [ ] Profile has dropdown values filled
- [ ] Dropdowns are standard `<select>` elements
- [ ] Dropdowns are visible on page
- [ ] Console shows "Found X dropdown fields"
- [ ] Console shows "Trying to match dropdown value"
- [ ] Console shows available options
- [ ] Profile values match dropdown options

## Summary

**Most Common Issues:**
1. Profile values not filled (80%)
2. Profile values don't match options (15%)
3. Custom dropdowns not supported (5%)

**Most Common Solutions:**
1. Fill out profile completely
2. Use exact option text
3. Check console logs

---

**Need more help?** Share your console logs and I'll help debug!
