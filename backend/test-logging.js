import { logApiError, logAutomationError, logAiError, logError } from './utils/logger.js';

console.log('Testing logging system...\n');

// Test 1: Log API Error
console.log('1. Testing API error logging...');
try {
  throw new Error('Test API error');
} catch (error) {
  const mockReq = {
    method: 'POST',
    url: '/api/test',
    path: '/api/test',
    user: { userId: 123 },
    ip: '127.0.0.1'
  };
  logApiError(error, mockReq, { endpoint: '/test', testData: 'sample' });
}
console.log('✓ API error logged\n');

// Test 2: Log Automation Error
console.log('2. Testing automation error logging...');
try {
  throw new Error('Test automation error');
} catch (error) {
  logAutomationError(error, {
    platform: 'indeed',
    jobUrl: 'https://indeed.com/test-job',
    userId: 123,
    step: 'scrapeJobDescription',
    errorType: 'TIMEOUT'
  });
}
console.log('✓ Automation error logged\n');

// Test 3: Log AI Service Error
console.log('3. Testing AI service error logging...');
try {
  throw new Error('Test AI service error');
} catch (error) {
  logAiError(error, 'openai', {
    model: 'gpt-4o-mini',
    operation: 'tailorResume',
    userId: 123
  });
}
console.log('✓ AI service error logged\n');

// Test 4: Log General Error
console.log('4. Testing general error logging...');
try {
  throw new Error('Test general error');
} catch (error) {
  logError(error, {
    context: 'test_context',
    additionalInfo: 'sample data'
  });
}
console.log('✓ General error logged\n');

console.log('All logging tests completed successfully!');
console.log('Check backend/logs/ directory for log files:');
console.log('  - error.log (contains all errors)');
console.log('  - api.log (contains API errors)');
console.log('  - automation.log (contains automation errors)');
