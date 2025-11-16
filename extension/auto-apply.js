// Automatic Quick Apply - Scans and fills forms automatically

class AutoApply {
  constructor() {
    this.profile = null;
    this.isRunning = false;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.filledFields = [];
    this.progressCallback = null;
  }

  // Initialize with user profile
  async init() {
    const result = await chrome.storage.local.get(['userProfile']);
    this.profile = result.userProfile;
    return !!this.profile;
  }

  // Main auto-apply function
  async execute(options = {}) {
    if (this.isRunning) {
      return { success: false, message: 'Auto-apply already running' };
    }

    if (!this.profile) {
      await this.init();
      if (!this.profile) {
        return { success: false, message: 'No profile found. Please set up your profile first.' };
      }
    }

    this.isRunning = true;
    this.currentStep = 0;
    this.filledFields = [];
    
    const autoSubmit = options.autoSubmit !== false; // Default true
    const reviewBeforeSubmit = options.reviewBeforeSubmit === true; // Default false

    try {
      // Step 1: Scan the page
      this.updateProgress('Scanning page...', 1, 5);
      await this.wait(500);
      
      const formData = this.scanPage();
      
      // Step 2: Fill detected fields
      this.updateProgress('Filling form fields...', 2, 5);
      await this.fillAllFields(formData);
      await this.wait(1000);
      
      // Step 3: Handle file uploads
      this.updateProgress('Checking file uploads...', 3, 5);
      await this.handleFileUploads(formData);
      await this.wait(500);
      
      // Step 4: Handle multi-step forms
      this.updateProgress('Checking for next steps...', 4, 5);
      const hasNextStep = await this.handleMultiStepForm();
      
      if (hasNextStep) {
        // Recursively handle next step
        await this.wait(2000);
        return await this.execute(options);
      }
      
      // Step 5: Submit or review
      if (autoSubmit && !reviewBeforeSubmit) {
        this.updateProgress('Submitting application...', 5, 5);
        await this.submitForm();
        
        return {
          success: true,
          message: `Application submitted! Filled ${this.filledFields.length} fields.`,
          filledCount: this.filledFields.length
        };
      } else {
        this.updateProgress('Ready for review', 5, 5);
        this.highlightFilledFields();
        
        return {
          success: true,
          message: `Form filled! ${this.filledFields.length} fields completed. Please review and submit.`,
          filledCount: this.filledFields.length,
          requiresReview: true
        };
      }
      
    } catch (error) {
      console.error('Auto-apply error:', error);
      return {
        success: false,
        message: `Error: ${error.message}`,
        error: error
      };
    } finally {
      this.isRunning = false;
    }
  }

  // Scan page for all form elements and structure
  scanPage() {
    const formData = {
      inputs: [],
      textareas: [],
      selects: [],
      fileInputs: [],
      checkboxes: [],
      radioGroups: {},
      buttons: {
        submit: [],
        next: [],
        continue: []
      }
    };

    // Get all form elements
    const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    const allTextareas = document.querySelectorAll('textarea');
    const allSelects = document.querySelectorAll('select');
    const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');

    // Categorize inputs
    allInputs.forEach(input => {
      if (!this.isVisible(input)) return;

      const fieldInfo = this.analyzeField(input);
      
      if (input.type === 'file') {
        formData.fileInputs.push({ element: input, ...fieldInfo });
      } else if (input.type === 'checkbox') {
        formData.checkboxes.push({ element: input, ...fieldInfo });
      } else if (input.type === 'radio') {
        const name = input.name || 'unnamed';
        if (!formData.radioGroups[name]) {
          formData.radioGroups[name] = [];
        }
        formData.radioGroups[name].push({ element: input, ...fieldInfo });
      } else {
        formData.inputs.push({ element: input, ...fieldInfo });
      }
    });

    // Categorize textareas
    allTextareas.forEach(textarea => {
      if (!this.isVisible(textarea)) return;
      const fieldInfo = this.analyzeField(textarea);
      formData.textareas.push({ element: textarea, ...fieldInfo });
    });

    // Categorize selects
    allSelects.forEach(select => {
      if (!this.isVisible(select)) return;
      const fieldInfo = this.analyzeField(select);
      formData.selects.push({ element: select, ...fieldInfo });
    });

    // Categorize buttons
    allButtons.forEach(button => {
      if (!this.isVisible(button)) return;
      
      const text = (button.textContent || button.value || '').toLowerCase();
      const type = button.type?.toLowerCase();
      
      if (type === 'submit' || text.includes('submit') || text.includes('apply')) {
        formData.buttons.submit.push(button);
      } else if (text.includes('next') || text.includes('continue') || text.includes('proceed')) {
        formData.buttons.next.push(button);
      }
    });

    return formData;
  }

