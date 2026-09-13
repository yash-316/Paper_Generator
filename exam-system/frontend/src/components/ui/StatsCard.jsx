import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatsCard({ icon: Icon, label, value, change, changeLabel, color = 'blue', loading = false }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', iconBg: 'bg-green-100' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', iconBg: 'bg-yellow-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', iconBg: 'bg-red-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', iconBg: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', iconBg: 'bg-orange-100' },
  }
  const c = colorMap[color] || colorMap.blue

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200" />
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-7 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon className={`w-6 h-6 ${c.icon}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          {change > 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : change < 0 ? <TrendingDown className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4 text-gray-400" />}
          <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-gray-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}
