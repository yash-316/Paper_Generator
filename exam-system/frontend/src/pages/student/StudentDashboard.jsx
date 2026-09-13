import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardList, Clock, Award, CheckCircle2, Calendar,
  ArrowRight, AlertCircle, PlayCircle, Trophy, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentExamsAPI } from '../../services/api'
import StatsCard from '../../components/ui/StatsCard'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

export default function StudentDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const res = await studentExamsAPI.dashboard()
      setData(res.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 mt-3">Loading student portal...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-red-50 p-6 rounded-xl text-center text-red-700">
        Failed to load candidate information.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block bg-white/20 text-blue-100 text-xs px-3 py-1 rounded-full font-semibold mb-2">
            Student Assessment Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome, {data.student?.name}!
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Reg No: <span className="font-mono font-bold">{data.student?.reg_number}</span>
            {data.student?.student_class && ` • Class ${data.student.student_class}`}
            {data.student?.section && ` (${data.student.section})`}
          </p>
        </div>
        <div className="absolute right-4 bottom-0 opacity-10 hidden sm:block">
          <ClipboardList className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={ClipboardList}
          label="Exams Taken"
          value={data.stats?.exams_taken || 0}
          color="blue"
        />
        <StatsCard
          icon={Award}
          label="Average Score"
          value={`${data.stats?.avg_score || 0}%`}
          color="green"
        />
        <StatsCard
          icon={Trophy}
          label="Best Score"
          value={`${data.stats?.best_score || 0}%`}
          color="purple"
        />
        <StatsCard
          icon={Calendar}
          label="Upcoming"
          value={data.stats?.upcoming_count || 0}
          color="orange"
        />
      </div>

      {/* Live & Available Exams */}
      <Card
        title="Live Examinations (Ready to Take)"
        actions={
          <Link to="/student/exams" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Exams <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {data.available_exams && data.available_exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.available_exams.map((exam) => (
              <div
                key={exam.id}
                className="border border-blue-100 bg-blue-50/40 rounded-xl p-5 flex flex-col justify-between hover:border-blue-300 transition shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      {exam.subject}
                    </span>
                    <Badge variant="success">LIVE NOW</Badge>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{exam.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {exam.duration_minutes} Mins
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                      {exam.total_questions} Questions
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-blue-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Closes: {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {exam.attempted ? (
                    <span className="text-xs font-semibold text-gray-400">Already Submitted</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={PlayCircle}
                      onClick={() => navigate(`/student/exam/${exam.id}/instructions`)}
                    >
                      Enter Examination
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-sm">
            No live examinations available at this moment.
          </div>
        )}
      </Card>

      {/* Two Columns: Upcoming Exams & Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Scheduled Exams */}
        <Card title="Upcoming Scheduled Assessments">
          {data.upcoming_exams && data.upcoming_exams.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {data.upcoming_exams.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.title}</p>
                    <p className="text-xs text-gray-500">
                      {u.subject} • Duration: {u.duration_minutes}m
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-blue-700">
                      {new Date(u.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-gray-400">
                      {new Date(u.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">
              No upcoming exams scheduled
            </div>
          )}
        </Card>

        {/* Recent Results */}
        <Card title="My Assessment History">
          {data.recent_results && data.recent_results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {data.recent_results.map((r) => (
                <div key={r.attempt_id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.exam_title}</p>
                    <p className="text-xs text-gray-500">{r.subject}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{r.percentage}%</p>
                      <p className="text-xs text-gray-400">
                        {r.total_marks} / {r.max_marks}
                      </p>
                    </div>
                    <Badge variant={r.passed ? 'success' : 'danger'}>
                      {r.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                    <Link
                      to={`/student/results/${r.attempt_id}`}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="View Report Card"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">
              No previous exam results found
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
