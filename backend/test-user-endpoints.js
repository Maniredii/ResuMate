import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import jobRoutes from './routes/job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize database
initializeDatabase();

// Create Express app for testing
const app = express();
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/job', jobRoutes);

// Start server
const PORT = 5001; // Use different port for testing
const server = app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  runTests();
});

// Test data
const testUser = {
  name: 'Test User',
  email: `test_${Date.now()}@example.com`,
  password: 'testpassword123'
};

let authToken = null;
let userId = null;

async function makeRequest(method, path, data = null, token = null) {
  const url = `http://localhost:${PORT}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const responseData = await response.json();
  
  return {
    status: response.status,
    data: responseData
  };
}

async function testRegisterUser() {
  console.log('\n📝 Test 1: Register new user');
  console.log('='.repeat(50));
  
  try {
    const response = await makeRequest('POST', '/api/auth/register', testUser);
    
    if (response.status === 201 && response.data.user) {
      userId = response.data.user.id;
      console.log('✅ User registered successfully');
      console.log(`   User ID: ${userId}`);
      console.log(`   Email: ${response.data.user.email}`);
      return true;
    } else {
      console.log('❌ Registration failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return false;
  }
}

async function testLoginUser() {
  console.log('\n🔐 Test 2: Login user');
  console.log('='.repeat(50));
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log(`   Token received: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testGetUser() {
  console.log('\n👤 Test 3: GET /get-user endpoint');
  console.log('='.repeat(50));
  
  try {
    const response = await makeRequest('GET', '/api/user/get-user', null, authToken);
    
    if (response.status === 200 && response.data.user) {
      console.log('✅ Get user successful');
      console.log(`   User ID: ${response.data.user.id}`);
      console.log(`   Name: ${response.data.user.name}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Resume path: ${response.data.user.resume_path || 'Not uploaded'}`);
      console.log(`   Profile data: ${response.data.user.profile_data ? 'Present' : 'Not set'}`);
      
      // Verify password_hash is not included
      if (response.data.user.password_hash) {
        console.log('⚠️  WARNING: password_hash should not be returned!');
        return false;
      }
      
      return true;
    } else {
      console.log('❌ Get user failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Get user error:', error.message);
    return false;
  }
}

async function testGetUserWithoutAuth() {
  console.log('\n🔒 Test 4: GET /get-user without authentication');
  console.log('='.repeat(50));
  
  try {
    const response = await makeRequest('GET', '/api/user/get-user', null, null);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected unauthenticated request');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}`);
      return true;
    } else {
      console.log('❌ Should have rejected unauthenticated request');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

async function testApplicationHistory() {
  console.log('\n📋 Test 5: GET /application-history endpoint');
  console.log('='.repeat(50));
  
  try {
    const response = await makeRequest('GET', '/api/job/application-history', null, authToken);
    
    if (response.status === 200 && Array.isArray(response.data.applications)) {
      console.log('✅ Get application history successful');
      console.log(`   Applications count: ${response.data.count}`);
      console.log(`   Applications array length: ${response.data.applications.length}`);
      
      if (response.data.applications.length > 0) {
        const app = response.data.applications[0];
        console.log(`   Sample application:`);
        console.log(`     - ID: ${app.id}`);
        console.log(`     - Job link: ${app.job_link}`);
        console.log(`     - Status: ${app.status}`);
        console.log(`     - Applied at: ${app.applied_at}`);
      } else {
        console.log('   (No applications yet - this is expected for a new user)');
      }
      
      return true;
    } else {
      console.log('❌ Get application history failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Get application history error:', error.message);
    return false;
  }
}

async function testApplicationHistoryWithoutAuth() {
  console.log('\n🔒 Test 6: GET /application-history without authentication');
  console.log('='.repeat(50));
  
  try {
    const response = await makeRequest('GET', '/api/job/application-history', null, null);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected unauthenticated request');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}`);
      return true;
    } else {
      console.log('❌ Should have rejected unauthenticated request');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

async function testApplicationHistorySorting() {
  console.log('\n📊 Test 7: Application history sorting (most recent first)');
  console.log('='.repeat(50));
  
  try {
    // Insert test application records with different timestamps
    const insertStmt = db.prepare(`
      INSERT INTO job_applications (user_id, job_link, job_description, status, applied_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    const app1Time = new Date(now.getTime() - 3600000).toISOString(); // 1 hour ago
    const app2Time = new Date(now.getTime() - 7200000).toISOString(); // 2 hours ago
    const app3Time = new Date(now.getTime() - 1800000).toISOString(); // 30 minutes ago
    
    insertStmt.run(userId, 'https://example.com/job1', 'Job 1 description', 'applied', app1Time);
    insertStmt.run(userId, 'https://example.com/job2', 'Job 2 description', 'applied', app2Time);
    insertStmt.run(userId, 'https://example.com/job3', 'Job 3 description', 'error', app3Time);
    
    console.log('   Inserted 3 test applications with different timestamps');
    
    // Fetch application history
    const response = await makeRequest('GET', '/api/job/application-history', null, authToken);
    
    if (response.status === 200 && response.data.applications.length >= 3) {
      const apps = response.data.applications;
      console.log('✅ Application history retrieved');
      console.log(`   Total applications: ${apps.length}`);
      
      // Check if sorted by most recent first
      let isSorted = true;
      for (let i = 0; i < apps.length - 1; i++) {
        const current = new Date(apps[i].applied_at);
        const next = new Date(apps[i + 1].applied_at);
        if (current < next) {
          isSorted = false;
          break;
        }
      }
      
      if (isSorted) {
        console.log('✅ Applications correctly sorted by most recent first');
        console.log(`   Most recent: ${apps[0].applied_at}`);
        console.log(`   Oldest: ${apps[apps.length - 1].applied_at}`);
        return true;
      } else {
        console.log('❌ Applications not sorted correctly');
        return false;
      }
    } else {
      console.log('❌ Failed to retrieve applications');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Starting User Profile and History Endpoint Tests...\n');
  
  const results = {
    'Register User': false,
    'Login User': false,
    'GET /get-user': false,
    'GET /get-user (no auth)': false,
    'GET /application-history': false,
    'GET /application-history (no auth)': false,
    'Application History Sorting': false
  };
  
  // Run tests in sequence
  results['Register User'] = await testRegisterUser();
  if (results['Register User']) {
    results['Login User'] = await testLoginUser();
  }
  
  if (results['Login User']) {
    results['GET /get-user'] = await testGetUser();
    results['GET /get-user (no auth)'] = await testGetUserWithoutAuth();
    results['GET /application-history'] = await testApplicationHistory();
    results['GET /application-history (no auth)'] = await testApplicationHistoryWithoutAuth();
    results['Application History Sorting'] = await testApplicationHistorySorting();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  
  let passCount = 0;
  let totalCount = 0;
  
  for (const [testName, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${testName}: ${status}`);
    if (passed) passCount++;
    totalCount++;
  }
  
  console.log('='.repeat(50));
  console.log(`Results: ${passCount}/${totalCount} tests passed`);
  
  // Cleanup and exit
  server.close(() => {
    console.log('\n✨ Test server stopped');
    process.exit(passCount === totalCount ? 0 : 1);
  });
}
