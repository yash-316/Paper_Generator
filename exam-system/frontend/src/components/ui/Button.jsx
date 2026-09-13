import React from 'react'
import Spinner from './Spinner'

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent',
  success: 'bg-green-600 hover:bg-green-700 text-white border-transparent shadow-sm',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent shadow-sm',
}

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg border
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? <Spinner size="sm" color={variant === 'secondary' || variant === 'ghost' ? 'text-gray-600' : 'text-white'} /> : Icon && <Icon className="w-4 h-4" />}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4" />}
    </button>
  )
}
