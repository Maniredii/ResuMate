// Content script that runs on job pages
// Adds a floating "Quick Apply" button

(function() {
  'use strict';
  
  // Check if we're on a supported job page
  const isJobPage = 
    window.location.href.includes('indeed.com/viewjob') ||
    window.location.href.includes('wellfound.com/jobs') ||
    window.location.href.includes('linkedin.com/jobs');
  
  if (!isJobPage) return;
  
  // Create floating button
  const button = document.createElement('div');
  button.id = 'job-auto-apply-btn';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
    <span>Quick Apply</span>
  `;
  
  button.addEventListener('click', () => {
    // Send message to background script
    chrome.runtime.sendMessage({ action: 'quickApply', url: window.location.href });
  });
  
  document.body.appendChild(button);
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getJobUrl') {
      sendResponse({ url: window.location.href });
    }
  });
})();
