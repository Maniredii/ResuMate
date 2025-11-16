// API Configuration
const API_URL = 'http://localhost:5000/api';

// Current tab state
let currentTab = 'dashboard'; // dashboard, history, settings

// Get stored token
async function getToken() {
  const result = await chrome.storage.local.get(['token']);
  return result.token;
}

// Save token
async function saveToken(token) {
  await chrome.storage.local.set({ token });
}

// Get stored user data
async function getUserData() {
  const result = await chrome.storage.local.get(['userData']);
  return result.userData;
}

// Save user data
async function saveUserData(userData) {
  await chrome.storage.local.set({ userData });
}

// Get user profile for auto-fill
async function getUserProfile() {
  const result = await chrome.storage.local.get(['userProfile']);
  return result.userProfile || null;
}

// Save user profile for auto-fill
async function saveUserProfile(profile) {
  await chrome.storage.local.set({ userProfile: profile });
}

// Fetch profile from backend and sync to extension
async function syncProfileFromBackend() {
  try {
    const token = await getToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/profile/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      // Save to extension storage
      await saveUserProfile(data.profile);
      return data.profile;
    }
  } catch (error) {
    console.error('Failed to sync profile from backend:', error);
  }
  return null;
}

// Save profile to backend
async function saveProfileToBackend(profile) {
  try {
    const token = await getToken();
    if (!token) return false;

    const response = await fetch(`${API_URL}/profile/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ profile })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to save profile to backend:', error);
    return false;
  }
}

// Check if user is logged in
async function checkAuth() {
  const token = await getToken();
  if (!token) {
    showLogin();
    return false;
  }
  
  // Verify token is valid
  try {
    const response = await fetch(`${API_URL}/user/get-user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      showDashboard(data.user);
      return true;
    } else {
      showLogin();
      return false;
    }
  } catch (error) {
    showError('Cannot connect to server. Make sure the backend is running.');
    return false;
  }
}

// Show login form
function showLogin() {
  document.getElementById('content').innerHTML = `
    <div class="message info">
      Please login to use the extension
    </div>
    <form id="loginForm">
      <input type="email" id="email" placeholder="Email" required 
        style="width: 100%; padding: 10px; margin-bottom: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
      <input type="password" id="password" placeholder="Password" required
        style="width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #d1d5db; border-radius: 6px;">
      <button type="submit" class="button button-primary">Login</button>
    </form>
    <a href="http://localhost:5013/register" target="_blank" class="link">
      Don't have an account? Register
    </a>
  `;
  
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  showLoading('Logging in...');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      await saveToken(data.token);
      checkAuth();
    } else {
      showError(data.message || 'Login failed');
      setTimeout(() => showLogin(), 2000);
    }
  } catch (error) {
    showError('Cannot connect to server');
    setTimeout(() => showLogin(), 2000);
  }
}

