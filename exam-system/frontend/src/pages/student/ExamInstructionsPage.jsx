import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ShieldAlert, Clock, ClipboardList, Award, AlertTriangle,
  CheckSquare, ArrowLeft, PlayCircle, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentExamsAPI } from '../../services/api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

export default function ExamInstructionsPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    loadInstructions()
  }, [examId])

  const loadInstructions = async () => {
    try {
      setLoading(true)
      const res = await studentExamsAPI.instructions(examId)
      setExam(res.data)
      if (res.data.already_attempted && res.data.attempt_status !== 'in_progress') {
        toast('You have already completed this exam', { icon: 'ℹ️' })
        navigate(`/student/results/${res.data.attempt_id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load exam instructions')
      navigate('/student/exams')
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = async () => {
    if (!agreed) {
      toast.error('Please accept the examination rules and guidelines to continue')
      return
    }
    try {
      setStarting(true)
      const res = await studentExamsAPI.start(examId)
      // Save attempt id into session storage for ExamPage to retrieve
      sessionStorage.setItem(`exam_attempt_${examId}`, res.data.attempt_id)
      toast.success(res.data.resumed ? 'Resuming active exam session' : 'Unique question paper generated!')
      navigate(`/student/exam/${examId}/take`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to initialize exam session')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 mt-3">Verifying eligibility & time window...</p>
      </div>
    )
  }

  if (!exam) return null

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <button
        onClick={() => navigate('/student/exams')}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Exams
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {exam.subject}
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Ready to Begin
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">{exam.title}</h1>
        {exam.description && (
          <p className="text-sm text-gray-600 mt-2">{exam.description}</p>
        )}

        {/* Specs Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 bg-gray-50 p-4 rounded-xl text-center">
          <div>
            <p className="text-xs text-gray-500 font-medium">Duration</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{exam.duration_minutes} Mins</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Questions</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{exam.total_questions}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Marking Scheme</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">
              +{exam.marks_per_question} / -{exam.negative_marking}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Max Score</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{exam.max_marks} pts</p>
          </div>
        </div>
      </div>

      {/* Rules & Guidelines */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          Examination Instructions & Code of Conduct
        </h2>

        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
              1
            </span>
            <span>
              <strong>Smart Paper Generation:</strong> When you press start, the server compiles an individualized question paper with randomized options. Once generated, your paper is locked to your attempt.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
              2
            </span>
            <span>
              <strong>Automated Real-Time Answer Saving:</strong> Every response you select is immediately transmitted and saved to the backend database. You can refresh or recover from connection drops safely.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
              3
            </span>
            <span>
              <strong>Server-Side Timer Enforcement:</strong> A countdown runs on the interface. When the duration reaches 00:00, the system automatically seals and submits your examination paper.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
              4
            </span>
            <span>
              <strong>Anti-Cheat Integrity Monitor:</strong> Tab switching, moving window focus, or exiting full-screen triggers security warnings. Reaching <strong>{exam.max_violations} warnings</strong> will cause automatic submission and flag your attempt for the invigilator.
            </span>
          </li>
        </ul>

        {/* Disclaimer Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Anti-Cheat Notice:
          </p>
          <p>
            Browser-based controls offer integrity monitoring. Please close background applications, messaging windows, and external monitors before beginning.
          </p>
        </div>

        {/* Agreement Checkbox */}
        <div className="pt-4 border-t border-gray-100">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded mt-0.5 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">
              I have read and understood all examination rules. I agree to uphold academic honesty and commence the assessment.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => navigate('/student/exams')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={PlayCircle}
            onClick={handleStartExam}
            loading={starting}
            disabled={!agreed}
            size="lg"
          >
            I Agree & Start Examination
          </Button>
        </div>
      </div>
    </div>
  )
}
