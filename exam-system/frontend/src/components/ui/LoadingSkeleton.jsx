import React from 'react'

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-100 rounded mb-1" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-50 rounded mb-1 flex gap-4 px-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function LoadingSkeleton({ type = 'table', ...props }) {
  if (type === 'card') return <CardSkeleton {...props} />
  return <TableSkeleton {...props} />
}
