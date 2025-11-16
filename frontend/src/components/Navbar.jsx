import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { removeToken, isAuthenticated } from '../utils/auth'
import { userAPI } from '../services/api'

const Navbar = () => {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const authenticated = isAuthenticated()

  useEffect(() => {
    if (authenticated) {
      fetchUserName()
    }
  }, [authenticated])

  const fetchUserName = async () => {
    try {
      const response = await userAPI.getUser()
      setUserName(response.data.user.name)
    } catch (error) {
      console.error('Failed to fetch user name:', error)
    }
  }

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/dashboard" className="text-xl font-bold hover:text-blue-200 transition">
            Job Application Automation
          </Link>

          {/* Navigation Links */}
          {authenticated && (
            <div className="flex items-center space-x-6">
              <Link
                to="/dashboard"
                className="hover:text-blue-200 transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/upload-resume"
                className="hover:text-blue-200 transition font-medium"
              >
                Upload Resume
              </Link>
              <Link
                to="/apply-job"
                className="hover:text-blue-200 transition font-medium"
              >
                Apply to Job
              </Link>
              <Link
                to="/linkedin-scraper"
                className="hover:text-blue-200 transition font-medium"
              >
                LinkedIn Scraper
              </Link>
              <Link
                to="/history"
                className="hover:text-blue-200 transition font-medium"
              >
                History
              </Link>
              <Link
                to="/profile"
                className="hover:text-blue-200 transition font-medium"
              >
                Profile
              </Link>
              <Link
                to="/settings"
                className="hover:text-blue-200 transition font-medium"
              >
                Settings
              </Link>

              {/* User Info and Logout */}
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-blue-400">
                {userName && (
                  <span className="text-blue-100 font-medium">
                    {userName}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Login/Register Links for unauthenticated users */}
          {!authenticated && (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="hover:text-blue-200 transition font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
