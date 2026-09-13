import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Award, CheckCircle2, XCircle, Clock, ArrowLeft, Trophy,
  HelpCircle, ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { resultsAPI } from '../../services/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

export default function StudentResultPage() {
  const { attemptId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadResult()
  }, [attemptId])

  const loadResult = async () => {
    try {
      setLoading(true)
      const res = await resultsAPI.get(attemptId)
      setData(res.data)
    } catch (err) {
      toast.error('Failed to load examination results')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 mt-3">Computing verified evaluation results...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Result report not found.</p>
        <Link to="/student/dashboard" className="text-blue-600 font-semibold text-sm mt-3 inline-block">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const { result } = data
  const passed = result?.passed

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Header back button */}
      <button
        onClick={() => navigate('/student/dashboard')}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
      </button>

      {/* Main Score Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center relative overflow-hidden">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
          passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>

        <Badge variant={passed ? 'success' : 'danger'}>
          {passed ? 'PASSED EXAMINATION' : 'NEEDS IMPROVEMENT'}
        </Badge>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{data.exam_title}</h1>
        <p className="text-xs text-gray-500">{data.exam_subject} • Submitted on {new Date(data.submitted_at).toLocaleString()}</p>

        {/* Circular / Hero percentage display */}
        <div className="my-6">
          <span className={`text-5xl sm:text-6xl font-black ${
            passed ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {result?.percentage}%
          </span>
          <p className="text-sm font-semibold text-gray-700 mt-1">
            Total Score: {result?.total_marks} / {result?.max_marks} Points
          </p>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl text-center text-xs">
          <div>
            <p className="text-gray-500 font-medium">Correct Answers</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">✓ {result?.correct_count}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Incorrect Answers</p>
            <p className="text-lg font-bold text-rose-600 mt-0.5">✗ {result?.incorrect_count}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Unanswered</p>
            <p className="text-lg font-bold text-gray-600 mt-0.5">— {result?.unanswered_count}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Accuracy</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{result?.accuracy}%</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            Time Taken: {Math.floor(result?.time_taken_seconds / 60)}m {result?.time_taken_seconds % 60}s
          </span>
          {data.leaderboard_enabled && (
            <Link
              to={`/student/leaderboard/${data.exam_id}`}
              className="font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5" /> View Leaderboard
            </Link>
          )}
        </div>
      </div>

      {/* Detailed Question Review (If enabled by teacher) */}
      {data.show_correct_answers && data.answer_review ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Question Paper Review</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review correct options and solution explanations for self-assessment
            </p>
          </div>

          <div className="space-y-4 divide-y divide-gray-100">
            {data.answer_review.map((item, index) => (
              <div key={item.question_id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-bold text-gray-500 mr-2">Q{index + 1}.</span>
                    {item.question_text}
                  </p>
                  <span className="text-xs font-bold whitespace-nowrap">
                    {item.is_correct ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ Correct (+{item.marks || 1})
                      </span>
                    ) : item.selected_option ? (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        ✗ Incorrect
                      </span>
                    ) : (
                      <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        — Skipped
                      </span>
                    )}
                  </span>
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const text = item.options[letter]
                    const isCandidateChoice = item.selected_option === letter
                    const isCorrect = item.correct_option === letter

                    let borderClass = 'border-gray-200 bg-white'
                    if (isCorrect) {
                      borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                    } else if (isCandidateChoice && !isCorrect) {
                      borderClass = 'border-rose-400 bg-rose-50 text-rose-900'
                    }

                    return (
                      <div
                        key={letter}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${borderClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{letter}.</span>
                          <span>{text}</span>
                        </div>
                        {isCandidateChoice && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            Your Choice
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                {data.show_explanations && item.explanation && (
                  <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl text-xs text-blue-900 space-y-0.5">
                    <p className="font-semibold flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Explanation / Solution:
                    </p>
                    <p>{item.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-xs text-gray-500">
          Individual question-by-question review has been restricted by the examination invigilator.
        </div>
      )}
    </div>
  )
}
