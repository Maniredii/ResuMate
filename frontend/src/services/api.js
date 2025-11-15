import axios from 'axios'

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API methods
export const authAPI = {
  register: (name, email, password) =>
    api.post('/register', { name, email, password }),
  login: (email, password) =>
    api.post('/login', { email, password }),
}

export const userAPI = {
  getUser: () => api.get('/get-user'),
  getApplicationHistory: () => api.get('/application-history'),
}

export const uploadAPI = {
  uploadResume: (file) => {
    const formData = new FormData()
    formData.append('resume', file)
    return api.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  uploadDocument: (file, type) => {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('type', type)
    return api.post('/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export const jobAPI = {
  applyJob: (jobUrl) => api.post('/apply-job', { jobUrl }),
}

export default api
