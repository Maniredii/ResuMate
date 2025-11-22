// Background service worker (optimized)

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

// Helper to get cached data
function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

// Helper to set cached data
function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'quickApply') {
    // Open popup or handle quick apply
    chrome.action.openPopup();
  }
  
  // Handle profile requests with caching
  if (request.action === 'getProfile') {
    const cached = getCached('userProfile');
    if (cached) {
      sendResponse({ profile: cached, fromCache: true });
      return true;
    }
    
    chrome.storage.local.get(['userProfile'], (result) => {
      setCached('userProfile', result.userProfile);
      sendResponse({ profile: result.userProfile, fromCache: false });
    });
    return true; // Keep channel open for async response
  }
  
  // Invalidate cache when profile is saved
  if (request.action === 'profileSaved') {
    cache.delete('userProfile');
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (default behavior)
});

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);
