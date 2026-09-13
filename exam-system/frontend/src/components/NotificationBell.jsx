import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { notificationsAPI } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const intervalRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list()
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.notifications)
        ? res.data.notifications
        : []
      setNotifications(list)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNotifications()
    intervalRef.current = setInterval(fetchNotifications, 60000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const safeList = Array.isArray(notifications) ? notifications : []
  const unread = safeList.filter((n) => !n.is_read).length

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch { /* ignore */ }
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await notificationsAPI.markAllRead()
      setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, is_read: true })))
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {safeList.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No notifications yet</div>
            ) : (
              safeList.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="text-gray-300 hover:text-blue-500 flex-shrink-0 mt-1">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
