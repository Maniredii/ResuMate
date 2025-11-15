// API Configuration
const API_URL = 'http://localhost:5000/api';

// Get stored token
async function getToken() {
  const result = await chrome.storage.local.get(['token']);
  return result.token;
}

// Save token
async function saveToken(token) {
  await chrome.storage.local.set({ token });
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
function showDashboard(user) {
  const hasResume = user.resume_path !== null;
  
  document.getElementById('content').innerHTML = `
    <div class="status">
      <div class="status-item">
        <span class="status-label">User:</span>
        <span class="status-value">${user.name}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Resume:</span>
        <span class="status-value ${hasResume ? 'success' : 'error'}">
          ${hasResume ? '✓ Uploaded' : '✗ Not uploaded'}
        </span>
      </div>
    </div>
    
    <button id="applyBtn" class="button button-primary" ${!hasResume ? 'disabled' : ''}>
      Apply to This Job
    </button>
    
    <button id="openDashboard" class="button button-secondary">
      Open Dashboard
    </button>
    
    <button id="logoutBtn" class="button button-secondary">
      Logout
    </button>
  `;
  
  if (hasResume) {
    document.getElementById('applyBtn').addEventListener('click', applyToJob);
  }
  
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5013/dashboard' });
  });
  
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await chrome.storage.local.remove(['token']);
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