// Show dashboard
async function showDashboard(user) {
  await saveUserData(user);
  const hasResume = user.resume_path !== null;
  
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isJobPage = tab.url && (
    tab.url.includes('indeed.com/viewjob') ||
    tab.url.includes('wellfound.com/jobs') ||
    tab.url.includes('linkedin.com/jobs')
  );
  
  // Get application stats
  let stats = { total: 0, today: 0 };
  try {
    const token = await getToken();
    const response = await fetch(`${API_URL}/job/application-history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      stats.total = data.applications.length;
      const today = new Date().toDateString();
      stats.today = data.applications.filter(app => 
        new Date(app.applied_at).toDateString() === today
      ).length;
    }
  } catch (e) {
    console.error('Failed to fetch stats:', e);
  }
  
  document.getElementById('content').innerHTML = `
    <!-- Tabs -->
    <div class="tabs">
      <button class="tab active" data-tab="dashboard">Dashboard</button>
      <button class="tab" data-tab="history">History</button>
      <button class="tab" data-tab="profile">Profile</button>
      <button class="tab" data-tab="settings">Settings</button>
    </div>
    
    <div id="tab-content">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Applied</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.today}</div>
          <div class="stat-label">Today</div>
        </div>
      </div>
      
      <!-- Status -->
      <div class="status">
        <div class="status-item">
          <span class="status-label">
            <div class="status-icon" style="background: #dbeafe; color: #2563eb;">👤</div>
            User
          </span>
          <span class="status-value">${user.name}</span>
        </div>
        <div class="status-item">
          <span class="status-label">
            <div class="status-icon" style="background: ${hasResume ? '#d1fae5' : '#fee2e2'}; color: ${hasResume ? '#10b981' : '#ef4444'};">📄</div>
            Resume
          </span>
          <span class="status-value ${hasResume ? 'success' : 'error'}">
            <span class="badge ${hasResume ? 'success' : 'error'}">
              ${hasResume ? '✓ Uploaded' : '✗ Missing'}
            </span>
          </span>
        </div>
      </div>
      
      ${isJobPage ? `
        <!-- Job Preview -->
        <div class="job-preview">
          <div class="job-title">Current Job Page</div>
          <div class="job-company">Ready to apply</div>
          <div class="job-url">${tab.url}</div>
        </div>
        
        <button id="applyBtn" class="button button-primary" ${!hasResume ? 'disabled' : ''}>
          <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Apply to This Job
        </button>
      ` : `
        <div class="message info">
          <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>Navigate to a job page on Indeed, Wellfound, or LinkedIn to apply</div>
        </div>
      `}
      
      <button id="openDashboard" class="button button-secondary">
        <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
        Open Full Dashboard
      </button>
      
      <button id="logoutBtn" class="button button-secondary">
        <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Logout
      </button>
    </div>
  `;
  
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      console.log('Tab clicked:', tabName);
      if (tabName === 'history') await showHistory();
      else if (tabName === 'profile') await showProfileSetup();
      else if (tabName === 'settings') await showSettings(user);
      else await showDashboard(user);
    });
  });
  
  if (isJobPage && hasResume) {
    document.getElementById('applyBtn').addEventListener('click', applyToJob);
  }
  
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5013/dashboard' });
  });
  
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await chrome.storage.local.clear();
    showLogin();
  });
}

// Apply to current job
async function applyToJob() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const jobUrl = tab.url;
  
  showLoading('Applying to job...');
  
  const token = await getToken();
  
  try {
    const response = await fetch(`${API_URL}/job/apply-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ jobUrl })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccess('Application submitted successfully!');
      setTimeout(() => checkAuth(), 3000);
    } else {
      showError(data.message || 'Application failed');
      setTimeout(() => checkAuth(), 3000);
    }
  } catch (error) {
    showError('Cannot connect to server');
    setTimeout(() => checkAuth(), 3000);
  }
}

// Show loading state
function showLoading(message) {
  document.getElementById('content').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p style="color: #6b7280; font-size: 13px;">${message}</p>
    </div>
  `;
}

// Show success message
function showSuccess(message) {
  document.getElementById('content').innerHTML = `
    <div class="message success">
      ✓ ${message}
    </div>
  `;
}

// Show error message
function showError(message) {
  document.getElementById('content').innerHTML = `
    <div class="message error">
      ✗ ${message}
    </div>
  `;
}

// Show history tab
async function showHistory() {
  console.log('showHistory called');
  const token = await getToken();
  const user = await getUserData();
  console.log('Token:', token ? 'exists' : 'missing');
  
  // Show loading in tab-content only
  const tabContent = document.getElementById('tab-content');
  if (tabContent) {
    tabContent.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p style="color: #6b7280; font-size: 13px;">Loading history...</p>
      </div>
    `;
  }
  
  try {
    console.log('Fetching history from:', `${API_URL}/job/application-history`);
    const response = await fetch(`${API_URL}/job/application-history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Response status:', response.status);
    if (!response.ok) throw new Error('Failed to fetch history');
    
    const data = await response.json();
    console.log('History data:', data);
    const applications = data.applications.slice(0, 5); // Show last 5
    
    if (tabContent) {
      tabContent.innerHTML = `
        ${applications.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-text">No applications yet</div>
          </div>
        ` : `
          ${applications.map(app => `
            <div class="history-item">
              <div class="history-title">${app.job_link.substring(0, 40)}...</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span class="badge ${app.status === 'applied' ? 'success' : 'error'}">
                  ${app.status}
                </span>
                <span class="history-date">${new Date(app.applied_at).toLocaleDateString()}</span>
              </div>
            </div>
          `).join('')}
          
          <button id="viewAllHistory" class="button button-secondary" style="margin-top: 12px;">
            <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            View All Applications
          </button>
        `}
      `;
      
      const viewAllBtn = document.getElementById('viewAllHistory');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
          chrome.tabs.create({ url: 'http://localhost:5013/history' });
        });
      }
    }
  } catch (error) {
    console.error('History error:', error);
    if (tabContent) {
      tabContent.innerHTML = `
        <div class="message error">
          ✗ Failed to load history
        </div>
      `;
    }
    setTimeout(() => checkAuth(), 2000);
  }
}

