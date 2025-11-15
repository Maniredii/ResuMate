import React, { useState, useEffect } from 'react'
import { userAPI } from '../services/api'

const Settings = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    skills: '',
    ai_provider: 'openai'
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await userAPI.getUser()
      const userData = response.data.user

      setUser(userData)

      // Populate form with existing data
      setFormData({
        name: userData.name || '',
        phone: userData.profile_data?.phone || '',
        location: userData.profile_data?.location || '',
        skills: Array.isArray(userData.profile_data?.skills) 
          ? userData.profile_data.skills.join(', ') 
          : '',
        ai_provider: userData.profile_data?.ai_provider || 'openai'
      })
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      setError('Failed to load profile data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear messages when user starts typing
    setSuccessMessage(null)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Convert skills string to array
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)

      const updateData = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        skills: skillsArray,
        ai_provider: formData.ai_provider
      }

      const response = await userAPI.updateProfile(updateData)
      
      setUser(response.data.user)
      setSuccessMessage('Profile updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)

    } catch (err) {
      console.error('Failed to update profile:', err)
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreResume = async () => {
    if (!window.confirm('Are you sure you want to restore your original resume? This will replace the current tailored version.')) {
      return
    }

    try {
      setRestoring(true)
      setError(null)
      setSuccessMessage(null)

      const response = await userAPI.restoreOriginalResume()
      setSuccessMessage(response.data.message)

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)

    } catch (err) {
      console.error('Failed to restore resume:', err)
      setError(err.response?.data?.message || 'Failed to restore original resume.')
    } finally {
      setRestoring(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
          
          <div className="mb-4 pb-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div className="mb-4 pb-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume Status</label>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {user?.resume_path ? (
                  <>
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600 font-medium">Resume uploaded</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-600">No resume uploaded</span>
                  </>
                )}
              </div>
              {user?.resume_path && (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('http://localhost:5000/api/upload/view-resume', {
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          }
                        });
                        if (!response.ok) {
                          throw new Error('Failed to fetch resume');
                        }
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        // Clean up after a delay
                        setTimeout(() => window.URL.revokeObjectURL(url), 100);
                      } catch (error) {
                        console.error('View failed:', error);
                        alert('Failed to view resume. Please try again.');
                      }
                    }}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('http://localhost:5000/api/upload/download-resume', {
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          }
                        });
                        if (!response.ok) {
                          throw new Error('Failed to download resume');
                        }
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'resume.docx';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (error) {
                        console.error('Download failed:', error);
                        alert('Failed to download resume. Please try again.');
                      }
                    }}
                    className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
            <p className="text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Profile</h2>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone Field */}
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g., (555) 123-4567"
              />
              <p className="text-xs text-gray-500 mt-1">Used for job applications</p>
            </div>

            {/* Location Field */}
            <div className="mb-6">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="e.g., San Francisco, CA"
              />
              <p className="text-xs text-gray-500 mt-1">City and state/country</p>
            </div>

            {/* Skills Field */}
            <div className="mb-6">
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="e.g., JavaScript, React, Node.js, Python"
              />
              <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
            </div>

            {/* AI Provider Selection */}
            <div className="mb-6">
              <label htmlFor="ai_provider" className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <select
                id="ai_provider"
                name="ai_provider"
                value={formData.ai_provider}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="openai">OpenAI (GPT-4o-mini)</option>
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose which AI service to use for resume tailoring
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Restore Original Resume Section */}
        {user?.resume_path && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resume Management</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-800 font-medium">About Resume Tailoring</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    When you apply to jobs, your resume is automatically tailored and updated in place. 
                    A backup of your original resume is created the first time. You can restore it anytime.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRestoreResume}
              disabled={restoring}
              className={`w-full px-6 py-3 rounded-lg font-medium transition flex items-center justify-center ${
                restoring
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {restoring ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Restoring...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restore Original Resume
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
