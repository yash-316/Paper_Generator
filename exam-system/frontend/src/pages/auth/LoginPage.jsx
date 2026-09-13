import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import { GraduationCap, Eye, EyeOff, User, Lock } from 'lucide-react'

export default function LoginPage() {
  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'student') navigate('/student/dashboard', { replace: true })
      else navigate('/admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your credentials')
      return
    }
    setLoading(true)
    try {
      const result = await login(identifier.trim(), password, role)
      if (result.success) {
        toast.success('Welcome back!')
        if (result.role === 'student') navigate('/student/dashboard', { replace: true })
        else navigate('/admin/dashboard', { replace: true })
      } else {
        setError(typeof result.error === 'string' ? result.error : 'Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const demoFill = (type) => {
    if (type === 'admin') {
      setRole('admin')
      setIdentifier('admin@school.com')
      setPassword('Admin@123')
    } else if (type === 'teacher') {
      setRole('admin')
      setIdentifier('teacher1@school.com')
      setPassword('Teacher@123')
    } else {
      setRole('student')
      setIdentifier('STU001')
      setPassword('Student@123')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <GraduationCap className="w-9 h-9 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">ExamPortal</h1>
          <p className="text-blue-200 mt-1">Online Examination System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Role tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {[
              { key: 'student', label: '🎓 Student' },
              { key: 'admin', label: '👩‍🏫 Teacher / Admin' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setRole(key); setIdentifier(''); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  role === key
                    ? 'bg-white shadow text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {role === 'student' ? 'Registration Number' : 'Email Address'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={role === 'student' ? 'text' : 'email'}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. STU001' : 'admin@school.com'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Demo Accounts</p>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'admin', label: 'Admin', color: 'purple' },
                { type: 'teacher', label: 'Teacher', color: 'blue' },
                { type: 'student', label: 'Student', color: 'green' },
              ].map(({ type, label, color }) => (
                <button
                  key={type}
                  onClick={() => demoFill(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors bg-${color}-50 text-${color}-700 border-${color}-200 hover:bg-${color}-100`}
                >
                  Fill {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Click to auto-fill demo credentials</p>
          </div>
        </div>

        <p className="text-center text-blue-200 text-sm mt-6">
          © 2026 ExamPortal. All rights reserved.
        </p>
      </div>
    </div>
  )
}
