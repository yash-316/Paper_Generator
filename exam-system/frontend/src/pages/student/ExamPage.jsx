import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { attemptsAPI } from '../../services/api'

// ─── Timer hook ──────────────────────────────────────────────────────────────
function useExamTimer(initialSeconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const ref = useRef(null)

  useEffect(() => {
    if (initialSeconds <= 0) { onExpire?.(); return }
    setTimeLeft(initialSeconds)
    ref.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(ref.current)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [initialSeconds])

  const fmt = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  return {
    timeLeft,
    formattedTime: fmt(timeLeft),
    isWarning: timeLeft < 300,
    isCritical: timeLeft < 60,
    isExpired: timeLeft <= 0,
  }
}

// ─── Anti-cheat hook ─────────────────────────────────────────────────────────
function useAntiCheat(maxViolations, onViolation, onAutoSubmit) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)

  const addViolation = useCallback((type) => {
    countRef.current += 1
    setCount(countRef.current)
    onViolation?.(type, countRef.current)
    if (countRef.current >= maxViolations) onAutoSubmit?.()
  }, [maxViolations, onViolation, onAutoSubmit])

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) addViolation('tab_switch') }
    const onBlur = () => addViolation('window_blur')
    const onFS = () => { if (!document.fullscreenElement) addViolation('fullscreen_exit') }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFS)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFS)
    }
  }, [addViolation])

  return { violationCount: count }
}

// ─── Network hook ─────────────────────────────────────────────────────────────
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); setShowRestored(true); setTimeout(() => setShowRestored(false), 3000) }
    const onOffline = () => { setIsOnline(false); setShowRestored(false) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  return { isOnline, showRestored }
}