// Show settings tab
async function showSettings(user) {
  const hasResume = user.resume_path !== null;
  
  document.getElementById('tab-content').innerHTML = `
    <div class="status">
      <div class="status-item">
        <span class="status-label">
          <div class="status-icon" style="background: #dbeafe; color: #2563eb;">📧</div>
          Email
        </span>
        <span class="status-value" style="font-size: 11px;">${user.email}</span>
      </div>
      <div class="status-item">
        <span class="status-label">
          <div class="status-icon" style="background: ${hasResume ? '#d1fae5' : '#fee2e2'}; color: ${hasResume ? '#10b981' : '#ef4444'};">📄</div>
          Resume
        </span>
        <span class="status-value">
          <span class="badge ${hasResume ? 'success' : 'error'}">
            ${hasResume ? '✓ Uploaded' : '✗ Missing'}
          </span>
        </span>
      </div>
      ${user.profile_data?.skills ? `
        <div class="status-item">
          <span class="status-label">
            <div class="status-icon" style="background: #fef3c7; color: #f59e0b;">⭐</div>
            Skills
          </span>
          <span class="status-value" style="font-size: 11px;">
            ${user.profile_data.skills.length} skills
          </span>
        </div>
      ` : ''}
    </div>
    
    ${hasResume ? `
      <button id="viewResume" class="button button-secondary">
        <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        View Resume
      </button>
      
      <button id="downloadResume" class="button button-secondary">
        <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Download Resume
      </button>
    ` : `
      <div class="message warning">
        <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div>Please upload a resume to start applying to jobs</div>
      </div>
    `}
    
    <button id="openSettings" class="button button-secondary">
      <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      Full Settings
    </button>
  `;
  
  // Event listeners
  const viewResumeBtn = document.getElementById('viewResume');
  if (viewResumeBtn) {
    viewResumeBtn.addEventListener('click', async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/upload/view-resume`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        chrome.tabs.create({ url });
      } catch (e) {
        showError('Failed to view resume');
        setTimeout(() => checkAuth(), 2000);
      }
    });
  }
  
  const downloadResumeBtn = document.getElementById('downloadResume');
  if (downloadResumeBtn) {
    downloadResumeBtn.addEventListener('click', async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/upload/download-resume`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.docx';
        a.click();
        showSuccess('Resume downloaded!');
        setTimeout(() => checkAuth(), 2000);
      } catch (e) {
        showError('Failed to download resume');
        setTimeout(() => checkAuth(), 2000);
      }
    });
  }
  
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5013/settings' });
  });
}

// Initialize
checkAuth();


