import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Trophy, ArrowLeft, Award, Clock, Medal, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { analyticsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'

export default function LeaderboardPage() {
  const { examId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadLeaderboard()
  }, [examId])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await analyticsAPI.leaderboard(examId)
      setData(res.data)
    } catch (err) {
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 mt-3">Compiling institutional leaderboard...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Leaderboard data unavailable.</p>
        <Link to="/student/dashboard" className="text-blue-600 font-semibold text-sm mt-3 inline-block">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const leaderboard = data.leaderboard || []
  const topThree = leaderboard.slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <Link
        to="/student/dashboard"
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 sm:p-8 text-white text-center shadow-lg relative overflow-hidden">
        <Trophy className="w-12 h-12 mx-auto mb-2 text-white" />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{data.exam_title}</h1>
        <p className="text-amber-100 text-sm mt-1">Official Candidate Merit Leaderboard</p>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 - Silver */}
          {topThree[1] && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 text-center shadow-sm flex flex-col justify-between order-2 sm:order-1">
              <div>
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-black text-lg flex items-center justify-center mx-auto mb-2">
                  2
                </div>
                <h3 className="font-bold text-gray-900 text-base truncate">{topThree[1].student_name}</h3>
                <p className="text-xs font-mono text-gray-400">{topThree[1].reg_number}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-2xl font-black text-slate-700">{topThree[1].percentage}%</span>
                <p className="text-xs text-gray-500">{topThree[1].total_marks} / {topThree[1].max_marks} pts</p>
              </div>
            </div>
          )}

          {/* Rank 1 - Gold (Center, prominent) */}
          {topThree[0] && (
            <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 text-center shadow-md flex flex-col justify-between order-1 sm:order-2 relative transform sm:-translate-y-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                👑 Top Rank
              </span>
              <div>
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 font-black text-xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                  1
                </div>
                <h3 className="font-bold text-gray-900 text-lg truncate">{topThree[0].student_name}</h3>
                <p className="text-xs font-mono text-gray-400">{topThree[0].reg_number}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-100">
                <span className="text-3xl font-black text-amber-600">{topThree[0].percentage}%</span>
                <p className="text-xs text-gray-500">{topThree[0].total_marks} / {topThree[0].max_marks} pts</p>
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {topThree[2] && (
            <div className="bg-white rounded-2xl border-2 border-orange-200 p-5 text-center shadow-sm flex flex-col justify-between order-3">
              <div>
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-800 font-black text-lg flex items-center justify-center mx-auto mb-2">
                  3
                </div>
                <h3 className="font-bold text-gray-900 text-base truncate">{topThree[2].student_name}</h3>
                <p className="text-xs font-mono text-gray-400">{topThree[2].reg_number}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-2xl font-black text-orange-700">{topThree[2].percentage}%</span>
                <p className="text-xs text-gray-500">{topThree[2].total_marks} / {topThree[2].max_marks} pts</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase font-semibold">
            <tr>
              <th className="px-5 py-3">Rank</th>
              <th className="px-5 py-3">Candidate</th>
              <th className="px-5 py-3">Registration</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3 text-right">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaderboard.map((row) => {
              const isCurrentUser = user?.reg_number === row.reg_number
              return (
                <tr
                  key={row.rank}
                  className={`hover:bg-gray-50 transition ${
                    isCurrentUser ? 'bg-blue-50/70 font-semibold text-blue-900' : ''
                  }`}
                >
                  <td className="px-5 py-3 font-bold text-xs text-gray-700">
                    #{row.rank}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900">{row.student_name}</span>
                    {isCurrentUser && (
                      <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    {row.reg_number}
                  </td>
                  <td className="px-5 py-3 text-gray-700 text-xs">
                    {row.total_marks} / {row.max_marks}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">
                    {row.percentage}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
