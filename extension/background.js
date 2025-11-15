// Background service worker

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'quickApply') {
    // Open popup or handle quick apply
    chrome.action.openPopup();
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (default behavior)
});
