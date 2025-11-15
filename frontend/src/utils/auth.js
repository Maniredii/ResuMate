// Authentication utility functions

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem('token')
}

/**
 * Set JWT token in localStorage
 * @param {string} token - JWT token to store
 */
export const setToken = (token) => {
  localStorage.setItem('token', token)
}

/**
 * Remove JWT token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('token')
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists, false otherwise
 */
export const isAuthenticated = () => {
  const token = getToken()
  return token !== null && token !== undefined && token !== ''
}
