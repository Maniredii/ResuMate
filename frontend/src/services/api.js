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
    api.post('/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
}

export const userAPI = {
  getUser: () => api.get('/user/get-user'),
  getApplicationHistory: () => api.get('/job/application-history'),
}

export const uploadAPI = {
  uploadResume: (file) => {
    const formData = new FormData()
    formData.append('resume', file)
    return api.post('/upload/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  uploadDocument: (file, type) => {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('fileType', type)
    return api.post('/upload/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getDocuments: () => api.get('/upload/documents'),
}

export const jobAPI = {
  applyJob: (jobUrl) => api.post('/job/apply-job', { jobUrl }),
}

export default api
