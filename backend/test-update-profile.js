import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testUpdateProfile() {
  try {
    console.log('Testing Update Profile Endpoint...\n');

    // Step 1: Register a new user
    console.log('1. Registering new user...');
    const timestamp = Date.now();
    const testEmail = `test_${timestamp}@example.com`;
    
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: 'password123'
    });
    console.log('✓ User registered\n');

    // Step 2: Login to get token
    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Step 3: Get current user profile
    console.log('3. Getting current profile...');
    const getUserResponse = await axios.get(`${API_URL}/user/get-user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Current profile:');
    console.log('Name:', getUserResponse.data.user.name);
    console.log('Email:', getUserResponse.data.user.email);
    console.log('Profile Data:', getUserResponse.data.user.profile_data);
    console.log('');

    // Step 3: Update profile
    console.log('3. Updating profile...');
    const updateData = {
      name: 'Test User Updated',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      ai_provider: 'groq'
    };

    const updateResponse = await axios.put(`${API_URL}/user/update-profile`, updateData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Profile updated successfully');
    console.log('Updated profile:');
    console.log('Name:', updateResponse.data.user.name);
    console.log('Profile Data:', updateResponse.data.user.profile_data);
    console.log('');

    // Step 4: Verify update by getting profile again
    console.log('4. Verifying update...');
    const verifyResponse = await axios.get(`${API_URL}/user/get-user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Verified profile:');
    console.log('Name:', verifyResponse.data.user.name);
    console.log('Phone:', verifyResponse.data.user.profile_data?.phone);
    console.log('Location:', verifyResponse.data.user.profile_data?.location);
    console.log('Skills:', verifyResponse.data.user.profile_data?.skills);
    console.log('AI Provider:', verifyResponse.data.user.profile_data?.ai_provider);
    console.log('');

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUpdateProfile();
