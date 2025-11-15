# Automatic Skill Matching Feature

## Overview
The system now automatically extracts required skills from job descriptions and updates the user's profile to match those skills before applying.

## How It Works

### Workflow
1. **User enters job URL** → Click "Extract Job Description"
2. **System scrapes job** → Extracts title, company, description
3. **AI extracts skills** → Identifies required skills from job description
4. **Profile updated** → User's skills automatically updated to match job
5. **Resume tailored** → AI optimizes resume with matching skills
6. **Application submitted** → Auto-apply with optimized profile

### Step-by-Step Process

#### Step 1: Job Scraping
```
User Input: https://www.indeed.com/viewjob?jk=123456
↓
Playwright opens browser → Navigates to job page → Extracts content
↓
Result: Job title, company, full description
```

#### Step 2: Skill Extraction (NEW!)
```
Job Description → AI Analysis → Extract Required Skills
↓
Example Output: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"]
```

#### Step 3: Profile Update (NEW!)
```
Current Profile Skills: ["Python", "Django", "PostgreSQL"]
↓
Updated Profile Skills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"]
↓
Database Updated: profile_data.skills = new skills array
```

#### Step 4: Resume Tailoring
```
Original Resume + Job Description + Matching Skills → AI Tailoring
↓
Tailored Resume: Emphasizes relevant experience for required skills
```

#### Step 5: Application
```
Tailored Resume + Updated Profile → Auto-Apply
↓
Form filled with matching skills → Application submitted
```

## Implementation Details

### Backend Changes

**File:** `backend/routes/job.js`

**New Logic Added:**
```javascript
// After scraping job description
try {
  // Extract skills from job description
  const { extractSkills } = await import('../services/ai.service.js');
  const requiredSkills = await extractSkills(jobData.description);
  
  // Get current profile
  let profileData = JSON.parse(user.profile_data || '{}');
  
  // Update skills to match job
  profileData.skills = requiredSkills;
  
  // Save to database
  db.prepare('UPDATE users SET profile_data = ? WHERE id = ?')
    .run(JSON.stringify(profileData), userId);
    
  console.log('Updated user profile with job-matching skills');
} catch (error) {
  console.warn('Could not extract/update skills:', error.message);
  // Continue anyway - not critical
}
```

### AI Service

**Function:** `extractSkills(jobDescription)`

**Purpose:** Analyzes job description and extracts required skills

**Input:**
```
Job Description: "We are looking for a Full Stack Developer with experience in React, Node.js, MongoDB, and AWS. Must have strong JavaScript skills..."
```

**Output:**
```javascript
[
  "JavaScript",
  "React",
  "Node.js",
  "MongoDB",
  "AWS",
  "Full Stack Development"
]
```

**AI Prompt:**
```
Extract the key technical skills and requirements from this job description.
Return only the skills as a comma-separated list.
Focus on:
- Programming languages
- Frameworks and libraries
- Tools and technologies
- Certifications
- Soft skills if explicitly required
```

## Benefits

### For Users
- ✅ **Automatic Skill Matching**: No manual profile updates needed
- ✅ **Better ATS Compatibility**: Profile matches job keywords
- ✅ **Increased Success Rate**: Skills align with job requirements
- ✅ **Time Saving**: No need to manually update profile for each job
- ✅ **Smart Optimization**: AI identifies most relevant skills

### For Applications
- ✅ **Higher Match Score**: Profile skills match job requirements
- ✅ **Better Ranking**: ATS systems rank higher with matching keywords
- ✅ **Relevant Experience**: Resume emphasizes matching skills
- ✅ **Consistent Data**: Profile and resume align perfectly

## Example Scenario

### Before Applying

**User Profile:**
```json
{
  "name": "John Doe",
  "skills": ["Python", "Django", "PostgreSQL", "Docker"],
  "location": "San Francisco, CA"
}
```

**Job Requirements:**
- JavaScript
- React
- Node.js
- MongoDB
- AWS

### After Skill Extraction

**Updated Profile:**
```json
{
  "name": "John Doe",
  "skills": ["JavaScript", "React", "Node.js", "MongoDB", "AWS"],
  "location": "San Francisco, CA"
}
```

