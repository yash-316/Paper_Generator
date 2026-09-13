import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auto-load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('exam_token')
    const savedUser = localStorage.getItem('exam_user')
    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser && typeof parsedUser === 'object') {
          setToken(savedToken)
          setUser(parsedUser)
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
        }
      } catch {
        localStorage.removeItem('exam_token')
        localStorage.removeItem('exam_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (identifier, password, role) => {
    try {
      // Backend expects identifier (email or registration number) and password
      const payload = { identifier, password }
      const response = await authAPI.login(payload)
      const data = response.data
      const access_token = data.access_token

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      localStorage.setItem('exam_token', access_token)

      let userData = data.user || {
        id: data.user_id,
        role: data.role,
        name: data.name,
        email: identifier.includes('@') ? identifier : undefined,
        reg_number: !identifier.includes('@') ? identifier : undefined,
      }

      // Try fetching complete profile from /auth/me
      try {
        const meRes = await authAPI.me()
        if (meRes.data) {
          userData = { ...userData, ...meRes.data }
        }
      } catch {
        // Fallback to basic userData
      }

      localStorage.setItem('exam_user', JSON.stringify(userData))
      setToken(access_token)
      setUser(userData)
      return { success: true, role: userData.role }
    } catch (error) {
      let errorMsg = 'Login failed'
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
      } else if (error.message) {
        errorMsg = error.message
      }
      return { success: false, error: errorMsg }
    }
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch { /* ignore */ }
    localStorage.removeItem('exam_token')
    localStorage.removeItem('exam_user')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }, [])

  const isAuthenticated = !!token && !!user
  const userRole = user?.role || null

  const value = { user, token, loading, login, logout, isAuthenticated, role: userRole }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthContext
