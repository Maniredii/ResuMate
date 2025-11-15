# Implementation Plan

- [x] 1. Initialize project structure and dependencies





  - Create backend and frontend directories
  - Initialize package.json for both backend and frontend
  - Install core dependencies: express, better-sqlite3, bcrypt, jsonwebtoken, multer, playwright, cors, dotenv for backend
  - Install React, Vite, Tailwind CSS, axios, react-router-dom for frontend
  - Create directory structure: backend/uploads/{resumes,tailored,documents}, backend/config, backend/middleware, backend/routes, backend/services, backend/models
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 2. Set up SQLite database and schema





  - Create backend/config/database.js with better-sqlite3 connection
  - Implement schema initialization with users, job_applications, and documents tables
  - Add indexes on user_id and email fields for query optimization
  - Create database initialization function that runs on server startup
  - _Requirements: 1.3, 7.1, 7.5_

- [x] 3. Implement authentication system






  - [x] 3.1 Create user registration endpoint

    - Implement POST /register route in backend/routes/auth.js
    - Add email validation and password hashing with bcrypt (10 salt rounds)
    - Insert new user into users table with hashed password
    - Return success response with user data (excluding password)
    - _Requirements: 1.1, 1.5_
  

  - [x] 3.2 Create user login endpoint

    - Implement POST /login route in backend/routes/auth.js
    - Validate credentials against database
    - Generate JWT token with 24-hour expiration
    - Return token and user data
    - _Requirements: 1.2, 1.4_
  

  - [x] 3.3 Create JWT authentication middleware

    - Implement authenticateToken middleware in backend/middleware/auth.js
    - Verify JWT token from Authorization header
    - Extract user ID and attach to request object
    - Return 401 for invalid/missing tokens
    - _Requirements: 1.2, 10.8_

- [x] 4. Implement file upload system






  - [x] 4.1 Configure Multer for file uploads

    - Create backend/config/multer.js with storage configuration
    - Set up separate storage destinations for resumes, tailored resumes, and documents
    - Implement file naming strategy: {userId}_{timestamp}_{originalname}
    - Add file type validation (whitelist: .pdf, .docx)
    - Set file size limit to 10MB
    - _Requirements: 2.1, 2.2, 2.5_
  

  - [x] 4.2 Create resume upload endpoint

    - Implement POST /upload-resume route in backend/routes/upload.js
    - Use Multer middleware to handle file upload
    - Store file path in users table resume_path column
    - Return uploaded file information
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [x] 4.3 Create document upload endpoint


    - Implement POST /upload-document route in backend/routes/upload.js
    - Use Multer middleware to handle file upload
    - Insert file path and type into documents table
    - Associate document with authenticated user
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 5. Implement AI service for resume tailoring






  - [x] 5.1 Create AI service module

    - Create backend/services/ai.service.js with provider abstraction
    - Implement OpenAI API integration using GPT-4o-mini model
    - Implement Groq API integration
    - Implement OpenRouter API integration
    - Add provider selection based on environment variable
    - _Requirements: 4.1, 4.2, 8.1, 8.2, 8.3, 8.4_
  

  - [x] 5.2 Implement resume tailoring function

    - Create tailorResume function that accepts resume text and job description
    - Build AI prompt that emphasizes relevant skills and ATS optimization
    - Parse AI response and format as clean text
    - Handle API errors gracefully with fallback messages
    - _Requirements: 4.2, 4.3, 4.4, 8.5_
  
  - [x] 5.3 Implement skill extraction function


    - Create extractSkills function that analyzes job descriptions
    - Use AI to identify key skills and requirements
    - Return structured array of skills
    - _Requirements: 4.2_

- [x] 6. Implement job scraping service









  - [x] 6.1 Create scraper service with Playwright

    - Create backend/services/scraper.service.js
    - Initialize Playwright browser in headless mode
    - Implement scrapeJobDescription function that accepts job URL
    - Add 30-second timeout for page loads
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 6.2 Add Indeed scraper implementation

    - Detect Indeed URLs
    - Navigate to job page and wait for content
    - Extract job title, company, and description using selectors
    - Return structured job data
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [x] 6.3 Add Wellfound scraper implementation

    - Detect Wellfound URLs
    - Navigate to job page and wait for content
    - Extract job title, company, and description using selectors
    - Return structured job data
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [x] 6.4 Add error handling and retry logic

    - Implement try-catch blocks for navigation failures
    - Return descriptive error messages for timeouts
    - Close browser instances properly
    - _Requirements: 3.3_