// Show profile setup tab
async function showProfileSetup() {
  // Try to sync from backend first
  let profile = await syncProfileFromBackend();
  
  if (!profile) {
    profile = await getUserProfile();
  }
  
  if (!profile) {
    profile = {
      personalInfo: {
      firstName: '',
      lastName: '',
      fullName: '',
      email: '',
      phone: '',
      location: { streetAddress: '', city: '', state: '', country: '', zipCode: '' },
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
      },
      applicationQuestions: {
        speaksEnglish: 'Yes',
        canStartImmediately: '',
        nightShiftAvailable: '',
        salaryExpectations: '',
        yearsOfExperience: '',
        interviewAvailability: '',
        commute: ''
      }
    };
  }

  const tabContent = document.getElementById('tab-content');
  if (tabContent) {
    tabContent.innerHTML = `
      <div style="max-height: 400px; overflow-y: auto; padding-right: 8px;">
        <div class="message info" style="margin-bottom: 12px;">
          <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div style="font-size: 11px;">Fill out your profile to enable Quick Apply auto-fill on job application pages</div>
        </div>

        <form id="profileForm">
          <!-- Personal Info -->
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Personal Information</h3>
            
            <input type="text" id="firstName" placeholder="First Name" value="${profile.personalInfo.firstName}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="lastName" placeholder="Last Name" value="${profile.personalInfo.lastName}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="email" id="email" placeholder="Email" value="${profile.personalInfo.email}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="tel" id="phone" placeholder="Phone Number" value="${profile.personalInfo.phone}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
          </div>

          <!-- Location -->
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Location</h3>
            
            <input type="text" id="streetAddress" placeholder="Street Address" value="${profile.personalInfo.location.streetAddress}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="city" placeholder="City" value="${profile.personalInfo.location.city}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="state" placeholder="State/Province" value="${profile.personalInfo.location.state}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="country" placeholder="Country" value="${profile.personalInfo.location.country}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="zipCode" placeholder="Zip Code" value="${profile.personalInfo.location.zipCode}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
          </div>

          <!-- Social Links -->
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Social Links</h3>
            
            <input type="url" id="linkedIn" placeholder="LinkedIn URL" value="${profile.personalInfo.linkedIn}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="url" id="portfolio" placeholder="Portfolio/Website URL" value="${profile.personalInfo.portfolio}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="url" id="github" placeholder="GitHub URL" value="${profile.personalInfo.github}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
          </div>

          <!-- Work Experience -->
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Work Experience</h3>
            
            <input type="text" id="currentTitle" placeholder="Current Job Title" value="${profile.workExperience.currentTitle}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="currentCompany" placeholder="Current Company" value="${profile.workExperience.currentCompany}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="yearsOfExperience" placeholder="Years of Experience" value="${profile.workExperience.yearsOfExperience}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
          </div>

          <!-- Education -->
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Education</h3>
            
            <input type="text" id="degree" placeholder="Degree (e.g., Bachelor's)" value="${profile.education.degree}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="major" placeholder="Major/Field of Study" value="${profile.education.major}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="university" placeholder="University/College" value="${profile.education.university}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <input type="text" id="graduationYear" placeholder="Graduation Year" value="${profile.education.graduationYear}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
          </div>

          <!-- Preferences -->
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Preferences</h3>
            
            <input type="text" id="workAuthorization" placeholder="Work Authorization (e.g., US Citizen)" value="${profile.preferences.workAuthorization}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; color: #374151;">
              <input type="checkbox" id="willingToRelocate" ${profile.preferences.willingToRelocate ? 'checked' : ''}>
              Willing to relocate
            </label>
            
            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; color: #374151;">
              <input type="checkbox" id="requiresSponsorship" ${profile.preferences.requiresSponsorship ? 'checked' : ''}>
              Requires visa sponsorship
            </label>
          </div>

          <!-- Cover Letter Template -->
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Cover Letter Template</h3>
            
            <textarea id="coverLetterTemplate" placeholder="Enter a template cover letter that will be used for applications..." rows="4"
              style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; resize: vertical;">${profile.additionalInfo.coverLetterTemplate}</textarea>
          </div>

          <!-- Application Questions -->
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">Common Application Questions</h3>
            
            <label style="display: block; font-size: 11px; color: #374151; margin-bottom: 4px;">Do you speak English?</label>
            <select id="speaksEnglish" style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
              <option value="Yes" ${profile.applicationQuestions.speaksEnglish === 'Yes' ? 'selected' : ''}>Yes</option>
              <option value="No" ${profile.applicationQuestions.speaksEnglish === 'No' ? 'selected' : ''}>No</option>
            </select>
            
            <label style="display: block; font-size: 11px; color: #374151; margin-bottom: 4px;">Can you start immediately?</label>
            <textarea id="canStartImmediately" placeholder="e.g., Yes, I can start immediately" rows="2"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; resize: vertical;">${profile.applicationQuestions.canStartImmediately}</textarea>
            
            <label style="display: block; font-size: 11px; color: #374151; margin-bottom: 4px;">Night shift availability?</label>
            <textarea id="nightShiftAvailable" placeholder="e.g., Yes, I am available for night shifts" rows="2"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; resize: vertical;">${profile.applicationQuestions.nightShiftAvailable}</textarea>
            
            <label style="display: block; font-size: 11px; color: #374151; margin-bottom: 4px;">Salary expectations?</label>
            <textarea id="salaryExpectations" placeholder="e.g., Yes, the salary meets my expectations" rows="2"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; resize: vertical;">${profile.applicationQuestions.salaryExpectations}</textarea>
            
            <label style="display: block; font-size: 11px; color: #374151; margin-bottom: 4px;">Years of Experience</label>
            <input type="text" id="yearsOfExperience" placeholder="e.g., 5 years" value="${profile.applicationQuestions.yearsOfExperience}"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
            
            <label style="display: block; font-size: 11px; color: #374151; margin-bottom: 4px;">Interview Availability</label>
            <textarea id="interviewAvailability" placeholder="e.g., Monday-Friday 9 AM - 5 PM IST" rows="2"
              style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; resize: vertical;">${profile.applicationQuestions.interviewAvailability}</textarea>
            
            <label style="display: block; font-size: 11px; color: #374151; margin-bottom: 4px;">Commute/Relocation</label>
            <select id="commute" style="width: 100%; padding: 8px; margin-bottom: 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px;">
              <option value="">Select...</option>
              <option value="Yes, I can make the commute" ${profile.applicationQuestions.commute === 'Yes, I can make the commute' ? 'selected' : ''}>Yes, I can make the commute</option>
              <option value="Yes, I am planning to relocate" ${profile.applicationQuestions.commute === 'Yes, I am planning to relocate' ? 'selected' : ''}>Yes, I am planning to relocate</option>
              <option value="Yes, but I need relocation assistance" ${profile.applicationQuestions.commute === 'Yes, but I need relocation assistance' ? 'selected' : ''}>Yes, but I need relocation assistance</option>
              <option value="No" ${profile.applicationQuestions.commute === 'No' ? 'selected' : ''}>No</option>
            </select>
          </div>

          <button type="submit" class="button button-primary">
            <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Save Profile
          </button>
        </form>
      </div>
    `;

    // Handle form submission
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const updatedProfile = {
        personalInfo: {
          firstName: document.getElementById('firstName').value,
          lastName: document.getElementById('lastName').value,
          fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`.trim(),
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value,
          location: {
            streetAddress: document.getElementById('streetAddress').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            country: document.getElementById('country').value,
            zipCode: document.getElementById('zipCode').value
          },
          linkedIn: document.getElementById('linkedIn').value,
          portfolio: document.getElementById('portfolio').value,
          github: document.getElementById('github').value
        },
        workExperience: {
          currentTitle: document.getElementById('currentTitle').value,
          currentCompany: document.getElementById('currentCompany').value,
          yearsOfExperience: document.getElementById('yearsOfExperience').value
        },
        education: {
          degree: document.getElementById('degree').value,
          major: document.getElementById('major').value,
          university: document.getElementById('university').value,
          graduationYear: document.getElementById('graduationYear').value
        },
        preferences: {
          workAuthorization: document.getElementById('workAuthorization').value,
          willingToRelocate: document.getElementById('willingToRelocate').checked,
          requiresSponsorship: document.getElementById('requiresSponsorship').checked
        },
        additionalInfo: {
          coverLetterTemplate: document.getElementById('coverLetterTemplate').value
        },
        applicationQuestions: {
          speaksEnglish: document.getElementById('speaksEnglish').value,
          canStartImmediately: document.getElementById('canStartImmediately').value,
          nightShiftAvailable: document.getElementById('nightShiftAvailable').value,
          salaryExpectations: document.getElementById('salaryExpectations').value,
          yearsOfExperience: document.getElementById('yearsOfExperience').value,
          interviewAvailability: document.getElementById('interviewAvailability').value,
          commute: document.getElementById('commute').value
        }
      };

      // Save to extension storage
      await saveUserProfile(updatedProfile);

      // Save to backend database
      const backendSaved = await saveProfileToBackend(updatedProfile);

      // Show success message
      tabContent.innerHTML = `
        <div class="message success">
          <svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <div>
            Profile saved successfully!${backendSaved ? ' Synced to database.' : ' (Local only - backend sync failed)'}
            <br>You can now use Quick Apply on job pages.
          </div>
        </div>
      `;

      setTimeout(() => showProfileSetup(), 2000);
    });
  }
}
