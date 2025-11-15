import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { userAPI } from '../services/api'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [applicationCount, setApplicationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user profile
      const userResponse = await userAPI.getUser()
      setUser(userResponse.data.user)

      // Fetch application history to get count
      const historyResponse = await userAPI.getApplicationHistory()
      setApplicationCount(historyResponse.data.length)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const hasResume = user?.resume_path !== null && user?.resume_path !== undefined

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your job applications and automate your job search
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Resume Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Resume Status</h3>
              <svg
                className={`w-8 h-8 ${hasResume ? 'text-green-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-2">
              {hasResume ? 'Uploaded' : 'Not Uploaded'}
            </p>
            <p className="text-sm text-gray-600">
              {hasResume ? 'Resume is ready for applications' : 'Upload your resume to get started'}
            </p>
          </div>

          {/* Applications Count Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total Applications</h3>
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-2">
              {applicationCount}
            </p>
            <p className="text-sm text-gray-600">
              {applicationCount === 0 ? 'No applications yet' : 'Jobs applied to'}
            </p>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Account Status</h3>
              <svg
                className="w-8 h-8 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-2">
              Active
            </p>
            <p className="text-sm text-gray-600">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Resume Button */}
            <Link
              to="/upload-resume"
              className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group"
            >
              <div className="bg-blue-100 rounded-full p-3 mr-4 group-hover:bg-blue-200 transition">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Upload Resume</h3>
                <p className="text-sm text-gray-600">
                  {hasResume ? 'Update your resume' : 'Upload your first resume'}
                </p>
              </div>
            </Link>

            {/* Apply to Job Button */}
            <Link
              to="/apply-job"
              className={`flex items-center p-4 border-2 rounded-lg transition group ${
                hasResume
                  ? 'border-green-200 hover:border-green-400 hover:bg-green-50'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
              onClick={(e) => {
                if (!hasResume) {
                  e.preventDefault()
                  alert('Please upload a resume first')
                }
              }}
            >
              <div className={`rounded-full p-3 mr-4 transition ${
                hasResume ? 'bg-green-100 group-hover:bg-green-200' : 'bg-gray-200'
              }`}>
                <svg
                  className={`w-6 h-6 ${hasResume ? 'text-green-600' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Apply to Job</h3>
                <p className="text-sm text-gray-600">
                  Start automated job application
                </p>
              </div>
            </Link>

            {/* LinkedIn Scraper Button */}
            <Link
              to="/linkedin-scraper"
              className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition group"
            >
              <div className="bg-purple-100 rounded-full p-3 mr-4 group-hover:bg-purple-200 transition">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">LinkedIn Scraper</h3>
                <p className="text-sm text-gray-600">
                  Analyze LinkedIn jobs & get PDF report
                </p>
              </div>
            </Link>

            {/* View History Button */}
            <Link
              to="/history"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition group"
            >
              <div className="bg-gray-100 rounded-full p-3 mr-4 group-hover:bg-gray-200 transition">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">View History</h3>
                <p className="text-sm text-gray-600">
                  See all your applications
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        {applicationCount > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
              <Link
                to="/history"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All →
              </Link>
            </div>
            <p className="text-gray-600">
              You have {applicationCount} application{applicationCount !== 1 ? 's' : ''} in your history.
            </p>
          </div>
        )}

        {/* Getting Started Guide (shown when no resume) */}
        {!hasResume && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-3">Getting Started</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Upload your resume to get started</li>
              <li>Paste a job URL from Indeed or Wellfound</li>
              <li>Let AI tailor your resume to the job description</li>
              <li>Automatically apply with one click</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