// ─── Main Exam Page ────────────────────────────────────────────────────────────
export default function ExamPage() {
  const { examId } = useParams()
  const navigate = useNavigate()

  const [attemptId, setAttemptId] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [paper, setPaper] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: { selected, marked } }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const autoSaveRef = useRef(null)
  const initialized = useRef(false)

  // Get attempt_id from sessionStorage (set by instructions page)
  useEffect(() => {
    const stored = sessionStorage.getItem(`exam_attempt_${examId}`)
    if (!stored) { navigate(`/student/exam/${examId}/instructions`); return }
    setAttemptId(parseInt(stored))
  }, [examId])

  // Load attempt data
  useEffect(() => {
    if (!attemptId) return
    loadAttempt()
  }, [attemptId])

  const loadAttempt = async () => {
    try {
      const { data } = await attemptsAPI.get(attemptId)
      if (data.status === 'submitted' || data.status === 'timed_out') {
        navigate(`/student/results/${attemptId}`)
        return
      }
      setAttempt(data)
      setPaper(data.paper || [])
      // Restore saved answers
      const savedAnswers = {}
      for (const q of data.paper || []) {
        savedAnswers[q.question_id] = {
          selected: q.selected_option || null,
          marked: q.is_marked_review || false,
        }
      }
      setAnswers(savedAnswers)
    } catch (e) {
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  // Auto-save every 30s
  useEffect(() => {
    if (!attemptId) return
    autoSaveRef.current = setInterval(() => bulkSave(), 30000)
    return () => clearInterval(autoSaveRef.current)
  }, [attemptId, answers])

  // Save on page focus restore
  useEffect(() => {
    const onVisibility = () => { if (!document.hidden && attemptId) bulkSave() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [attemptId, answers])

  // Prevent accidental navigation
  useEffect(() => {
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const bulkSave = async () => {
    if (!attemptId) return
    const payload = Object.entries(answers).map(([qId, ans]) => ({
      question_id: parseInt(qId),
      selected_option: ans.selected,
      is_marked_review: ans.marked,
    }))
    try {
      await attemptsAPI.saveBulk(attemptId, { answers: payload })
    } catch (e) { /* silent */ }
  }

  const saveAnswer = async (questionId, selected, marked) => {
    const newAnswers = { ...answers, [questionId]: { selected, marked } }
    setAnswers(newAnswers)
    setSavingId(questionId)
    try {
      await attemptsAPI.saveAnswer(attemptId, {
        question_id: questionId,
        selected_option: selected,
        is_marked_review: marked,
      })
    } catch (e) { /* silent */ }
    finally { setTimeout(() => setSavingId(null), 800) }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setShowSubmitConfirm(false)
    try {
      await bulkSave()
      const { data } = await attemptsAPI.submit(attemptId)
      toast.success('Exam submitted!')
      navigate(`/student/results/${attemptId}`)
    } catch (e) {
      toast.error('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Anti-cheat handlers
  const maxViolations = attempt?.max_violations || 3
  const { violationCount } = useAntiCheat(
    maxViolations,
    async (type, count) => {
      toast.error(`⚠️ Warning ${count}/${maxViolations}: You switched away from the exam.`, { duration: 5000 })
      try {
        const { data } = await attemptsAPI.reportViolation(attemptId, type)
        if (data.auto_submitted) {
          toast.error('Auto-submitted due to violations!', { duration: 8000 })
          navigate(`/student/results/${attemptId}`)
        }
      } catch (e) {}
    },
    () => {
      toast.error('Auto-submitted due to repeated violations!', { duration: 8000 })
      handleSubmit()
    }
  )

  const { isOnline, showRestored } = useNetworkStatus()

  const { formattedTime, isWarning, isCritical } = useExamTimer(
    attempt?.time_remaining_seconds || 0,
    () => {
      toast.error('Time is up! Auto-submitting...', { duration: 5000 })
      handleSubmit()
    }
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading exam paper...</p>
        </div>
      </div>
    )
  }

  if (!paper.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-xl font-semibold">No questions found</p>
        </div>
      </div>
    )
  }

  const currentQ = paper[currentIdx]
  const currentAns = answers[currentQ.question_id] || { selected: null, marked: false }

  const getQuestionStatus = (idx) => {
    const q = paper[idx]
    const ans = answers[q.question_id] || {}
    if (idx === currentIdx) return 'current'
    if (ans.marked) return 'marked'
    if (ans.selected) return 'answered'
    return 'unanswered'
  }

  const statusColors = {
    current: 'bg-blue-600 text-white ring-2 ring-blue-300',
    answered: 'bg-green-500 text-white',
    marked: 'bg-yellow-400 text-white',
    unanswered: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  }

  const answeredCount = Object.values(answers).filter(a => a.selected).length
  const markedCount = Object.values(answers).filter(a => a.marked).length
  const unansweredCount = paper.length - answeredCount

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Connection banners */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-medium">
          ⚠️ Connection Lost — Your answers have been saved. Trying to reconnect...
        </div>
      )}
      {showRestored && (
        <div className="bg-green-500 text-white text-center py-2 text-sm font-medium">
          ✓ Connection Restored
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight">{attempt?.exam_title}</h1>
          <p className="text-sm text-gray-500">{attempt?.exam_subject}</p>
        </div>
        <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-xl ${
          isCritical ? 'bg-red-500 text-white animate-pulse' :
          isWarning ? 'bg-orange-100 text-orange-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          ⏱ {formattedTime}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main question area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* Question header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                Question {currentIdx + 1} of {paper.length}
              </span>
              {savingId === currentQ.question_id && (
                <span className="text-xs text-green-600 font-medium">Saving...</span>
              )}
            </div>

            {/* Question card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <p className="text-gray-900 text-lg leading-relaxed mb-6">{currentQ.question_text}</p>

              {/* Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(letter => {
                  const text = currentQ.options[letter]
                  const isSelected = currentAns.selected === letter
                  return (
                    <button
                      key={letter}
                      onClick={() => saveAnswer(currentQ.question_id, letter, currentAns.marked)}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                        isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'
                      }`}>
                        {letter}
                      </span>
                      <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>{text}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => saveAnswer(currentQ.question_id, currentAns.marked ? null : currentAns.selected, !currentAns.marked)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  currentAns.marked
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {currentAns.marked ? '⭐ Marked for Review' : '☆ Mark for Review'}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentIdx(Math.min(paper.length - 1, currentIdx + 1))}
                  disabled={currentIdx === paper.length - 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right sidebar — Question navigator */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Navigator</h3>

          {/* Grid */}
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {paper.map((_, idx) => {
              const status = getQuestionStatus(idx)
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded-lg text-xs font-semibold transition-all ${statusColors[status]}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 mb-4 text-xs">
            {[
              { color: 'bg-green-500', label: `Answered (${answeredCount})` },
              { color: 'bg-yellow-400', label: `Marked for Review (${markedCount})` },
              { color: 'bg-gray-100 border border-gray-300', label: `Not Answered (${unansweredCount})` },
              { color: 'bg-blue-600', label: 'Current' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color}`} />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          {violationCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-red-700">
                ⚠️ Violations: {violationCount}/{maxViolations}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 mt-auto"
          >
            {submitting ? 'Submitting...' : '🏁 Submit Exam'}
          </button>
        </aside>
      </div>

      {/* Mobile submit button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
        <button
          onClick={() => setShowSubmitConfirm(true)}
          className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl text-sm"
        >
          🏁 Submit Exam
        </button>
      </div>

      {/* Submit confirmation dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Exam?</h3>
            <p className="text-gray-600 mb-4 text-sm">
              You have answered <strong className="text-green-600">{answeredCount}</strong> questions.{' '}
              <strong className="text-red-500">{unansweredCount}</strong> are unanswered.
              {markedCount > 0 && <> <strong className="text-yellow-600">{markedCount}</strong> marked for review.</>}
            </p>
            <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg mb-5">
              ⚠️ Once submitted, you cannot return to this exam.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
