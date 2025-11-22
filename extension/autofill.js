// Auto-fill job application forms with user profile data

// Cache for user profile
let profileCache = null;
let profileCacheTime = 0;
const PROFILE_CACHE_DURATION = 30000; // 30 seconds

// Load user profile from storage (with caching)
async function getUserProfile() {
  // Return cached profile if still valid
  if (profileCache && (Date.now() - profileCacheTime) < PROFILE_CACHE_DURATION) {
    return profileCache;
  }

  const result = await chrome.storage.local.get(['userProfile']);
  profileCache = result.userProfile || null;
  profileCacheTime = Date.now();
  return profileCache;
}

// Save user profile to storage (with cache invalidation)
async function saveUserProfile(profile) {
  await chrome.storage.local.set({ userProfile: profile });
  // Update cache
  profileCache = profile;
  profileCacheTime = Date.now();
  // Notify background worker
  chrome.runtime.sendMessage({ action: 'profileSaved' });
}

// Cache for detected fields to avoid re-scanning
let cachedFields = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds

// Detect form fields and their types
function detectFormFields(useCache = true) {
  // Return cached fields if still valid
  if (useCache && cachedFields && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedFields;
  }

  const fields = {
    firstName: null,
    lastName: null,
    fullName: null,
    email: null,
    phone: null,
    streetAddress: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    country: null,
    linkedIn: null,
    portfolio: null,
    github: null,
    coverLetter: null,
    resume: null,
    customFields: []
  };

  // Get all input, textarea, and select elements (more specific selector for performance)
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');

  inputs.forEach(input => {
    const id = input.id?.toLowerCase() || '';
    const name = input.name?.toLowerCase() || '';
    const placeholder = input.placeholder?.toLowerCase() || '';
    const label = findLabelForInput(input)?.toLowerCase() || '';
    const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';
    
    const combined = `${id} ${name} ${placeholder} ${label} ${ariaLabel}`;

    // First Name
    if (combined.match(/first.*name|fname|given.*name/i) && !combined.includes('last')) {
      fields.firstName = input;
    }
    // Last Name
    else if (combined.match(/last.*name|lname|surname|family.*name/i)) {
      fields.lastName = input;
    }
    // Full Name
    else if (combined.match(/^name$|full.*name|your.*name|applicant.*name/i) && !combined.includes('first') && !combined.includes('last')) {
      fields.fullName = input;
    }
    // Email
    else if (combined.match(/email|e-mail/i) || input.type === 'email') {
      fields.email = input;
    }
    // Phone
    else if (combined.match(/phone|mobile|telephone|contact.*number/i) || input.type === 'tel') {
      fields.phone = input;
    }
    // Street Address
    else if (combined.match(/street|address.*line.*1|address1|addr1/i) && !combined.match(/city|state|zip|country/i)) {
      fields.streetAddress = input;
    }
    // General Address
    else if (combined.match(/^address$/i) && !combined.match(/email|city|state|zip|country/i)) {
      fields.address = input;
    }
    // City
    else if (combined.match(/city|town/i) && !combined.includes('country')) {
      fields.city = input;
    }
    // State
    else if (combined.match(/state|province|region/i)) {
      fields.state = input;
    }
    // Zip Code
    else if (combined.match(/zip|postal.*code|postcode/i)) {
      fields.zipCode = input;
    }
    // Country
    else if (combined.match(/country/i)) {
      fields.country = input;
    }
    // LinkedIn
    else if (combined.match(/linkedin|linked.*in/i)) {
      fields.linkedIn = input;
    }
    // Portfolio
    else if (combined.match(/portfolio|website|personal.*site/i)) {
      fields.portfolio = input;
    }
    // GitHub
    else if (combined.match(/github|git.*hub/i)) {
      fields.github = input;
    }
    // Cover Letter
    else if (combined.match(/cover.*letter|motivation|why.*you|why.*apply/i) && (input.tagName === 'TEXTAREA' || input.type === 'text')) {
      fields.coverLetter = input;
    }
    // Resume Upload
    else if (input.type === 'file' && combined.match(/resume|cv|curriculum/i)) {
      fields.resume = input;
    }
    // Custom fields (questions, etc.)
    else if (input.tagName === 'TEXTAREA' || (input.type === 'text' && !input.value)) {
      fields.customFields.push({
        element: input,
        label: label || placeholder || name || id,
        type: input.tagName.toLowerCase()
      });
    }
  });

  // Cache the results
  cachedFields = fields;
  cacheTimestamp = Date.now();

  return fields;
}

