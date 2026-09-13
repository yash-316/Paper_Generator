import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Clock, Calendar, Award, CheckCircle2,
  AlertCircle, PlayCircle, Eye, ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentExamsAPI } from '../../services/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

export default function StudentExamsPage() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available')
  const navigate = useNavigate()

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      setLoading(true)
      const res = await studentExamsAPI.list()
      setExams(res.data || [])
    } catch (err) {
      toast.error('Failed to load examinations')
    } finally {
      setLoading(false)
    }
  }

  const liveExams = exams.filter((e) => e.status === 'live' && !e.attempted)
  const upcomingExams = exams.filter((e) => e.status === 'scheduled')
  const completedExams = exams.filter((e) => e.attempted)

  const displayedExams =
    activeTab === 'available'
      ? liveExams
      : activeTab === 'upcoming'
      ? upcomingExams
      : completedExams

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Examinations Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">Access scheduled, live, and previous evaluations</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 text-sm font-medium">
        {[
          { key: 'available', label: `Live & Available (${liveExams.length})` },
          { key: 'upcoming', label: `Upcoming Scheduled (${upcomingExams.length})` },
          { key: 'completed', label: `Completed (${completedExams.length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-5 transition-colors relative ${
              activeTab === tab.key
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List / Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading examinations...</p>
        </div>
      ) : displayedExams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No examinations in this category</h3>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === 'available'
              ? 'No exams currently in active window.'
              : activeTab === 'upcoming'
              ? 'No upcoming exams scheduled.'
              : 'You have not submitted any exams yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    {exam.subject}
                  </span>
                  <Badge variant={exam.status === 'live' ? 'success' : 'primary'}>
                    {exam.status.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exam.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{exam.duration_minutes} Mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                    <span>{exam.total_questions} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span>+{exam.marks_per_question} / -{exam.negative_marking}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pass: {exam.passing_percentage}%</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Start: {new Date(exam.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>End: {new Date(exam.end_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                </div>
              </div>

              {/* Action footer */}
              <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex justify-between items-center">
                {activeTab === 'completed' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Eye}
                    onClick={() => navigate(`/student/results/${exam.attempt_id}`)}
                    className="w-full"
                  >
                    View Result Card
                  </Button>
                ) : activeTab === 'available' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={PlayCircle}
                    onClick={() => navigate(`/student/exam/${exam.id}/instructions`)}
                    className="w-full"
                  >
                    Start Exam
                  </Button>
                ) : (
                  <span className="text-xs text-gray-500 mx-auto">
                    Unlocks on {new Date(exam.start_time).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
