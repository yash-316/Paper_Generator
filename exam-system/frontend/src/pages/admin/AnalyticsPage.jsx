import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  BarChart2, Award, Clock, ArrowLeft, Trophy, CheckCircle,
  XCircle, HelpCircle, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { analyticsAPI } from '../../services/api'
import Card from '../../components/ui/Card'
import StatsCard from '../../components/ui/StatsCard'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

export default function AnalyticsPage() {
  const { examId } = useParams()
  const [data, setData] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [examId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [anaRes, leadRes] = await Promise.all([
        analyticsAPI.exam(examId),
        analyticsAPI.leaderboard(examId)
      ])
      setData(anaRes.data)
      setLeaderboard(leadRes.data?.leaderboard || [])
    } catch (err) {
      toast.error('Failed to load exam analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 mt-3">Compiling psychometric analytics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No analytics available for this exam.</p>
        <Link to="/admin/exams" className="text-blue-600 font-semibold text-sm mt-3 inline-block">
          ← Back to Exams
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back & Header */}
      <div>
        <Link to="/admin/exams" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Examinations
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.exam_title} — Assessment Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Psychometric breakdown, question difficulty distribution, and rankings
            </p>
          </div>
          <Badge variant="primary">{data.total_attempts} Submissions Evaluated</Badge>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard label="Average Score" value={`${data.avg_score}%`} color="blue" />
        <StatsCard label="Highest Score" value={`${data.highest_score}%`} color="green" />
        <StatsCard label="Lowest Score" value={`${data.lowest_score}%`} color="red" />
        <StatsCard label="Median Score" value={`${data.median_score}%`} color="purple" />
        <StatsCard label="Pass Percentage" value={`${data.pass_rate}%`} color="yellow" />
        <StatsCard label="Average Duration" value={`${data.avg_time_minutes}m`} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question-Level Accuracy (Hardest Questions First) */}
        <Card
          title="Question Difficulty & Accuracy Breakdown"
          className="lg:col-span-2"
          padding={false}
        >
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 text-xs text-gray-500">
            Ordered from lowest accuracy to highest. Identifies syllabus topics requiring remediation.
          </div>
          {data.question_analytics && data.question_analytics.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {data.question_analytics.map((q, idx) => (
                <div key={q.question_id} className="p-4 space-y-2 hover:bg-gray-50/50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="font-bold text-gray-500 mr-1.5">#{idx + 1}</span>
                      {q.question_text}
                    </p>
                    <span className="text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {q.correct_pct}% Correct
                    </span>
                  </div>

                  {/* Tri-color accuracy bar */}
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                    <div
                      style={{ width: `${q.correct_pct}%` }}
                      className="bg-emerald-500 transition-all"
                      title={`Correct: ${q.correct_pct}%`}
                    />
                    <div
                      style={{ width: `${q.incorrect_pct}%` }}
                      className="bg-rose-500 transition-all"
                      title={`Incorrect: ${q.incorrect_pct}%`}
                    />
                    <div
                      style={{ width: `${q.unanswered_pct}%` }}
                      className="bg-gray-300 transition-all"
                      title={`Unanswered: ${q.unanswered_pct}%`}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500 pt-0.5">
                    <span className="text-emerald-600">✓ Correct: {q.correct_pct}%</span>
                    <span className="text-rose-600">✗ Incorrect: {q.incorrect_pct}%</span>
                    <span className="text-gray-400">— Skipped: {q.unanswered_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              No submissions recorded to compute accuracy metrics
            </div>
          )}
        </Card>

        {/* Leaderboard Podium & Top Ranked */}
        <Card title="Candidate Leaderboard" padding={false}>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {leaderboard.map((item) => (
                <div key={item.rank} className="p-3.5 flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      item.rank === 1
                        ? 'bg-amber-100 text-amber-800'
                        : item.rank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : item.rank === 3
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.student_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.reg_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{item.percentage}%</p>
                    <p className="text-xs text-gray-400">{Math.floor(item.time_taken_seconds / 60)}m</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              Leaderboard is not available yet
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
