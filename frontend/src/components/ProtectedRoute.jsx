import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../utils/auth'

/**
 * ProtectedRoute component that checks authentication before rendering
 * Redirects to login page if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  // Render children if authenticated
  return children
}

export default ProtectedRoute