// Find label for input element
function findLabelForInput(input) {
  // Try to find label by 'for' attribute
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.trim();
  }

  // Try to find parent label
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent.trim();

  // Try to find previous sibling label
  let prev = input.previousElementSibling;
  while (prev) {
    if (prev.tagName === 'LABEL') {
      return prev.textContent.trim();
    }
    prev = prev.previousElementSibling;
  }

  return '';
}

// Fill form with user profile data
async function autoFillForm() {
  const profile = await getUserProfile();
  
  if (!profile) {
    return {
      success: false,
      message: 'No user profile found. Please set up your profile first.'
    };
  }

  const fields = detectFormFields();
  let filledCount = 0;

  try {
    // Fill personal info
    if (fields.firstName && profile.personalInfo?.firstName) {
      fillInput(fields.firstName, profile.personalInfo.firstName);
      filledCount++;
    }
    if (fields.lastName && profile.personalInfo?.lastName) {
      fillInput(fields.lastName, profile.personalInfo.lastName);
      filledCount++;
    }
    if (fields.fullName && profile.personalInfo?.fullName) {
      fillInput(fields.fullName, profile.personalInfo.fullName);
      filledCount++;
    }
    if (fields.email && profile.personalInfo?.email) {
      fillInput(fields.email, profile.personalInfo.email);
      filledCount++;
    }
    if (fields.phone && profile.personalInfo?.phone) {
      fillInput(fields.phone, profile.personalInfo.phone);
      filledCount++;
    }

    // Fill location
    if (fields.streetAddress && profile.personalInfo?.location?.streetAddress) {
      fillInput(fields.streetAddress, profile.personalInfo.location.streetAddress);
      filledCount++;
    }
    if (fields.address && profile.personalInfo?.location?.streetAddress) {
      fillInput(fields.address, profile.personalInfo.location.streetAddress);
      filledCount++;
    }
    if (fields.city && profile.personalInfo?.location?.city) {
      fillInput(fields.city, profile.personalInfo.location.city);
      filledCount++;
    }
    if (fields.state && profile.personalInfo?.location?.state) {
      fillInput(fields.state, profile.personalInfo.location.state);
      filledCount++;
    }
    if (fields.zipCode && profile.personalInfo?.location?.zipCode) {
      fillInput(fields.zipCode, profile.personalInfo.location.zipCode);
      filledCount++;
    }
    if (fields.country && profile.personalInfo?.location?.country) {
      fillInput(fields.country, profile.personalInfo.location.country);
      filledCount++;
    }

    // Fill social links
    if (fields.linkedIn && profile.personalInfo?.linkedIn) {
      fillInput(fields.linkedIn, profile.personalInfo.linkedIn);
      filledCount++;
    }
    if (fields.portfolio && profile.personalInfo?.portfolio) {
      fillInput(fields.portfolio, profile.personalInfo.portfolio);
      filledCount++;
    }
    if (fields.github && profile.personalInfo?.github) {
      fillInput(fields.github, profile.personalInfo.github);
      filledCount++;
    }

    // Fill cover letter
    if (fields.coverLetter && profile.additionalInfo?.coverLetterTemplate) {
      fillInput(fields.coverLetter, profile.additionalInfo.coverLetterTemplate);
      filledCount++;
    }

    // Highlight filled fields
    highlightFilledFields();

    return {
      success: true,
      message: `Auto-filled ${filledCount} fields successfully!`,
      filledCount: filledCount
    };

  } catch (error) {
    console.error('Auto-fill error:', error);
    return {
      success: false,
      message: `Error during auto-fill: ${error.message}`
    };
  }
}

