# LinkedIn Job Scraper

## Overview
The LinkedIn Job Scraper feature allows users to extract job details from LinkedIn job postings and generate a comprehensive PDF report with skill analysis.

## Features

### 1. Job Information Extraction
- **Company Name**: Extracts the hiring company
- **Job Title**: Gets the position title
- **Location**: Captures job location
- **Job Description**: Full description text

### 2. AI-Powered Skill Analysis
- **Required Skills**: Automatically extracts skills mentioned in the job description
- **Skill Matching**: Compares required skills with your resume
- **Missing Skills**: Identifies skills you need to develop

### 3. PDF Report Generation
The system generates a professional PDF report with:
- Company name
- Job role/title
- Complete job description
- List of required skills
- List of skills you're missing (highlighted in red)
- Direct link to the job posting

## API Endpoints

### POST /api/job/scrape-linkedin
Scrapes a LinkedIn job and generates a PDF report.

**Request Body:**
```json
{
  "jobUrl": "https://www.linkedin.com/jobs/view/..."
}
```

**Response:**
```json
{
  "message": "LinkedIn job scraped successfully",
  "jobData": {
    "title": "Software Engineer",
    "company": "Tech Company",
    "location": "San Francisco, CA",
    "description": "...",
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "missingSkills": ["TypeScript", "GraphQL"],
    "platform": "LinkedIn",
    "url": "..."
  },
  "pdfPath": "/path/to/report.pdf",
  "pdfUrl": "/api/job/download-report/job_report_123456.pdf"
}
```

### GET /api/job/download-report/:filename
Downloads a generated PDF report.

**Parameters:**
- `filename`: Name of the PDF file to download

**Response:**
- PDF file download

## Usage

### Frontend
1. Navigate to "LinkedIn Scraper" in the navigation menu
2. Paste a LinkedIn job URL
3. Click "Scrape Job & Generate Report"
4. View the extracted information and skill analysis
5. Download the PDF report

### Backend
```javascript
import { scrapeLinkedInJob } from './services/scraper.service.js';

// Scrape LinkedIn job with skill comparison
const jobData = await scrapeLinkedInJob(jobUrl, userResume);

// Returns:
// - Job details (title, company, description)
// - Required skills
// - Missing skills (compared to user's resume)
// - Path to generated PDF report
```

## PDF Report Structure

The generated PDF includes:

1. **Header**: "Job Analysis Report"
2. **Company**: Company name
3. **Job Role**: Position title
4. **Job Description**: Full description text
5. **Required Skills**: Numbered list of skills
6. **Skills Missing**: Highlighted in red, numbered list
7. **Job URL**: Clickable link to the original posting

## File Storage

PDF reports are stored in:
```
backend/uploads/reports/job_report_[timestamp].pdf
```

## Notes

- LinkedIn jobs **cannot be auto-applied** due to platform restrictions
- The scraper works without requiring LinkedIn login
- Skill extraction uses AI to identify relevant skills from the job description
- Missing skills are determined by comparing with your uploaded resume
- If no resume is uploaded, all extracted skills are marked as "missing"

## Error Handling

Common errors:
- **Invalid URL**: Non-LinkedIn URLs are rejected
- **Timeout**: Page takes too long to load (30s timeout)
- **Network Error**: Unable to reach LinkedIn
- **Extraction Failed**: Could not find job description on page

## Future Enhancements

- Support for LinkedIn login credentials (for Easy Apply)
- Batch scraping of multiple jobs
- Skill gap analysis with recommendations
- Integration with learning platforms for missing skills
