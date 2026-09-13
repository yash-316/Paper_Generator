import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, total, perPage, onPageChange }) {
  const pages = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i)
  }

  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded-lg text-sm hover:bg-gray-100">1</button>
            {pages[0] > 2 && <span className="text-gray-400 px-1">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-400 px-1">...</span>}
            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded-lg text-sm hover:bg-gray-100">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
