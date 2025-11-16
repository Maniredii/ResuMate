import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profile, setProfile] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: {
        streetAddress: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      linkedIn: '',
      portfolio: '',
      github: ''
    },
    workExperience: {
      currentCompany: '',
      currentTitle: '',
      yearsOfExperience: '',
      previousCompany: '',
      previousTitle: ''
    },
    education: {
      degree: '',
      major: '',
      university: '',
      graduationYear: ''
    },
    preferences: {
      desiredSalary: '',
      willingToRelocate: false,
      requiresSponsorship: false,
      availableStartDate: '',
      workAuthorization: ''
    },
    additionalInfo: {
      coverLetterTemplate: '',
      customAnswers: {}
    },
    skills: [],
    applicationQuestions: {
      speaksEnglish: 'Yes',
      canStartImmediately: '',
      nightShiftAvailable: '',
      salaryExpectations: '',
      yearsOfExperience: '',
      specificSkillYears: {},
      interviewAvailability: '',
      commute: ''
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('[Profile] Fetching profile from backend...');
      const response = await api.get('/profile/profile');
      console.log('[Profile] Profile fetched:', response.data.profile);
      setProfile(response.data.profile);
      setLoading(false);
    } catch (error) {
      console.error('[Profile] Failed to fetch profile:', error);
      console.error('[Profile] Error details:', error.response?.data);
      setMessage({ type: 'error', text: 'Failed to load profile' });
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleLocationChange = (field, value) => {
    console.log(`[Profile] Location change: ${field} = ${value}`);
    setProfile(prev => {
      const updated = {
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          location: {
            ...prev.personalInfo.location,
            [field]: value
          }
        }
      };
      console.log('[Profile] Updated profile:', updated);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('[Profile] Saving profile...', profile);
      const response = await api.put('/profile/profile', { profile });
      console.log('[Profile] Save response:', response.data);
      
      // Update local state with the response data to ensure consistency
      if (response.data.profile) {
        console.log('[Profile] Updating local state with saved profile');
        setProfile(response.data.profile);
      }
      
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      
      // Scroll to top to show message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save profile' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Fill out your profile to enable Quick Apply auto-fill on job application pages
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={profile.personalInfo.firstName}
                  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={profile.personalInfo.lastName}
                  onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={profile.personalInfo.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={profile.personalInfo.phone}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
            
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={profile.personalInfo?.location?.streetAddress || ''}
                  onChange={(e) => handleLocationChange('streetAddress', e.target.value)}
                  placeholder="123 Main Street, Apt 4B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={profile.personalInfo.location.city}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <input
                  type="text"
                  value={profile.personalInfo.location.state}
                  onChange={(e) => handleLocationChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  value={profile.personalInfo.location.country}
                  onChange={(e) => handleLocationChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={profile.personalInfo.location.zipCode}
                  onChange={(e) => handleLocationChange('zipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Professional Links */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Links</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={profile.personalInfo.linkedIn}
                  onChange={(e) => handleInputChange('personalInfo', 'linkedIn', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portfolio/Website
                </label>
                <input
                  type="url"
                  value={profile.personalInfo.portfolio}
                  onChange={(e) => handleInputChange('personalInfo', 'portfolio', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  value={profile.personalInfo.github}
                  onChange={(e) => handleInputChange('personalInfo', 'github', e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Work Experience */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Experience</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={profile.workExperience.currentTitle}
                  onChange={(e) => handleInputChange('workExperience', 'currentTitle', e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Company
                </label>
                <input
                  type="text"
                  value={profile.workExperience.currentCompany}
                  onChange={(e) => handleInputChange('workExperience', 'currentCompany', e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="text"
                  value={profile.workExperience.yearsOfExperience}
                  onChange={(e) => handleInputChange('workExperience', 'yearsOfExperience', e.target.value)}
                  placeholder="e.g., 5 years"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree
                </label>
                <input
                  type="text"
                  value={profile.education.degree}
                  onChange={(e) => handleInputChange('education', 'degree', e.target.value)}
                  placeholder="e.g., Bachelor's"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Major/Field of Study
                </label>
                <input
                  type="text"
                  value={profile.education.major}
                  onChange={(e) => handleInputChange('education', 'major', e.target.value)}
                  placeholder="e.g., Computer Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University/College
                </label>
                <input
                  type="text"
                  value={profile.education.university}
                  onChange={(e) => handleInputChange('education', 'university', e.target.value)}
                  placeholder="e.g., State University"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="text"
                  value={profile.education.graduationYear}
                  onChange={(e) => handleInputChange('education', 'graduationYear', e.target.value)}
                  placeholder="e.g., 2020"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Authorization
                </label>
                <select
                  value={profile.preferences.workAuthorization}
                  onChange={(e) => handleInputChange('preferences', 'workAuthorization', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="US Citizen">US Citizen</option>
                  <option value="Green Card">Green Card Holder</option>
                  <option value="Work Visa">Work Visa (H1B, etc.)</option>
                  <option value="Requires Sponsorship">Requires Sponsorship</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="willingToRelocate"
                  checked={profile.preferences.willingToRelocate}
                  onChange={(e) => handleInputChange('preferences', 'willingToRelocate', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="willingToRelocate" className="text-sm text-gray-700">
                  Willing to relocate
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresSponsorship"
                  checked={profile.preferences.requiresSponsorship}
                  onChange={(e) => handleInputChange('preferences', 'requiresSponsorship', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="requiresSponsorship" className="text-sm text-gray-700">
                  Requires visa sponsorship
                </label>
              </div>
            </div>
          </div>

          {/* Cover Letter Template */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cover Letter Template</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <textarea
                value={profile.additionalInfo.coverLetterTemplate}
                onChange={(e) => handleInputChange('additionalInfo', 'coverLetterTemplate', e.target.value)}
                placeholder="Enter a template cover letter that will be used for applications..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-1">
                This template will be used to auto-fill cover letter fields in job applications
              </p>
            </div>
          </div>

          {/* Common Application Questions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Common Application Questions</h2>
            <p className="text-sm text-gray-600 mb-4">Pre-fill answers to frequently asked questions</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Do you speak English?
                </label>
                <select
                  value={profile.applicationQuestions.speaksEnglish}
                  onChange={(e) => handleInputChange('applicationQuestions', 'speaksEnglish', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Can you start immediately?
                </label>
                <textarea
                  value={profile.applicationQuestions.canStartImmediately}
                  onChange={(e) => handleInputChange('applicationQuestions', 'canStartImmediately', e.target.value)}
                  placeholder="e.g., Yes, I can start immediately / I need 2 weeks notice"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Are you available for night shift (US timezone)?
                </label>
                <textarea
                  value={profile.applicationQuestions.nightShiftAvailable}
                  onChange={(e) => handleInputChange('applicationQuestions', 'nightShiftAvailable', e.target.value)}
                  placeholder="e.g., Yes, I am available for night shifts / No, I prefer day shifts"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Does the salary align with your expectations?
                </label>
                <textarea
                  value={profile.applicationQuestions.salaryExpectations}
                  onChange={(e) => handleInputChange('applicationQuestions', 'salaryExpectations', e.target.value)}
                  placeholder="e.g., Yes, the salary meets my expectations / I am flexible with salary"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience (General)
                </label>
                <input
                  type="text"
                  value={profile.applicationQuestions.yearsOfExperience}
                  onChange={(e) => handleInputChange('applicationQuestions', 'yearsOfExperience', e.target.value)}
                  placeholder="e.g., 5 years"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Availability
                </label>
                <textarea
                  value={profile.applicationQuestions.interviewAvailability}
                  onChange={(e) => handleInputChange('applicationQuestions', 'interviewAvailability', e.target.value)}
                  placeholder="e.g., Monday-Friday 9 AM - 5 PM IST, Available on weekends"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commute/Relocation
                </label>
                <select
                  value={profile.applicationQuestions.commute}
                  onChange={(e) => handleInputChange('applicationQuestions', 'commute', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="Yes, I can make the commute">Yes, I can make the commute</option>
                  <option value="Yes, I am planning to relocate">Yes, I am planning to relocate</option>
                  <option value="Yes, but I need relocation assistance">Yes, but I need relocation assistance</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
