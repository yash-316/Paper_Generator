import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './ui/Spinner'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === 'student') return <Navigate to="/student/dashboard" replace />
    if (role === 'admin' || role === 'teacher') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return children
}