**Result:**
- Profile now matches job requirements
- Resume tailored to emphasize JavaScript/React experience
- Application submitted with matching skills

## User Experience

### What Users See

1. **Enter Job URL**
   ```
   [Job URL Input Field]
   [Extract Job Description Button]
   ```

2. **Processing**
   ```
   ⏳ Extracting job description...
   ⏳ Analyzing required skills...
   ⏳ Updating your profile...
   ⏳ Tailoring your resume...
   ```

3. **Success**
   ```
   ✓ Job description extracted
   ✓ Profile updated with 5 matching skills
   ✓ Resume tailored for this position
   ✓ Ready to apply!
   ```

### Console Logs (Backend)

```
[Job Application] Scraping job description from: https://...
[Job Application] Successfully scraped job: Software Engineer at Tech Corp
[Job Application] Extracting required skills from job description...
[Job Application] Extracted 5 skills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"]
[Job Application] Updated user profile with job-matching skills
[Job Application] Resume read successfully
[Job Application] Tailoring resume with AI service...
[Job Application] Resume tailored successfully
[Job Application] Resume updated in place
[Job Application] Attempting to auto-apply to job...
[Job Application] Auto-apply result: Success
```

## Error Handling

### Skill Extraction Fails
```javascript
try {
  const requiredSkills = await extractSkills(jobData.description);
  // Update profile...
} catch (error) {
  console.warn('Could not extract/update skills:', error.message);
  // Continue with application anyway
}
```

**Behavior:** Application continues with existing profile skills

### Profile Update Fails
```javascript
try {
  db.prepare('UPDATE users SET profile_data = ?').run(...);
} catch (error) {
  console.warn('Could not update profile:', error.message);
  // Continue with application anyway
}
```

**Behavior:** Application continues with old profile

### Non-Critical Errors
- Skill extraction failure → Continue with existing skills
- Profile update failure → Continue with old profile
- Application still proceeds normally

## Database Schema

### users.profile_data
```json
{
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "skills": [
    "JavaScript",
    "React",
    "Node.js",
    "MongoDB",
    "AWS"
  ],
  "ai_provider": "openrouter"
}
```

**Skills Field:**
- Type: Array of strings
- Updated: Automatically before each application
- Source: Extracted from job description by AI
- Purpose: Match job requirements for better ATS ranking

## Configuration

### AI Provider
Set in `.env`:
```env
AI_PROVIDER=openrouter  # or openai, groq, gemini
```

### Skill Extraction
- **Model:** Uses same AI provider as resume tailoring
- **Temperature:** 0.3 (focused, consistent results)
- **Max Tokens:** 500 (sufficient for skill list)

## Testing

### Test Cases
1. ✅ Extract skills from Indeed job
2. ✅ Extract skills from Wellfound job
3. ✅ Update user profile with extracted skills
4. ✅ Verify skills persist in database
5. ✅ Tailor resume with matching skills
6. ✅ Apply with updated profile
7. ✅ Handle extraction failure gracefully

### Manual Testing
```bash
# 1. Apply to a job
POST /api/job/apply-job
Body: { "jobUrl": "https://..." }

# 2. Check user profile
GET /api/user/get-user

# 3. Verify skills updated
Response: {
  "user": {
    "profile_data": {
      "skills": ["JavaScript", "React", ...]
    }
  }
}
```

## Future Enhancements

1. **Skill History**: Track skill changes over time
2. **Skill Suggestions**: Suggest skills to learn based on job market
3. **Skill Verification**: Verify user actually has claimed skills
4. **Skill Levels**: Add proficiency levels (Beginner, Intermediate, Expert)
5. **Skill Categories**: Group skills by category (Frontend, Backend, DevOps)
6. **Skill Endorsements**: Allow connections to endorse skills
7. **Skill Gap Analysis**: Show missing skills for dream jobs

## Summary

The Automatic Skill Matching feature ensures that your profile always matches the job you're applying to, increasing your chances of passing ATS systems and getting noticed by recruiters. The system intelligently extracts required skills from job descriptions and updates your profile automatically, saving time and improving application success rates.

**Status:** ✅ Implemented and Active
**Impact:** Higher ATS match scores, better application success rates
**User Action Required:** None - fully automatic
