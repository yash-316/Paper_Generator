import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardList, Plus, Calendar, Clock, Award, ShieldAlert,
  Edit2, Trash2, BarChart2, FileText, CheckCircle, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { examsAPI } from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

export default function ExamsPage() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Active Tab inside Create/Edit Modal
  const [activeTab, setActiveTab] = useState('basic')

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Physics',
    description: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    total_questions: 25,
    marks_per_question: 4.0,
    negative_marking: 1.0,
    passing_percentage: 40.0,
    // Difficulty distribution
    use_difficulty: false,
    diff_easy: 10,
    diff_medium: 10,
    diff_hard: 5,
    // Settings
    show_result_immediately: true,
    show_correct_answers: false,
    show_explanations: false,
    leaderboard_enabled: true,
    max_violations: 3
  })

  const navigate = useNavigate()

  useEffect(() => {
    fetchExams()
  }, [statusFilter, subjectFilter])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const params = {
        status: statusFilter || undefined,
        subject: subjectFilter || undefined
      }
      const res = await examsAPI.list(params)
      setExams(res.data.items || [])
    } catch (err) {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const afterTomorrow = new Date(now.getTime() + 26 * 60 * 60 * 1000)

    setFormData({
      title: '',
      subject: 'Physics',
      description: '',
      start_time: tomorrow.toISOString().slice(0, 16),
      end_time: afterTomorrow.toISOString().slice(0, 16),
      duration_minutes: 60,
      total_questions: 25,
      marks_per_question: 4.0,
      negative_marking: 1.0,
      passing_percentage: 40.0,
      use_difficulty: false,
      diff_easy: 10,
      diff_medium: 10,
      diff_hard: 5,
      show_result_immediately: true,
      show_correct_answers: false,
      show_explanations: false,
      leaderboard_enabled: true,
      max_violations: 3
    })
    setActiveTab('basic')
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsEditing(false)
    setSelectedExam(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (exam) => {
    setSelectedExam(exam)
    setIsEditing(true)
    const hasDiff = !!exam.difficulty_distribution
    setFormData({
      title: exam.title,
      subject: exam.subject,
      description: exam.description || '',
      start_time: exam.start_time ? exam.start_time.slice(0, 16) : '',
      end_time: exam.end_time ? exam.end_time.slice(0, 16) : '',
      duration_minutes: exam.duration_minutes,
      total_questions: exam.total_questions,
      marks_per_question: exam.marks_per_question,
      negative_marking: exam.negative_marking,
      passing_percentage: exam.passing_percentage,
      use_difficulty: hasDiff,
      diff_easy: exam.difficulty_distribution?.easy || 10,
      diff_medium: exam.difficulty_distribution?.medium || 10,
      diff_hard: exam.difficulty_distribution?.hard || 5,
      show_result_immediately: exam.show_result_immediately,
      show_correct_answers: exam.show_correct_answers,
      show_explanations: exam.show_explanations,
      leaderboard_enabled: exam.leaderboard_enabled,
      max_violations: exam.max_violations
    })
    setActiveTab('basic')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.subject || !formData.start_time || !formData.end_time) {
      toast.error('Please fill all basic details')
      return
    }

    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      toast.error('End time must be after start time')
      return
    }

    const payload = {
      title: formData.title,
      subject: formData.subject,
      description: formData.description,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      duration_minutes: parseInt(formData.duration_minutes),
      total_questions: parseInt(formData.total_questions),
      marks_per_question: parseFloat(formData.marks_per_question),
      negative_marking: parseFloat(formData.negative_marking),
      passing_percentage: parseFloat(formData.passing_percentage),
      difficulty_distribution: formData.use_difficulty
        ? {
            easy: parseInt(formData.diff_easy) || 0,
            medium: parseInt(formData.diff_medium) || 0,
            hard: parseInt(formData.diff_hard) || 0
          }
        : null,
      show_result_immediately: formData.show_result_immediately,
      show_correct_answers: formData.show_correct_answers,
      show_explanations: formData.show_explanations,
      leaderboard_enabled: formData.leaderboard_enabled,
      max_violations: parseInt(formData.max_violations)
    }

    try {
      setSubmitting(true)
      if (isEditing) {
        await examsAPI.update(selectedExam.id, payload)
        toast.success('Exam updated successfully')
      } else {
        await examsAPI.create(payload)
        toast.success('Exam created successfully')
      }
      setModalOpen(false)
      fetchExams()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save exam')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedExam) return
    try {
      setSubmitting(true)
      await examsAPI.delete(selectedExam.id)
      toast.success('Exam deleted')
      setDeleteDialogOpen(false)
      fetchExams()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete exam')
    } finally {
      setSubmitting(false)
    }
  }

  const statusVariantMap = {
    draft: 'default',
    scheduled: 'primary',
    live: 'success',
    completed: 'secondary'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create scheduled assessments with difficulty balancing and anti-cheat monitoring
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Create New Exam
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'live', label: '🟢 Live' },
              { value: 'scheduled', label: '🔵 Scheduled' },
              { value: 'draft', label: '⚪ Draft' },
              { value: 'completed', label: '🟣 Completed' }
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            placeholder="All Subjects"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={[
              { value: '', label: 'All Subjects' },
              { value: 'Physics', label: 'Physics' },
              { value: 'Chemistry', label: 'Chemistry' },
              { value: 'Mathematics', label: 'Mathematics' },
              { value: 'Biology', label: 'Biology' }
            ]}
          />
        </div>
      </div>

      {/* Exam Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading examinations...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No exams configured</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-6">
            Get started by scheduling a new exam. Candidates will be notified automatically.
          </p>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Create Exam
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {exam.subject}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-0.5 leading-snug">
                      {exam.title}
                    </h3>
                  </div>
                  <Badge variant={statusVariantMap[exam.status] || 'default'}>
                    {exam.status.toUpperCase()}
                  </Badge>
                </div>

                {exam.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{exam.description}</p>
                )}

                {/* Specs Pill Grid */}
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
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pass: {exam.passing_percentage}%</span>
                  </div>
                </div>

                {/* Timing */}
                <div className="space-y-1 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Starts: {new Date(exam.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Ends: {new Date(exam.end_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                </div>

                {/* Attempts count */}
                <div className="text-xs text-gray-600 flex justify-between items-center pt-1">
                  <span>Candidate Submissions:</span>
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                    {exam.attempt_count || 0}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="bg-gray-50/70 border-t border-gray-100 p-3 px-6 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/results?exam_id=${exam.id}`}
                    className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="w-3.5 h-3.5" /> Results
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    to={`/admin/analytics/${exam.id}`}
                    className="flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Analytics
                  </Link>
                </div>

                <div className="flex items-center gap-1">
                  {exam.status !== 'completed' && (
                    <button
                      onClick={() => handleOpenEdit(exam)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Edit Configuration"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {exam.status === 'draft' && (
                    <button
                      onClick={() => {
                        setSelectedExam(exam)
                        setDeleteDialogOpen(true)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Exam Modal with Tabs */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? `Edit Exam: ${selectedExam?.title}` : 'Configure New Examination'}
        size="xl"
      >
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mb-6 text-sm font-medium">
          {[
            { key: 'basic', label: '1. Basic Details' },
            { key: 'questions', label: '2. Marking & Questions' },
            { key: 'distribution', label: '3. Difficulty Distribution' },
            { key: 'settings', label: '4. Security & Results' }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-4 transition-colors relative ${
                activeTab === tab.key
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tab 1: Basic */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <Input
                label="Exam Title"
                required
                placeholder="e.g. Physics Mid-Term Examination 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  options={[
                    { value: 'Physics', label: 'Physics' },
                    { value: 'Chemistry', label: 'Chemistry' },
                    { value: 'Mathematics', label: 'Mathematics' },
                    { value: 'Biology', label: 'Biology' }
                  ]}
                />
                <Input
                  label="Duration (Minutes)"
                  type="number"
                  required
                  min="5"
                  max="300"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Window (Date & Time)"
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
                <Input
                  label="End Window (Date & Time)"
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate Instructions / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Instructions displayed to candidates prior to commencement..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Marking & Questions */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Total Questions to Draw"
                  type="number"
                  required
                  min="1"
                  max="200"
                  value={formData.total_questions}
                  onChange={(e) => setFormData({ ...formData, total_questions: e.target.value })}
                />
                <Input
                  label="Marks Per Correct Answer"
                  type="number"
                  step="0.5"
                  required
                  min="0.5"
                  value={formData.marks_per_question}
                  onChange={(e) => setFormData({ ...formData, marks_per_question: e.target.value })}
                />
                <Input
                  label="Negative Marking (Deduction)"
                  type="number"
                  step="0.25"
                  min="0"
                  value={formData.negative_marking}
                  onChange={(e) => setFormData({ ...formData, negative_marking: e.target.value })}
                />
                <Input
                  label="Passing Percentage (%)"
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={formData.passing_percentage}
                  onChange={(e) => setFormData({ ...formData, passing_percentage: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-semibold">Calculated Paper Total:</p>
                <p>
                  Max Score: <strong>{(formData.total_questions * formData.marks_per_question).toFixed(1)}</strong> marks
                </p>
                <p>
                  Passing Cut-off: <strong>{((formData.total_questions * formData.marks_per_question * formData.passing_percentage) / 100).toFixed(1)}</strong> marks
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Distribution */}
          {activeTab === 'distribution' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="use_difficulty"
                  checked={formData.use_difficulty}
                  onChange={(e) => setFormData({ ...formData, use_difficulty: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="use_difficulty" className="text-sm font-medium text-gray-800 cursor-pointer">
                  Enforce Difficulty-Based Paper Generation
                </label>
              </div>

              {formData.use_difficulty ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-gray-500">
                    Specify the exact question count for each difficulty tier. Sum should match total questions ({formData.total_questions}).
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Easy Questions"
                      type="number"
                      min="0"
                      value={formData.diff_easy}
                      onChange={(e) => setFormData({ ...formData, diff_easy: e.target.value })}
                    />
                    <Input
                      label="Medium Questions"
                      type="number"
                      min="0"
                      value={formData.diff_medium}
                      onChange={(e) => setFormData({ ...formData, diff_medium: e.target.value })}
                    />
                    <Input
                      label="Hard Questions"
                      type="number"
                      min="0"
                      value={formData.diff_hard}
                      onChange={(e) => setFormData({ ...formData, diff_hard: e.target.value })}
                    />
                  </div>

                  <div className="text-xs text-gray-500">
                    Current Distribution Sum:{' '}
                    <strong className={
                      parseInt(formData.diff_easy || 0) + parseInt(formData.diff_medium || 0) + parseInt(formData.diff_hard || 0) === parseInt(formData.total_questions)
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }>
                      {parseInt(formData.diff_easy || 0) + parseInt(formData.diff_medium || 0) + parseInt(formData.diff_hard || 0)} / {formData.total_questions}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
                  When difficulty balancing is disabled, questions are randomly picked uniformly across all questions available under subject <strong>{formData.subject}</strong>.
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Security & Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="show_result_immediately"
                    checked={formData.show_result_immediately}
                    onChange={(e) => setFormData({ ...formData, show_result_immediately: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="show_result_immediately" className="text-sm text-gray-800 cursor-pointer">
                    Show score & percentage immediately upon submission
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="show_correct_answers"
                    checked={formData.show_correct_answers}
                    onChange={(e) => setFormData({ ...formData, show_correct_answers: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="show_correct_answers" className="text-sm text-gray-800 cursor-pointer">
                    Show correct answers in student review report
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="show_explanations"
                    checked={formData.show_explanations}
                    onChange={(e) => setFormData({ ...formData, show_explanations: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="show_explanations" className="text-sm text-gray-800 cursor-pointer">
                    Display detailed step-by-step solutions/explanations
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="leaderboard_enabled"
                    checked={formData.leaderboard_enabled}
                    onChange={(e) => setFormData({ ...formData, leaderboard_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="leaderboard_enabled" className="text-sm text-gray-800 cursor-pointer">
                    Publish public student rank leaderboard for this exam
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <Input
                  label="Anti-Cheat Violation Tolerance (Tab switches / window blurs before auto-submit)"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_violations}
                  onChange={(e) => setFormData({ ...formData, max_violations: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Navigation & Submit footer */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div>
              {activeTab !== 'basic' && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'questions', 'distribution', 'settings']
                    const prev = tabs[tabs.indexOf(activeTab) - 1]
                    setActiveTab(prev)
                  }}
                >
                  ← Back
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)} type="button">
                Cancel
              </Button>
              {activeTab !== 'settings' ? (
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'questions', 'distribution', 'settings']
                    const next = tabs[tabs.indexOf(activeTab) + 1]
                    setActiveTab(next)
                  }}
                >
                  Next Step →
                </Button>
              ) : (
                <Button variant="primary" type="submit" loading={submitting}>
                  {isEditing ? 'Save Changes' : 'Schedule Exam'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Exam Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Draft Exam"
        message={`Are you sure you want to delete "${selectedExam?.title}"?`}
        confirmText="Delete Exam"
        variant="danger"
        loading={submitting}
      />
    </div>
  )
}
