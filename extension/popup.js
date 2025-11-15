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
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      if (tabName === 'history') showHistory();
      else if (tabName === 'settings') showSettings(user);
      else showDashboard(user);
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

// Initialize
checkAuth();