// Batch DOM updates for better performance
const pendingVisualUpdates = [];
let visualUpdateScheduled = false;

function scheduleVisualUpdate() {
  if (!visualUpdateScheduled) {
    visualUpdateScheduled = true;
    requestAnimationFrame(() => {
      pendingVisualUpdates.forEach(fn => fn());
      pendingVisualUpdates.length = 0;
      visualUpdateScheduled = false;
    });
  }
}

// Fill input with value and trigger events
function fillInput(element, value) {
  if (!element || !value) return;

  // Set the value
  element.value = value;

  // Trigger events to ensure the form recognizes the change
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));

  // Add visual feedback (batched for performance)
  pendingVisualUpdates.push(() => {
    element.style.backgroundColor = '#d1fae5';
    setTimeout(() => {
      element.style.backgroundColor = '';
    }, 2000);
  });
  scheduleVisualUpdate();
}

// Highlight all filled fields (optimized with batching)
function highlightFilledFields() {
  requestAnimationFrame(() => {
    const inputs = document.querySelectorAll('input[value]:not([value=""]), textarea:not(:empty)');
    const fragment = document.createDocumentFragment();
    
    inputs.forEach(input => {
      if (input.value && input.value.trim() !== '') {
        input.style.borderColor = '#10b981';
        input.style.borderWidth = '2px';
      }
    });
  });
}

// Show floating Quick Apply button
function showQuickApplyButton() {
  console.log('[Quick Apply] showQuickApplyButton called');
  
  // Check if button already exists
  if (document.getElementById('quick-apply-btn')) {
    console.log('[Quick Apply] Button already exists');
    return;
  }

  const button = document.createElement('button');
  button.id = 'quick-apply-btn';
  button.innerHTML = `
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
    <span>Quick Apply</span>
  `;
  
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 14px 24px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-3px)';
    button.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.7)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.5)';
  });

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.innerHTML = `
      <div style="width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span>Auto-Applying...</span>
    `;

    // Use new AutoApply if available, otherwise fall back to old method
    let result;
    if (window.AutoApply) {
      const autoApply = new window.AutoApply();
      await autoApply.init();
      
      // Set up progress updates
      autoApply.onProgress((progress) => {
        button.innerHTML = `
          <div style="width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span>${progress.message}</span>
        `;
      });
      
      // Execute auto-apply with review before submit
      result = await autoApply.execute({ 
        autoSubmit: false, // Don't auto-submit, let user review
        reviewBeforeSubmit: true 
      });
    } else {
      // Fallback to old method
      result = await autoFillForm();
    }

    if (result.success) {
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      button.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span>${result.message}</span>
      `;
    } else {
      button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      button.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        <span>${result.message}</span>
      `;
    }

    setTimeout(() => {
      button.disabled = false;
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      button.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span>Quick Apply</span>
      `;
    }, 3000);
  });

  // Add spin animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(button);
  console.log('[Quick Apply] Button added to page!');
}

// Initialize on page load (with debouncing)
console.log('[Quick Apply] Autofill script loaded!');

// Debounced button initialization to avoid multiple calls
let buttonInitialized = false;
const initButton = () => {
  if (!buttonInitialized) {
    buttonInitialized = true;
    showQuickApplyButton();
  }
};

if (document.readyState === 'loading') {
  console.log('[Quick Apply] Waiting for DOM...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Quick Apply] DOM loaded, showing button...');
    // Delay button creation slightly to let page settle
    setTimeout(initButton, 500);
  });
} else {
  console.log('[Quick Apply] DOM already loaded, showing button...');
  // Delay button creation slightly to let page settle
  setTimeout(initButton, 500);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autoFill') {
    autoFillForm().then(result => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'saveProfile') {
    saveUserProfile(request.profile).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getProfile') {
    getUserProfile().then(profile => {
      sendResponse({ profile });
    });
    return true;
  }
});

// Export functions for use in other scripts
window.autoFillForm = autoFillForm;
window.getUserProfile = getUserProfile;
window.saveUserProfile = saveUserProfile;
