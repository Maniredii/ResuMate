import dotenv from 'dotenv';
import { makeAIRequest, getProvider } from './services/ai.service.js';

// Load environment variables
dotenv.config();

async function testProvider(providerName) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing ${providerName.toUpperCase()} API...`);
  console.log('='.repeat(50));
  
  try {
    const messages = [
      {
        role: 'user',
        content: 'Say "Hello! I am working correctly." in exactly those words.'
      }
    ];
    
    const startTime = Date.now();
    const response = await makeAIRequest(messages, providerName);
    const endTime = Date.now();
    
    console.log(`✅ SUCCESS!`);
    console.log(`Response time: ${endTime - startTime}ms`);
    console.log(`Response: ${response}`);
    
    return true;
  } catch (error) {
    console.log(`❌ FAILED!`);
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function testAllProviders() {
  console.log('\n🚀 Starting AI Provider Tests...\n');
  
  const providers = ['openrouter', 'groq', 'gemini'];
  const results = {};
  
  for (const provider of providers) {
    results[provider] = await testProvider(provider);
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  
  for (const [provider, success] of Object.entries(results)) {
    const status = success ? '✅ WORKING' : '❌ FAILED';
    console.log(`${provider.toUpperCase()}: ${status}`);
  }
  
  const currentProvider = getProvider();
  console.log(`\nCurrent default provider: ${currentProvider.name.toUpperCase()}`);
  console.log(`Model: ${currentProvider.config.model}`);
}

// Run tests
testAllProviders().catch(console.error);
