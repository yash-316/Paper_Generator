import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Search...', debounce = 400, className = '' }) {
  const [local, setLocal] = useState(value || '')
  const timer = useRef(null)

  useEffect(() => { setLocal(value || '') }, [value])

  const handleChange = (e) => {
    const v = e.target.value
    setLocal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), debounce)
  }

  const handleClear = () => {
    setLocal('')
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {local && (
        <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