- [x] 7. Implement auto-apply service




  - [x] 7.1 Create auto-apply service with Playwright

    - Create backend/services/autoapply.service.js
    - Initialize Playwright browser (non-headless for form interaction)
    - Implement base form-filling utilities
    - _Requirements: 5.1, 5.2_
  

  - [x] 7.2 Implement Indeed auto-apply function

    - Create applyToIndeed function that accepts job URL, user data, and resume path
    - Navigate to Indeed application page
    - Fill form fields with user profile data (name, email, phone)
    - Upload tailored resume file
    - Submit application form
    - Capture success confirmation or error messages
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  

  - [x] 7.3 Implement Wellfound auto-apply function

    - Create applyToWellfound function that accepts job URL, user data, and resume path
    - Navigate to Wellfound application page
    - Fill form fields with user profile data
    - Upload tailored resume file
    - Submit application form
    - Capture success confirmation or error messages

    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  

  - [x] 7.4 Add error handling for application failures

    - Implement try-catch blocks for form submission errors
    - Log errors to database with status "error"
    - Return descriptive error messages to user
    - _Requirements: 5.6_

- [x] 8. Create job application workflow endpoint









  - [x] 8.1 Implement POST /apply-job endpoint

    - Create backend/routes/job.js with apply-job route
    - Accept job URL from request body
    - Call scraper service to extract job description
    - Pass job description to AI service for summarization
    - Read user's resume from file system
    - Call AI service to tailor resume
    - Save tailored resume to uploads/tailored directory
    - Call auto-apply service to submit application
    - Insert application record into job_applications table
    - Return success response with application details
    - _Requirements: 3.5, 4.5, 5.5, 6.1_
  

  - [x] 8.2 Add error handling for workflow failures







    - Handle scraper failures gracefully
    - Handle AI service failures with user-friendly messages
    - Handle auto-apply failures and log to database
    - Return appropriate HTTP status codes
    - _Requirements: 5.6, 6.1_

- [x] 9. Implement user profile and history endpoints






  - [x] 9.1 Create GET /get-user endpoint

    - Implement route in backend/routes/user.js
    - Require authentication middleware
    - Fetch user data from database by user ID
    - Parse profile_data JSON field
    - Return user profile excluding password hash
    - _Requirements: 1.4, 10.6_
  
  - [x] 9.2 Create GET /application-history endpoint


    - Implement route in backend/routes/job.js
    - Require authentication middleware
    - Query job_applications table filtered by user_id
    - Sort results by applied_at descending (most recent first)
    - Return array of application records
    - _Requirements: 6.2, 6.3, 6.5, 10.7_

- [x] 10. Set up Express server and middleware







  - Create backend/server.js as main entry point
  - Configure Express app with JSON body parser
  - Add CORS middleware for frontend communication
  - Mount authentication routes at /api/auth
  - Mount user routes at /api/user
  - Mount upload routes at /api/upload
  - Mount job routes at /api/job
  - Initialize database on server startup
  - Start server on port 5000
  - Add error handling middleware for uncaught errors
  - _Requirements: 7.1, 7.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 11. Initialize React frontend with Vite





  - Create frontend directory with Vite + React template
  - Install and configure Tailwind CSS
  - Install react-router-dom for routing
  - Install axios for API calls
  - Create src/services/api.js with axios instance configured for backend URL
  - Set up base API URL as http://localhost:5000/api
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 12. Implement frontend authentication pages







  - [x] 12.1 Create Register page


    - Create src/pages/Register.jsx with form fields: name, email, password, confirm password
    - Add form validation for email format and password matching
    - Implement handleSubmit that calls POST /register API
    - Display success message and redirect to login
    - Add error handling for registration failures
    - Style with Tailwind CSS
    - _Requirements: 9.3, 9.4_
  


  - [x] 12.2 Create Login page



    - Create src/pages/Login.jsx with form fields: email, password
    - Implement handleSubmit that calls POST /login API
    - Store JWT token in localStorage on success
    - Redirect to dashboard after successful login
    - Add error handling for invalid credentials
    - Style with Tailwind CSS
    - _Requirements: 9.3, 9.4_
  

  - [x] 12.3 Create authentication utilities

    - Create src/utils/auth.js with helper functions
    - Implement getToken, setToken, removeToken, isAuthenticated functions
    - Add token to axios default headers
    - _Requirements: 9.4_
  

  - [x] 12.4 Create ProtectedRoute component

    - Create src/components/ProtectedRoute.jsx
    - Check authentication status before rendering
    - Redirect to login if not authenticated
    - _Requirements: 9.3_

- [ ] 13. Implement frontend dashboard and navigation
  - [ ] 13.1 Create Navbar component
    - Create src/components/Navbar.jsx with navigation links
    - Add logout functionality that clears token and redirects
    - Show user name when authenticated
    - Style with Tailwind CSS
    - _Requirements: 9.3_
  
  - [ ] 13.2 Create Dashboard page
    - Create src/pages/Dashboard.jsx
    - Fetch user profile data on mount
    - Display user name and resume status
    - Show recent applications count
    - Add quick action buttons: Upload Resume, Apply to Job
    - Style with Tailwind CSS cards and grid layout
    - _Requirements: 9.3, 9.4_

