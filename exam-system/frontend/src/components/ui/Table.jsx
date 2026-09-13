import React, { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import Spinner from './Spinner'

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data found',
  onSort,
  className = ''
}) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (col) => {
    if (!col.sortable) return
    const newDir = sortCol === col.key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortCol(col.key)
    setSortDir(newDir)
    onSort && onSort(col.key, newDir)
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={`overflow-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''} ${col.className || ''}`}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="flex flex-col">
                      <ChevronUp className={`w-3 h-3 ${sortCol === col.key && sortDir === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                      <ChevronDown className={`w-3 h-3 -mt-1 ${sortCol === col.key && sortDir === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-sm text-gray-700 ${col.className || ''}`}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