  // Analyze a field to determine its purpose
  analyzeField(element) {
    const id = element.id?.toLowerCase() || '';
    const name = element.name?.toLowerCase() || '';
    const placeholder = element.placeholder?.toLowerCase() || '';
    const label = this.findLabel(element)?.toLowerCase() || '';
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const type = element.type?.toLowerCase() || '';
    
    const combined = `${id} ${name} ${placeholder} ${label} ${ariaLabel}`;
    
    return {
      id,
      name,
      placeholder,
      label,
      ariaLabel,
      type,
      combined,
      fieldType: this.detectFieldType(combined, type),
      isRequired: element.required || element.getAttribute('aria-required') === 'true'
    };
  }

  // Detect what type of data a field expects
  detectFieldType(combined, inputType) {
    // Personal Info
    if (combined.match(/first.*name|fname|given.*name/i) && !combined.includes('last')) {
      return 'firstName';
    }
    if (combined.match(/last.*name|lname|surname|family.*name/i)) {
      return 'lastName';
    }
    if (combined.match(/^name$|full.*name|your.*name|applicant.*name/i) && !combined.includes('first') && !combined.includes('last')) {
      return 'fullName';
    }
    if (combined.match(/email|e-mail/i) || inputType === 'email') {
      return 'email';
    }
    if (combined.match(/phone|mobile|telephone|contact.*number/i) || inputType === 'tel') {
      return 'phone';
    }
    
    // Location
    if (combined.match(/street|address.*line.*1|address1|addr1/i) && !combined.match(/city|state|zip|country/i)) {
      return 'streetAddress';
    }
    if (combined.match(/^address$/i) && !combined.match(/email|city|state|zip|country/i)) {
      return 'address';
    }
    if (combined.match(/city|town/i) && !combined.includes('country')) {
      return 'city';
    }
    if (combined.match(/state|province|region/i)) {
      return 'state';
    }
    if (combined.match(/zip|postal.*code|postcode/i)) {
      return 'zipCode';
    }
    if (combined.match(/country/i)) {
      return 'country';
    }
    
    // Social/Links
    if (combined.match(/linkedin|linked.*in/i)) {
      return 'linkedIn';
    }
    if (combined.match(/portfolio|website|personal.*site/i)) {
      return 'portfolio';
    }
    if (combined.match(/github|git.*hub/i)) {
      return 'github';
    }
    
    // Work Experience
    if (combined.match(/current.*company|employer|organization/i)) {
      return 'currentCompany';
    }
    if (combined.match(/current.*title|job.*title|position/i)) {
      return 'currentTitle';
    }
    if (combined.match(/years.*experience|experience.*years/i)) {
      return 'yearsOfExperience';
    }
    
    // Education
    if (combined.match(/degree|education.*level/i)) {
      return 'degree';
    }
    if (combined.match(/major|field.*study|specialization/i)) {
      return 'major';
    }
    if (combined.match(/university|college|school/i)) {
      return 'university';
    }
    if (combined.match(/graduation.*year|year.*graduation/i)) {
      return 'graduationYear';
    }
    
    // Application Questions
    if (combined.match(/speak.*english|english.*proficiency/i)) {
      return 'speaksEnglish';
    }
    if (combined.match(/start.*immediately|immediate.*start|notice.*period/i)) {
      return 'canStartImmediately';
    }
    if (combined.match(/night.*shift|shift.*preference/i)) {
      return 'nightShiftAvailable';
    }
    if (combined.match(/salary.*expectation|expected.*salary|compensation/i)) {
      return 'salaryExpectations';
    }
    if (combined.match(/interview.*availability|available.*interview/i)) {
      return 'interviewAvailability';
    }
    if (combined.match(/commute|relocate|relocation/i)) {
      return 'commute';
    }
    if (combined.match(/work.*authorization|authorized.*work|visa|sponsorship/i)) {
      return 'workAuthorization';
    }
    if (combined.match(/willing.*relocate/i)) {
      return 'willingToRelocate';
    }
    if (combined.match(/require.*sponsorship|need.*sponsorship/i)) {
      return 'requiresSponsorship';
    }
    
    // Cover Letter / Why
    if (combined.match(/cover.*letter|motivation|why.*you|why.*apply|why.*interested/i)) {
      return 'coverLetter';
    }
    
    // Resume
    if (combined.match(/resume|cv|curriculum/i)) {
      return 'resume';
    }
    
    return 'unknown';
  }

