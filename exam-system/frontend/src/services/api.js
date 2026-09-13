import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('exam_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('exam_token')
      localStorage.removeItem('exam_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
}

export const studentsAPI = {
  list: (params) => api.get('/admin/students', { params }),
  create: (data) => api.post('/admin/students', data),
  update: (id, data) => api.put(`/admin/students/${id}`, data),
  toggle: (id) => api.patch(`/admin/students/${id}/toggle`),
  delete: (id) => api.delete(`/admin/students/${id}`),
  import: (formData) => api.post('/admin/students/import', formData, { headers: {'Content-Type':'multipart/form-data'} }),
  performance: (id) => api.get(`/admin/students/${id}/performance`)
}

export const questionsAPI = {
  list: (params) => api.get('/questions', { params }),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  upload: (formData) => api.post('/questions/upload', formData, { headers: {'Content-Type':'multipart/form-data'} }),
  confirmUpload: (data) => api.post('/questions/upload/confirm', data)
}

export const examsAPI = {
  list: (params) => api.get('/admin/exams', { params }),
  create: (data) => api.post('/admin/exams', data),
  update: (id, data) => api.put(`/admin/exams/${id}`, data),
  delete: (id) => api.delete(`/admin/exams/${id}`),
  attempts: (id) => api.get(`/admin/exams/${id}/attempts`)
}

export const studentExamsAPI = {
  list: () => api.get('/student/exams'),
  instructions: (id) => api.get(`/student/exams/${id}/instructions`),
  start: (id) => api.post(`/student/exams/${id}/start`),
  dashboard: () => api.get('/student/dashboard')
}

export const attemptsAPI = {
  get: (id) => api.get(`/attempts/${id}`),
  saveAnswer: (id, data) => api.post(`/attempts/${id}/answers`, data),
  saveBulk: (id, data) => api.post(`/attempts/${id}/answers/bulk`, data),
  submit: (id) => api.post(`/attempts/${id}/submit`),
  reportViolation: (id, type) => api.post(`/attempts/${id}/violation`, { violation_type: type })
}

export const resultsAPI = {
  get: (attemptId) => api.get(`/results/${attemptId}`),
  adminList: (params) => api.get('/admin/results', { params }),
  export: (params) => api.get('/admin/results/export', { params, responseType: 'blob' })
}

export const analyticsAPI = {
  exam: (examId) => api.get(`/admin/analytics/${examId}`),
  leaderboard: (examId) => api.get(`/admin/analytics/${examId}/leaderboard`)
}

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
}

export const dashboardAPI = {
  admin: () => api.get('/admin/dashboard')
}
