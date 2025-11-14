import { autoApply } from './services/autoapply.service.js';

/**
 * Test script for auto-apply service
 * This is a manual test - requires a real job URL and resume file
 */

async function testAutoApply() {
  console.log('Testing Auto-Apply Service...\n');
  
  // Test data
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567'
  };
  
  // Example resume path (adjust to your actual file)
  const resumePath = './uploads/resumes/test-resume.pdf';
  
  // Test 1: Invalid URL
  console.log('Test 1: Invalid URL');
  const result1 = await autoApply('', userData, resumePath);
  console.log('Result:', result1);
  console.log('Expected: success = false\n');
  
  // Test 2: Unsupported platform
  console.log('Test 2: Unsupported platform');
  const result2 = await autoApply('https://linkedin.com/jobs/123', userData, resumePath);
  console.log('Result:', result2);
  console.log('Expected: success = false, unsupported platform\n');
  
  // Test 3: Missing user data
  console.log('Test 3: Missing user data');
  const result3 = await autoApply('https://indeed.com/jobs/123', {}, resumePath);
  console.log('Result:', result3);
  console.log('Expected: success = false, invalid user data\n');
  
  // Test 4: Missing resume path
  console.log('Test 4: Missing resume path');
  const result4 = await autoApply('https://indeed.com/jobs/123', userData, '');
  console.log('Result:', result4);
  console.log('Expected: success = false, resume path required\n');
  
  console.log('Basic validation tests completed!');
  console.log('\nNote: To test actual job application, provide a real job URL and resume file.');
  console.log('Example:');
  console.log('  const jobUrl = "https://www.indeed.com/viewjob?jk=XXXXX";');
  console.log('  const result = await autoApply(jobUrl, userData, resumePath);');
}

testAutoApply().catch(console.error);