  // Fill all detected fields with profile data
  async fillAllFields(formData) {
    // Fill text inputs
    for (const field of formData.inputs) {
      const value = this.getValueForField(field.fieldType);
      if (value) {
        await this.fillField(field.element, value);
        this.filledFields.push(field.fieldType);
        await this.wait(100); // Small delay between fields
      }
    }

    // Fill textareas
    for (const field of formData.textareas) {
      const value = this.getValueForField(field.fieldType);
      if (value) {
        await this.fillField(field.element, value);
        this.filledFields.push(field.fieldType);
        await this.wait(100);
      }
    }

    // Fill selects
    for (const field of formData.selects) {
      const value = this.getValueForField(field.fieldType);
      if (value) {
        await this.fillSelect(field.element, value);
        this.filledFields.push(field.fieldType);
        await this.wait(100);
      }
    }

    // Fill checkboxes
    for (const field of formData.checkboxes) {
      const value = this.getValueForField(field.fieldType);
      if (typeof value === 'boolean') {
        await this.fillCheckbox(field.element, value);
        this.filledFields.push(field.fieldType);
        await this.wait(100);
      }
    }
  }

  // Get value from profile for a specific field type
  getValueForField(fieldType) {
    if (!this.profile) return null;

    const mapping = {
      // Personal Info
      firstName: this.profile.personalInfo?.firstName,
      lastName: this.profile.personalInfo?.lastName,
      fullName: this.profile.personalInfo?.fullName || 
                `${this.profile.personalInfo?.firstName} ${this.profile.personalInfo?.lastName}`.trim(),
      email: this.profile.personalInfo?.email,
      phone: this.profile.personalInfo?.phone,
      
      // Location
      streetAddress: this.profile.personalInfo?.location?.streetAddress,
      address: this.profile.personalInfo?.location?.streetAddress,
      city: this.profile.personalInfo?.location?.city,
      state: this.profile.personalInfo?.location?.state,
      zipCode: this.profile.personalInfo?.location?.zipCode,
      country: this.profile.personalInfo?.location?.country,
      
      // Social
      linkedIn: this.profile.personalInfo?.linkedIn,
      portfolio: this.profile.personalInfo?.portfolio,
      github: this.profile.personalInfo?.github,
      
      // Work Experience
      currentCompany: this.profile.workExperience?.currentCompany,
      currentTitle: this.profile.workExperience?.currentTitle,
      yearsOfExperience: this.profile.workExperience?.yearsOfExperience || 
                         this.profile.applicationQuestions?.yearsOfExperience,
      
      // Education
      degree: this.profile.education?.degree,
      major: this.profile.education?.major,
      university: this.profile.education?.university,
      graduationYear: this.profile.education?.graduationYear,
      
      // Preferences
      workAuthorization: this.profile.preferences?.workAuthorization,
      willingToRelocate: this.profile.preferences?.willingToRelocate,
      requiresSponsorship: this.profile.preferences?.requiresSponsorship,
      
      // Application Questions
      speaksEnglish: this.profile.applicationQuestions?.speaksEnglish,
      canStartImmediately: this.profile.applicationQuestions?.canStartImmediately,
      nightShiftAvailable: this.profile.applicationQuestions?.nightShiftAvailable,
      salaryExpectations: this.profile.applicationQuestions?.salaryExpectations,
      interviewAvailability: this.profile.applicationQuestions?.interviewAvailability,
      commute: this.profile.applicationQuestions?.commute,
      
      // Cover Letter
      coverLetter: this.profile.additionalInfo?.coverLetterTemplate
    };

    return mapping[fieldType] || null;
  }

