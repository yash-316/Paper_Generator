import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-gray-800 mt-2">Page Not Found</h2>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          The page or assessment resource you are attempting to navigate to does not exist or has expired.
        </p>
        <Link to="/login">
          <Button variant="primary" icon={Home} className="w-full">
            Return to Portal
          </Button>
        </Link>
      </div>
    </div>
  )
}
