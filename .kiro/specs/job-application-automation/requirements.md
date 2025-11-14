# Requirements Document

## Introduction

This document specifies the requirements for a local-only job application automation system. The system enables users to manage their professional documents, automatically tailor resumes to job descriptions using AI, and submit applications to job platforms (Indeed, Wellfound) with automated form filling. All data and processing occur locally on the user's laptop with no cloud dependencies except for AI API calls.

## Glossary

- **Application System**: The complete local job application automation software
- **User**: An individual using the Application System to apply for jobs
- **Job Platform**: External job posting websites (Indeed, Wellfound)
- **Tailored Resume**: A customized version of the User's resume optimized for a specific job description
- **Local Storage**: SQLite database and file system storage on the User's laptop
- **AI Service**: External API (OpenAI, Groq, or OpenRouter) used for resume tailoring
- **Job Scraper**: Playwright-based component that extracts job descriptions from URLs
- **Auto-Applier**: Playwright-based component that fills and submits job applications

## Requirements

### Requirement 1: User Account Management

**User Story:** As a job seeker, I want to create an account and securely log in, so that I can save my profile and application history locally.

#### Acceptance Criteria

1. WHEN a User provides name, email, and password, THE Application System SHALL create a new account with hashed password stored in Local Storage
2. WHEN a User provides valid credentials, THE Application System SHALL authenticate the User and issue a JWT token
3. THE Application System SHALL store all user data in a SQLite database file named database.db
4. WHEN a User logs in, THE Application System SHALL retrieve the User's profile data from Local Storage
5. THE Application System SHALL hash passwords using bcrypt before storing them

### Requirement 2: Document Upload and Management

**User Story:** As a User, I want to upload my resume and supporting documents, so that the system can use them for job applications.

#### Acceptance Criteria

1. WHEN a User uploads a resume file in PDF or DOCX format, THE Application System SHALL store the file in the uploads/resumes directory
2. WHEN a User uploads a certificate or other document, THE Application System SHALL store the file in the uploads/documents directory
3. THE Application System SHALL store only file paths in the SQLite database, not file contents
4. WHEN a file upload completes, THE Application System SHALL associate the file path with the User's account
5. THE Application System SHALL validate file types before accepting uploads

### Requirement 3: Job Description Extraction

**User Story:** As a User, I want to provide a job posting URL, so that the system can extract the job description automatically.

#### Acceptance Criteria

1. WHEN a User provides a job URL from Indeed or Wellfound, THE Job Scraper SHALL navigate to the URL using Playwright
2. WHEN the Job Scraper accesses a job page, THE Job Scraper SHALL extract the complete job description text
3. IF the job page fails to load within 30 seconds, THEN THE Application System SHALL return an error message to the User
4. THE Application System SHALL store the extracted job description in Local Storage
5. WHEN job description extraction completes, THE Application System SHALL pass the description to the AI Service for summarization

### Requirement 4: AI-Powered Resume Tailoring

**User Story:** As a User, I want my resume automatically tailored to match job descriptions, so that I can increase my chances of getting interviews.

#### Acceptance Criteria

1. WHEN the Application System receives a job description, THE Application System SHALL send the description and User's resume to the AI Service
2. THE AI Service SHALL extract key skills and requirements from the job description
3. THE AI Service SHALL generate a tailored resume that emphasizes relevant experience and skills
4. THE Application System SHALL produce an ATS-friendly formatted resume
5. WHEN tailoring completes, THE Application System SHALL save the Tailored Resume to the uploads/tailored directory

### Requirement 5: Automated Job Application Submission

**User Story:** As a User, I want the system to automatically fill and submit job applications, so that I can save time applying to multiple positions.

#### Acceptance Criteria

1. WHEN a User requests to apply to a job on Indeed, THE Auto-Applier SHALL navigate to the application page using Playwright
2. WHEN a User requests to apply to a job on Wellfound, THE Auto-Applier SHALL navigate to the application page using Playwright
3. THE Auto-Applier SHALL automatically fill form fields with User profile data
4. THE Auto-Applier SHALL upload the Tailored Resume to the application form
5. WHEN all required fields are filled, THE Auto-Applier SHALL submit the application
6. IF form submission fails, THEN THE Application System SHALL log the error and notify the User
7. THE Application System SHALL NOT attempt to apply to LinkedIn jobs

### Requirement 6: Application History Tracking

**User Story:** As a User, I want to view my job application history, so that I can track which positions I've applied to.

#### Acceptance Criteria

1. WHEN an application is submitted, THE Application System SHALL create a record in the job_applications table
2. THE Application System SHALL store job link, job description, tailored resume path, status, and timestamp for each application
3. WHEN a User requests application history, THE Application System SHALL retrieve all records associated with the User's account
4. THE Application System SHALL display application status as either "applied" or "error"
5. THE Application System SHALL sort application history by most recent first

### Requirement 7: Local-Only Architecture

**User Story:** As a User, I want all my data stored locally, so that I maintain privacy and can use the system offline (except for AI calls).

#### Acceptance Criteria

1. THE Application System SHALL use SQLite as the only database system
2. THE Application System SHALL store all files in local directories under the backend/uploads folder
3. THE Application System SHALL NOT use Supabase, Firebase, PostgreSQL, or MongoDB
4. THE Application System SHALL NOT require cloud hosting services
5. WHEN the Application System starts, THE Application System SHALL create the database.db file if it does not exist
6. THE Application System SHALL function without internet connectivity except when calling the AI Service

### Requirement 8: API Integration

**User Story:** As a User, I want the system to support multiple AI providers, so that I have flexibility in choosing AI services.

#### Acceptance Criteria

1. THE Application System SHALL support OpenAI API for resume tailoring
2. THE Application System SHALL support Groq API for resume tailoring
3. THE Application System SHALL support OpenRouter API for resume tailoring
4. WHEN configured, THE Application System SHALL use the specified AI Service for all tailoring operations
5. THE Application System SHALL handle API errors gracefully and notify the User

### Requirement 9: Web Interface

**User Story:** As a User, I want a modern web interface, so that I can easily interact with the system.

#### Acceptance Criteria

1. THE Application System SHALL provide a React-based frontend built with Vite
2. THE Application System SHALL use Tailwind CSS for styling
3. THE Application System SHALL include pages for Register, Login, Dashboard, Upload Resume, Job Application, Application History, and Settings
4. WHEN a User interacts with the frontend, THE Application System SHALL communicate with the backend via REST API endpoints
5. THE Application System SHALL display loading states during asynchronous operations

### Requirement 10: REST API Endpoints

**User Story:** As a developer, I want well-defined API endpoints, so that the frontend can communicate with the backend effectively.

#### Acceptance Criteria

1. THE Application System SHALL provide a POST /register endpoint that creates new user accounts
2. THE Application System SHALL provide a POST /login endpoint that authenticates users and returns JWT tokens
3. THE Application System SHALL provide a POST /upload-resume endpoint that accepts resume file uploads
4. THE Application System SHALL provide a POST /upload-document endpoint that accepts document file uploads
5. THE Application System SHALL provide a POST /apply-job endpoint that triggers the job application workflow
6. THE Application System SHALL provide a GET /get-user endpoint that returns authenticated user profile data
7. THE Application System SHALL provide a GET /application-history endpoint that returns user's application records
8. THE Application System SHALL require valid JWT tokens for all authenticated endpoints