- [ ] 14. Implement frontend file upload pages
  - [ ] 14.1 Create UploadResume page
    - Create src/pages/UploadResume.jsx with file input
    - Add file type validation (PDF, DOCX only)
    - Implement handleUpload that calls POST /upload-resume with FormData
    - Display upload progress or loading state
    - Show success message with uploaded file name
    - Add error handling for upload failures
    - Style with Tailwind CSS
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [ ] 14.2 Create upload document functionality
    - Add document upload section to UploadResume page or create separate page
    - Implement file upload for certificates and other documents
    - Call POST /upload-document API
    - Display list of uploaded documents
    - _Requirements: 9.3, 9.4_

- [ ] 15. Implement frontend job application page
  - [ ] 15.1 Create ApplyJob page structure
    - Create src/pages/ApplyJob.jsx with multi-step workflow
    - Add input field for job URL
    - Create state management for workflow steps
    - Add LoadingSpinner component for async operations
    - Style with Tailwind CSS
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [ ] 15.2 Implement job description extraction UI
    - Add "Extract Description" button
    - Call POST /apply-job API with step parameter
    - Display extracted job description in formatted text area
    - Show loading state during extraction
    - Handle extraction errors with user-friendly messages
    - _Requirements: 9.4, 9.5_
  
  - [ ] 15.3 Implement resume tailoring UI
    - Add "Tailor Resume" button (enabled after extraction)
    - Call AI tailoring endpoint
    - Display tailored resume preview in formatted text area
    - Show loading state during AI processing
    - Allow user to review tailored resume before applying
    - _Requirements: 9.4, 9.5_
  
  - [ ] 15.4 Implement auto-apply UI
    - Add "Apply Now" button (enabled after tailoring)
    - Call auto-apply endpoint
    - Display progress messages during application submission
    - Show success confirmation with application details
    - Handle application errors and display retry option
    - Add link to view application in history
    - _Requirements: 9.4, 9.5_

- [ ] 16. Implement frontend application history page
  - Create src/pages/ApplicationHistory.jsx
  - Fetch application history on mount using GET /application-history
  - Display applications in table format with columns: Date, Job Link, Status
  - Add status badges (green for "applied", red for "error")
  - Implement view details modal to show job description and tailored resume
  - Add filter dropdown for status filtering
  - Style with Tailwind CSS table components
  - _Requirements: 9.3, 9.4_

- [ ] 17. Implement frontend settings page
  - Create src/pages/Settings.jsx
  - Display user profile information
  - Add form to update profile data (phone, location, skills)
  - Implement AI provider selection dropdown
  - Add save button that updates user profile
  - Style with Tailwind CSS form components
  - _Requirements: 9.3_

- [ ] 18. Set up React Router and App component
  - Create src/App.jsx with BrowserRouter
  - Define routes for all pages: /, /register, /login, /dashboard, /upload-resume, /apply-job, /history, /settings
  - Wrap protected routes with ProtectedRoute component
  - Add Navbar to layout
  - Set up default redirect from / to /dashboard if authenticated, else /login
  - _Requirements: 9.3_

- [ ] 19. Create environment configuration files
  - Create backend/.env with PORT, JWT_SECRET, OPENAI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, AI_PROVIDER
  - Create backend/.env.example as template
  - Create frontend/.env with VITE_API_URL=http://localhost:5000/api
  - Add .env to .gitignore
  - _Requirements: 7.6, 8.4_

- [ ] 20. Create project documentation
  - Create README.md with project overview
  - Add installation instructions for backend and frontend
  - Document environment variable setup
  - Add usage guide with screenshots or descriptions
  - Include troubleshooting section
  - Document API endpoints
  - Add architecture diagram
  - _Requirements: 7.6_

- [ ] 21. Add npm scripts for development
  - Add "dev" script to backend/package.json using nodemon
  - Add "start" script to backend/package.json
  - Add "dev" script to frontend/package.json using vite
  - Add "build" script to frontend/package.json
  - Create root package.json with scripts to run both backend and frontend concurrently
  - _Requirements: 7.6_

- [ ]* 22. Implement basic error logging
  - Add console logging for all API errors
  - Log Playwright automation failures
  - Log AI service errors with provider information
  - Create logs directory for persistent error logs
  - _Requirements: 8.5_

- [ ]* 23. Add input validation and sanitization
  - Validate email format on backend
  - Sanitize file names to prevent path traversal
  - Validate job URLs before scraping
  - Add request body validation middleware
  - _Requirements: 1.1, 2.5, 3.1_

- [ ]* 24. Implement database backup functionality
  - Create backup script that copies database.db
  - Add timestamp to backup file names
  - Store backups in backend/backups directory
  - Add npm script to run backup manually
  - _Requirements: 7.3_
