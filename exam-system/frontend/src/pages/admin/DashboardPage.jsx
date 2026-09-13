import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, BookOpen, ClipboardList, CheckCircle2, Clock,
  Award, TrendingUp, AlertCircle, ArrowRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { dashboardAPI } from '../../services/api'
import StatsCard from '../../components/ui/StatsCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6']

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const res = await dashboardAPI.admin()
      setData(res.data)
    } catch (err) {
      setError('Failed to load dashboard data. Please make sure the backend is connected.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="text-gray-500 mt-4 text-sm">Loading dashboard metrics...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 max-w-lg mx-auto my-10">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-red-500" />
        <h3 className="font-semibold mb-1">Error Loading Dashboard</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  const passFailData = [
    { name: 'Passed', value: data.pass_count || 0 },
    { name: 'Failed', value: data.fail_count || 0 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Institution Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time examination and candidate metrics</p>
      </div>

      {/* Top 6 KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          icon={Users}
          label="Total Students"
          value={data.total_students}
          color="blue"
        />
        <StatsCard
          icon={ClipboardList}
          label="Total Exams"
          value={data.total_exams}
          color="purple"
        />
        <StatsCard
          icon={BookOpen}
          label="Question Bank"
          value={data.total_questions}
          color="yellow"
        />
        <StatsCard
          icon={Clock}
          label="Active Exams"
          value={data.active_exams}
          color="green"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Attempts"
          value={data.completed_attempts}
          color="orange"
        />
        <StatsCard
          icon={Award}
          label="Avg Score"
          value={`${data.avg_score}%`}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Participation */}
        <Card title="Exam Participation & Average" className="lg:col-span-2">
          {data.exam_participation && data.exam_participation.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.exam_participation}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10B981" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="attempts" name="Students Attempted" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="avg_score" name="Avg Score (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No exam attempts recorded yet
            </div>
          )}
        </Card>

        {/* Pass / Fail Ratio */}
        <Card title="Overall Pass / Fail Ratio">
          {data.pass_count > 0 || data.fail_count > 0 ? (
            <div className="h-72 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={passFailData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {passFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-green-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  Pass: {data.pass_count} ({Math.round((data.pass_count / (data.pass_count + data.fail_count || 1)) * 100)}%)
                </span>
                <span className="flex items-center gap-1.5 text-red-600">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  Fail: {data.fail_count} ({Math.round((data.fail_count / (data.pass_count + data.fail_count || 1)) * 100)}%)
                </span>
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No results available yet
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Section: Question Difficulty & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions by Difficulty */}
        <Card title="Questions Breakdown by Difficulty">
          <div className="space-y-4 py-2">
            {data.difficulty_distribution?.map((item) => {
              const total = data.total_questions || 1
              const pct = Math.round((item.count / total) * 100)
              const colorClass =
                item.difficulty === 'easy'
                  ? 'bg-emerald-500'
                  : item.difficulty === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              return (
                <div key={item.difficulty} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize text-gray-700">{item.difficulty}</span>
                    <span className="text-gray-500">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent Submissions */}
        <Card
          title="Recent Exam Submissions"
          className="lg:col-span-2"
          actions={
            <Link to="/admin/results" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {data.recent_attempts && data.recent_attempts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {data.recent_attempts.map((attempt, index) => (
                <div key={index} className="py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{attempt.student_name}</p>
                    <p className="text-xs text-gray-500 truncate">{attempt.exam_title}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{attempt.percentage}%</p>
                      <p className="text-xs text-gray-400">
                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <Badge variant={attempt.passed ? 'success' : 'danger'}>
                      {attempt.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 text-sm">
              No recent exam submissions
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
