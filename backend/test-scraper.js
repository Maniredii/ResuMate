import { scrapeJobDescription } from './services/scraper.service.js';

// Test the scraper service
async function testScraper() {
  console.log('Testing Job Scraper Service...\n');
  
  // Test with a sample Indeed URL (you'll need to replace with a real URL)
  const testUrl = 'https://www.indeed.com/viewjob?jk=test';
  
  try {
    console.log(`Attempting to scrape: ${testUrl}`);
    const result = await scrapeJobDescription(testUrl);
    console.log('\nSuccess! Job data extracted:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\nError occurred:');
    console.error(error.message);
  }
  
  console.log('\n--- Test Complete ---');
}

testScraper();
