// Content script that runs on job pages
// This script works alongside autofill.js

(function() {
  'use strict';
  
  console.log('[Content Script] Loaded on:', window.location.href);
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getJobUrl') {
      sendResponse({ url: window.location.href });
    }
    
    if (request.action === 'quickApply') {
      // Trigger auto-fill if available
      if (typeof window.autoFillForm === 'function') {
        window.autoFillForm().then(result => {
          sendResponse(result);
        });
        return true; // Keep channel open for async response
      } else {
        sendResponse({ success: false, message: 'Auto-fill not available' });
      }
    }
  });
  
  console.log('[Content Script] Ready');
})();
