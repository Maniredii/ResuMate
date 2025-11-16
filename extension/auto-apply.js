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
    // Allow re-execution for multi-page forms
    const isMultiPageContinuation = options.isMultiPageContinuation || false;
    
    if (this.isRunning && !isMultiPageContinuation) {
      return { success: false, message: 'Auto-apply already running' };
    }

    if (!this.profile) {
      await this.init();
      if (!this.profile) {
        return { success: false, message: 'No profile found. Please set up your profile first.' };
      }
    }

    this.isRunning = true;
    
    // Don't reset fields count on multi-page continuation
    if (!isMultiPageContinuation) {
      this.currentStep = 0;
      this.filledFields = [];
    }
    
    const autoSubmit = options.autoSubmit !== false; // Default true
    const reviewBeforeSubmit = options.reviewBeforeSubmit === true; // Default false

    try {
      // Step 1: Scan the page
      this.updateProgress('Scanning page...', 1, 6);
      await this.wait(500);
      
      const formData = this.scanPage();
      
      // Step 2: Fill detected fields
      this.updateProgress('Filling form fields...', 2, 6);
      await this.fillAllFields(formData);
      await this.wait(1000);
      
      // Step 3: Handle file uploads and resume selection
      this.updateProgress('Checking resume selection...', 3, 6);
      const resumeHandled = await this.handleFileUploads(formData);
      if (resumeHandled) {
        // Wait for resume selection to process
        await this.wait(1500);
      }
      await this.wait(500);
      
      // Step 4: Handle multi-step forms
      this.updateProgress('Checking for next steps...', 4, 6);
      const hasNextStep = await this.handleMultiStepForm();
      
      if (hasNextStep) {
        // Wait for page to load completely
        this.updateProgress('Loading next page...', 5, 6);
        await this.wait(3000);
        
        // Reset running flag before continuing to next page
        this.isRunning = false;
        
        // Recursively handle next step with continuation flag
        return await this.execute({ 
          ...options, 
          isMultiPageContinuation: true 
        });
      }
      
      // Step 6: Submit or review
      if (autoSubmit && !reviewBeforeSubmit) {
        this.updateProgress('Submitting application...', 6, 6);
        await this.submitForm();
        
        return {
          success: true,
          message: `Application submitted! Filled ${this.filledFields.length} fields.`,
          filledCount: this.filledFields.length
        };
      } else {
        this.updateProgress('Ready for review', 6, 6);
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
    // Skip date/time/number fields that we can't auto-fill
    if (inputType === 'date' || inputType === 'datetime-local' || inputType === 'month' || inputType === 'week' || inputType === 'time') {
      return 'unknown'; // Don't try to fill these
    }
    
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
    
    // Location - Be more specific to avoid conflicts with date fields
    if (combined.match(/street|address.*line.*1|address1|addr1/i) && !combined.match(/city|state|zip|country|date|birth/i)) {
      return 'streetAddress';
    }
    if (combined.match(/^address$/i) && !combined.match(/email|city|state|zip|country|date|birth/i)) {
      return 'address';
    }
    if (combined.match(/\bcity\b|\btown\b/i) && !combined.match(/country|date|birth/i)) {
      return 'city';
    }
    if (combined.match(/\bstate\b|province|region/i) && !combined.match(/date|birth|country/i)) {
      return 'state';
    }
    if (combined.match(/zip|postal.*code|postcode/i) && !combined.match(/date|birth/i)) {
      return 'zipCode';
    }
    if (combined.match(/\bcountry\b/i) && !combined.match(/date|birth/i)) {
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
    if (combined.match(/highest.*level.*education|education.*level|level.*education.*completed/i)) {
      return 'highestEducationLevel';
    }
    if (combined.match(/degree/i) && !combined.match(/level|highest/i)) {
      return 'degree';
    }
    if (combined.match(/major|field.*study|specialization/i)) {
      return 'major';
    }
    if (combined.match(/university|college|school/i) && !combined.match(/high.*school/i)) {
      return 'university';
    }
    if (combined.match(/graduation.*year|year.*graduation/i)) {
      return 'graduationYear';
    }
    
    // Application Questions
    if (combined.match(/speak.*english|english.*proficiency/i)) {
      return 'speaksEnglish';
    }
    if (combined.match(/notice.*period|availability.*start/i) && !combined.match(/interview/i)) {
      return 'noticePeriod';
    }
    if (combined.match(/start.*immediately|immediate.*start|when.*can.*start/i)) {
      return 'canStartImmediately';
    }
    if (combined.match(/current.*salary|present.*salary|existing.*salary/i)) {
      return 'currentSalary';
    }
    if (combined.match(/expected.*salary|desired.*salary|salary.*expectation/i)) {
      return 'expectedSalary';
    }
    if (combined.match(/salary.*expectation|compensation.*expectation/i)) {
      return 'salaryExpectations';
    }
    if (combined.match(/night.*shift|shift.*preference|shift.*availability/i)) {
      return 'nightShiftAvailable';
    }
    if (combined.match(/willing.*travel|travel.*required|can.*travel/i)) {
      return 'willingToTravel';
    }
    if (combined.match(/driver.*license|driving.*license|valid.*license/i)) {
      return 'hasDriversLicense';
    }
    if (combined.match(/criminal.*record|background.*check|conviction/i)) {
      return 'hasCriminalRecord';
    }
    if (combined.match(/work.*permit|employment.*authorization/i)) {
      return 'hasWorkPermit';
    }
    if (combined.match(/interview.*availability|available.*interview/i)) {
      return 'interviewAvailability';
    }
    if (combined.match(/commute|relocate|relocation/i) && !combined.match(/willing/i)) {
      return 'commute';
    }
    if (combined.match(/hear.*about|find.*us|referral|source/i)) {
      return 'referralSource';
    }
    if (combined.match(/why.*company|why.*us|why.*join|interest.*company/i)) {
      return 'whyThisCompany';
    }
    if (combined.match(/why.*role|why.*position|why.*job|interest.*role/i)) {
      return 'whyThisRole';
    }
    if (combined.match(/greatest.*strength|your.*strength|strong.*point/i)) {
      return 'greatestStrength';
    }
    if (combined.match(/greatest.*weakness|your.*weakness|weak.*point|area.*improvement/i)) {
      return 'greatestWeakness';
    }
    if (combined.match(/long.*term.*goal|career.*goal|future.*plan|where.*see.*yourself/i)) {
      return 'longTermGoals';
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

    // Fill textareas (with AI generation for custom questions)
    for (const field of formData.textareas) {
      let value = this.getValueForField(field.fieldType);
      
      // If no value in profile, try AI generation for ANY question
      if (!value && field.label && field.label.length > 3) {
        console.log('[Auto-Apply] No profile answer found. Generating AI answer for:', field.label);
        value = await this.generateAIAnswer(field);
      }
      
      if (value) {
        await this.fillField(field.element, value);
        this.filledFields.push(field.fieldType);
        await this.wait(100);
      }
    }

    // Also check text inputs for questions (longer placeholders/labels)
    for (const field of formData.inputs) {
      if (field.fieldType === 'unknown' && (field.label?.length > 10 || field.placeholder?.length > 10)) {
        let value = this.getValueForField(field.fieldType);
        
        if (!value) {
          console.log('[Auto-Apply] Generating AI answer for input field:', field.label || field.placeholder);
          value = await this.generateAIAnswer(field);
          
          if (value) {
            await this.fillField(field.element, value);
            this.filledFields.push('ai-generated');
            await this.wait(100);
          }
        }
      }
    }

    // Fill selects
    console.log(`[Auto-Apply] Found ${formData.selects.length} dropdown fields`);
    for (const field of formData.selects) {
      const value = this.getValueForField(field.fieldType);
      console.log(`[Auto-Apply] Dropdown field type: ${field.fieldType}, value: ${value}`);
      if (value) {
        const success = await this.fillSelect(field.element, value);
        if (success) {
          this.filledFields.push(field.fieldType);
        }
        await this.wait(100);
      } else {
        console.log(`[Auto-Apply] No value found for dropdown: ${field.fieldType} (${field.label})`);
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
      highestEducationLevel: this.profile.education?.highestEducationLevel,
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
      noticePeriod: this.profile.applicationQuestions?.noticePeriod,
      canStartImmediately: this.profile.applicationQuestions?.canStartImmediately,
      currentSalary: this.profile.applicationQuestions?.currentSalary,
      expectedSalary: this.profile.applicationQuestions?.expectedSalary,
      salaryExpectations: this.profile.applicationQuestions?.salaryExpectations,
      nightShiftAvailable: this.profile.applicationQuestions?.nightShiftAvailable,
      willingToTravel: this.profile.applicationQuestions?.willingToTravel,
      hasDriversLicense: this.profile.applicationQuestions?.hasDriversLicense,
      hasCriminalRecord: this.profile.applicationQuestions?.hasCriminalRecord,
      hasWorkPermit: this.profile.applicationQuestions?.hasWorkPermit,
      interviewAvailability: this.profile.applicationQuestions?.interviewAvailability,
      commute: this.profile.applicationQuestions?.commute,
      referralSource: this.profile.applicationQuestions?.referralSource,
      whyThisCompany: this.profile.applicationQuestions?.whyThisCompany,
      whyThisRole: this.profile.applicationQuestions?.whyThisRole,
      greatestStrength: this.profile.applicationQuestions?.greatestStrength,
      greatestWeakness: this.profile.applicationQuestions?.greatestWeakness,
      longTermGoals: this.profile.applicationQuestions?.longTermGoals,
      
      // Cover Letter
      coverLetter: this.profile.additionalInfo?.coverLetterTemplate
    };

    return mapping[fieldType] || null;
  }

  // Fill a text input or textarea
  async fillField(element, value) {
    if (!element || !value) return;

    // Skip if field type doesn't match value type
    const inputType = element.type?.toLowerCase();
    
    // Don't fill date fields with text
    if (inputType === 'date' || inputType === 'datetime-local' || inputType === 'month' || inputType === 'week') {
      console.log('[Auto-Apply] Skipping date field:', element.name || element.id);
      return;
    }
    
    // Don't fill number fields with text that isn't a number
    if (inputType === 'number' && isNaN(value)) {
      console.log('[Auto-Apply] Skipping number field with non-numeric value:', element.name || element.id);
      return;
    }

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
    if (!element || !value) return false;

    const options = Array.from(element.options);
    const valueStr = String(value).toLowerCase().trim();
    
    console.log(`[Auto-Apply] Trying to match dropdown value: "${value}"`);
    console.log(`[Auto-Apply] Available options:`, options.map(o => `"${o.text}" (value: "${o.value}")`));

    let matchedOption = null;
    let matchMethod = '';

    // Method 1: Exact match (value or text)
    matchedOption = options.find(opt => 
      opt.value.toLowerCase().trim() === valueStr || 
      opt.text.toLowerCase().trim() === valueStr
    );
    if (matchedOption) matchMethod = 'exact match';

    // Method 2: Exact match without special characters and spaces
    if (!matchedOption) {
      const cleanValue = valueStr.replace(/[^a-z0-9]/g, '');
      matchedOption = options.find(opt => {
        const cleanOptValue = opt.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanOptText = opt.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanOptValue === cleanValue || cleanOptText === cleanValue;
      });
      if (matchedOption) matchMethod = 'clean match';
    }

    // Method 3: Starts with match
    if (!matchedOption) {
      matchedOption = options.find(opt => 
        opt.value.toLowerCase().startsWith(valueStr) || 
        opt.text.toLowerCase().startsWith(valueStr) ||
        valueStr.startsWith(opt.value.toLowerCase()) ||
        valueStr.startsWith(opt.text.toLowerCase())
      );
      if (matchedOption) matchMethod = 'starts with';
    }

    // Method 4: Partial match (contains)
    if (!matchedOption) {
      matchedOption = options.find(opt => 
        opt.value.toLowerCase().includes(valueStr) || 
        opt.text.toLowerCase().includes(valueStr)
      );
      if (matchedOption) matchMethod = 'contains';
    }

    // Method 5: Reverse partial match (value contains option)
    if (!matchedOption) {
      matchedOption = options.find(opt => {
        const optVal = opt.value.toLowerCase().trim();
        const optTxt = opt.text.toLowerCase().trim();
        return (optVal.length > 2 && valueStr.includes(optVal)) ||
               (optTxt.length > 2 && valueStr.includes(optTxt));
      });
      if (matchedOption) matchMethod = 'reverse contains';
    }

    // Method 6: Word matching (for "Bachelor's Degree" matching "Bachelor")
    if (!matchedOption) {
      const valueWords = valueStr.split(/\s+/).filter(w => w.length > 2);
      matchedOption = options.find(opt => {
        const optText = opt.text.toLowerCase();
        const optValue = opt.value.toLowerCase();
        const optWords = [...optText.split(/\s+/), ...optValue.split(/\s+/)].filter(w => w.length > 2);
        
        return valueWords.some(vWord => 
          optWords.some(oWord => 
            vWord.includes(oWord) || oWord.includes(vWord)
          )
        );
      });
      if (matchedOption) matchMethod = 'word match';
    }

    // Method 7: Fuzzy match (first letters)
    if (!matchedOption) {
      const valueInitials = valueStr.split(/\s+/).map(w => w[0]).join('');
      matchedOption = options.find(opt => {
        const optInitials = opt.text.toLowerCase().split(/\s+/).map(w => w[0]).join('');
        return valueInitials === optInitials;
      });
      if (matchedOption) matchMethod = 'initials match';
    }

    // Method 8: Number matching (for "5 years" matching "5")
    if (!matchedOption) {
      const valueNumbers = valueStr.match(/\d+/g);
      if (valueNumbers) {
        matchedOption = options.find(opt => {
          const optNumbers = (opt.text + opt.value).match(/\d+/g);
          return optNumbers && valueNumbers.some(vn => optNumbers.includes(vn));
        });
        if (matchedOption) matchMethod = 'number match';
      }
    }

    if (matchedOption) {
      console.log(`[Auto-Apply] ✅ Matched option: "${matchedOption.text}" using ${matchMethod}`);
      
      // Scroll dropdown into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(100);
      
      // Focus and select
      element.focus();
      await this.wait(50);
      
      // Set value
      element.value = matchedOption.value;
      
      // Trigger all necessary events for different frameworks
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      
      // Trigger React/Vue specific events
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      nativeInputValueSetter.call(element, matchedOption.value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Visual feedback
      element.style.backgroundColor = '#d1fae5';
      element.style.transition = 'background-color 0.3s';
      element.style.borderColor = '#10b981';
      element.style.borderWidth = '2px';
      
      setTimeout(() => {
        element.style.backgroundColor = '';
        element.style.borderColor = '';
        element.style.borderWidth = '';
      }, 2000);
      
      return true;
    } else {
      console.log(`[Auto-Apply] ❌ No match found for dropdown value: "${value}"`);
      return false;
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

  // Handle file uploads and resume selection (Indeed specific)
  async handleFileUploads(formData) {
    // Check for Indeed resume selection (already uploaded resumes)
    const resumeButtons = document.querySelectorAll('[data-testid*="resume"], [class*="resume-card"], button[aria-label*="resume"], div[role="button"][class*="resume"]');
    
    if (resumeButtons.length > 0) {
      console.log('[Auto-Apply] Found resume selection buttons:', resumeButtons.length);
      
      // Click the first resume (most recent)
      const firstResume = resumeButtons[0];
      if (this.isVisible(firstResume)) {
        console.log('[Auto-Apply] Clicking resume selection');
        firstResume.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(500);
        firstResume.click();
        await this.wait(1000);
        return true;
      }
    }
    
    // Check for file input fields
    if (formData.fileInputs.length > 0) {
      console.log('[Auto-Apply] File uploads detected:', formData.fileInputs.length);
      // Cannot automate file uploads due to browser security
    }
    
    return false;
  }

  // Handle multi-step forms (Next/Continue buttons)
  async handleMultiStepForm() {
    // Wait for any animations or page updates
    await this.wait(1000);
    
    // Re-scan the page for buttons
    const formData = this.scanPage();
    
    // Look for Continue/Next buttons (Indeed specific and general)
    const continueSelectors = [
      'button[data-testid*="continue"]',
      'button[aria-label*="continue"]',
      'button[type="submit"]',
      'button:contains("Continue")',
      'button:contains("Next")',
      'button.ia-continueButton',
      'button[class*="continue"]',
      'button[class*="next"]'
    ];
    
    // Try each selector
    for (const selector of continueSelectors) {
      try {
        const buttons = document.querySelectorAll(selector);
        for (const button of buttons) {
          if (this.isVisible(button)) {
            const text = (button.textContent || button.value || '').toLowerCase();
            if (text.includes('continue') || text.includes('next') || text.includes('proceed')) {
              console.log('[Auto-Apply] Found continue button:', text);
              
              // Scroll into view
              button.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await this.wait(500);
              
              // Click the button
              button.click();
              console.log('[Auto-Apply] Clicked continue button');
              
              // Wait for page transition
              await this.wait(2000);
              
              return true; // Indicates there's a next step
            }
          }
        }
      } catch (e) {
        console.log('[Auto-Apply] Selector failed:', selector, e);
      }
    }
    
    // Fallback to original method
    if (formData.buttons.next.length > 0) {
      const nextButton = formData.buttons.next[0];
      
      if (this.isVisible(nextButton)) {
        console.log('[Auto-Apply] Using fallback next button');
        nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(500);
        nextButton.click();
        await this.wait(2000);
        return true;
      }
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

  // Check if field looks like a question (not needed anymore, we generate for all empty fields)
  isQuestion(field) {
    const text = (field.label + ' ' + field.placeholder).toLowerCase();
    
    // Check if it looks like a question
    return text.includes('?') || 
           text.includes('why') || 
           text.includes('how') || 
           text.includes('what') || 
           text.includes('describe') || 
           text.includes('tell') || 
           text.includes('explain') ||
           text.length > 15; // Longer labels are likely questions
  }

  // Generate AI answer for custom questions
  async generateAIAnswer(field) {
    try {
      // Get job description from page
      const jobDescription = this.extractJobDescription();
      
      // Get token
      const result = await chrome.storage.local.get(['token']);
      const token = result.token;
      
      if (!token) {
        console.log('[Auto-Apply] No token, skipping AI generation');
        return null;
      }

      // Call AI API
      const response = await fetch('http://localhost:5000/api/ai/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: field.label || field.placeholder || 'Why are you interested?',
          jobDescription: jobDescription,
          userProfile: this.profile
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Auto-Apply] ✅ AI generated answer');
        return data.answer;
      } else {
        console.log('[Auto-Apply] AI generation failed:', response.status);
        return null;
      }
    } catch (error) {
      console.error('[Auto-Apply] AI generation error:', error);
      return null;
    }
  }

  // Extract job description from the page
  extractJobDescription() {
    // Try common selectors for job descriptions
    const selectors = [
      '[class*="jobdescription"]',
      '[class*="job-description"]',
      '[class*="description"]',
      '[id*="jobdescription"]',
      '[id*="job-description"]',
      'article',
      '[role="article"]',
      '.job-details',
      '.posting-description'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.length > 100) {
        return element.textContent.substring(0, 2000); // Limit to 2000 chars
      }
    }

    // Fallback: get all visible text
    const bodyText = document.body.innerText;
    return bodyText.substring(0, 2000);
  }
}

// Export for use in other scripts
window.AutoApply = AutoApply;
