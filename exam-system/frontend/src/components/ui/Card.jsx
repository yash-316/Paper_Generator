import React from 'react'

export default function Card({ children, title, actions, className = '', padding = true }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${padding ? 'p-6' : ''} ${className}`}>
      {(title || actions) && (
        <div className={`flex items-center justify-between ${padding ? 'mb-4' : 'p-6 pb-4'}`}>
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
