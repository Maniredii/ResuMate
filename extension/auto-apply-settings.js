// Auto-Apply Settings Management

// Default settings
const DEFAULT_SETTINGS = {
  autoSubmit: false, // Don't auto-submit by default for safety
  reviewBeforeSubmit: true, // Always review before submitting
  fillDelay: 100, // Delay between filling fields (ms)
  enableMultiStep: true, // Handle multi-step forms
  enableFileUploadDetection: true, // Detect file upload fields
  highlightFilledFields: true, // Highlight fields after filling
  showProgressNotifications: true, // Show progress updates
  pauseOnError: true, // Pause if an error occurs
  skipOptionalFields: false, // Skip non-required fields
  enableSmartMatching: true // Use fuzzy matching for field detection
};

// Get auto-apply settings
async function getAutoApplySettings() {
  const result = await chrome.storage.local.get(['autoApplySettings']);
  return result.autoApplySettings || DEFAULT_SETTINGS;
}

// Save auto-apply settings
async function saveAutoApplySettings(settings) {
  await chrome.storage.local.set({ autoApplySettings: settings });
}

// Reset to default settings
async function resetAutoApplySettings() {
  await saveAutoApplySettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

// Export functions
window.autoApplySettings = {
  get: getAutoApplySettings,
  save: saveAutoApplySettings,
  reset: resetAutoApplySettings,
  defaults: DEFAULT_SETTINGS
};