  // Fill a text input or textarea
  async fillField(element, value) {
    if (!element || !value) return;

    // Focus the element
    element.focus();
    await this.wait(50);

    // Clear existing value
    element.value = '';

    // Set new value
    element.value = value;

    // Trigger all necessary events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    // Visual feedback
    element.style.backgroundColor = '#d1fae5';
    element.style.transition = 'background-color 0.3s';
    
    setTimeout(() => {
      element.style.backgroundColor = '';
    }, 2000);
  }

  // Fill a select dropdown
  async fillSelect(element, value) {
    if (!element || !value) return;

    const options = Array.from(element.options);
    const valueStr = String(value).toLowerCase();

    // Try exact match first
    let matchedOption = options.find(opt => 
      opt.value.toLowerCase() === valueStr || 
      opt.text.toLowerCase() === valueStr
    );

    // Try partial match
    if (!matchedOption) {
      matchedOption = options.find(opt => 
        opt.value.toLowerCase().includes(valueStr) || 
        opt.text.toLowerCase().includes(valueStr) ||
        valueStr.includes(opt.value.toLowerCase()) ||
        valueStr.includes(opt.text.toLowerCase())
      );
    }

    if (matchedOption) {
      element.value = matchedOption.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      
      element.style.backgroundColor = '#d1fae5';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  }

  // Fill a checkbox
  async fillCheckbox(element, value) {
    if (!element) return;

    if (element.checked !== value) {
      element.checked = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('click', { bubbles: true }));
    }
  }

  // Handle file uploads (resume, etc.)
  async handleFileUploads(formData) {
    // Note: File uploads cannot be automated due to browser security
    // We can only detect them and notify the user
    if (formData.fileInputs.length > 0) {
      console.log('File uploads detected:', formData.fileInputs.length);
      // Could show a notification to user
    }
  }

  // Handle multi-step forms (Next/Continue buttons)
  async handleMultiStepForm() {
    const formData = this.scanPage();
    
    if (formData.buttons.next.length > 0) {
      // Click the first "Next" or "Continue" button
      const nextButton = formData.buttons.next[0];
      
      // Scroll button into view
      nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(500);
      
      // Click the button
      nextButton.click();
      
      return true; // Indicates there's a next step
    }
    
    return false;
  }

  // Submit the form
  async submitForm() {
    const formData = this.scanPage();
    
    if (formData.buttons.submit.length > 0) {
      const submitButton = formData.buttons.submit[0];
      
      // Scroll into view
      submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(500);
      
      // Click submit
      submitButton.click();
      
      return true;
    }
    
    // Try to find and submit a form element
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
      forms[0].submit();
      return true;
    }
    
    return false;
  }

  // Find label for an input element
  findLabel(element) {
    // Try label with 'for' attribute
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Try parent label
    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();

    // Try previous sibling
    let prev = element.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'LABEL') {
        return prev.textContent.trim();
      }
      prev = prev.previousElementSibling;
    }

    // Try aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent.trim();
    }

    return '';
  }

  // Check if element is visible
  isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }
    
    return true;
  }

  // Highlight all filled fields
  highlightFilledFields() {
    const inputs = document.querySelectorAll('input[value]:not([value=""]), textarea:not(:empty), select');
    inputs.forEach(input => {
      if (input.value && input.value.trim() !== '') {
        input.style.borderColor = '#10b981';
        input.style.borderWidth = '2px';
        input.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
      }
    });
  }

  // Update progress (can be used with a callback)
  updateProgress(message, current, total) {
    this.currentStep = current;
    this.totalSteps = total;
    
    console.log(`[Auto-Apply] ${message} (${current}/${total})`);
    
    if (this.progressCallback) {
      this.progressCallback({ message, current, total });
    }
  }

  // Set progress callback
  onProgress(callback) {
    this.progressCallback = callback;
  }

  // Utility: Wait/delay
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Stop the auto-apply process
  stop() {
    this.isRunning = false;
  }
}

// Export for use in other scripts
window.AutoApply = AutoApply;
