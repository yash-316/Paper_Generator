import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileText, Download, Search, Filter, Eye, CheckCircle2,
  XCircle, Clock, Award, FileSpreadsheet, FileDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { resultsAPI, examsAPI } from '../../services/api'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'
import Spinner from '../../components/ui/Spinner'

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialExamId = searchParams.get('exam_id') || ''

  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState(initialExamId)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [passedFilter, setPassedFilter] = useState('')

  // Answer Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedAttemptId, setSelectedAttemptId] = useState(null)
  const [reviewData, setReviewData] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  const limit = 15

  useEffect(() => {
    loadExamsList()
  }, [])

  useEffect(() => {
    fetchResults()
  }, [page, selectedExamId, search, passedFilter])

  const loadExamsList = async () => {
    try {
      const res = await examsAPI.list({ limit: 100 })
      setExams(res.data.items || [])
    } catch (e) {}
  }

  const fetchResults = async () => {
    try {
      setLoading(true)
      const params = {
        skip: (page - 1) * limit,
        limit,
        exam_id: selectedExamId ? parseInt(selectedExamId) : undefined,
        search: search || undefined,
        passed: passedFilter !== '' ? passedFilter === 'true' : undefined
      }
      const res = await resultsAPI.adminList(params)
      setResults(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'export-toast' })
      const res = await resultsAPI.export({
        exam_id: selectedExamId ? parseInt(selectedExamId) : undefined,
        format
      })

      // Trigger file download
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `exam_results_${format}.${format === 'excel' ? 'xlsx' : format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`${format.toUpperCase()} downloaded successfully`, { id: 'export-toast' })
    } catch (err) {
      toast.error('Export failed', { id: 'export-toast' })
    }
  }

  const handleOpenReview = async (attemptId) => {
    setSelectedAttemptId(attemptId)
    setReviewModalOpen(true)
    setReviewLoading(true)
    try {
      const res = await resultsAPI.get(attemptId)
      setReviewData(res.data)
    } catch (err) {
      toast.error('Failed to load candidate submission details')
    } finally {
      setReviewLoading(false)
    }
  }

  const columns = [
    {
      key: 'reg_number',
      header: 'Reg No',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {row.reg_number}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Candidate Name',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{row.student_name}</p>
          <p className="text-xs text-gray-500">{row.exam_title}</p>
        </div>
      )
    },
    {
      key: 'score',
      header: 'Score / Max',
      render: (_, row) => (
        <div>
          <p className="text-sm font-bold text-gray-900">
            {row.total_marks} / {row.max_marks}
          </p>
          <p className="text-xs text-blue-600 font-semibold">{row.percentage}%</p>
        </div>
      )
    },
    {
      key: 'stats',
      header: 'Breakdown',
      render: (_, row) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 font-medium" title="Correct">
            ✓ {row.correct_count}
          </span>
          <span className="text-rose-600 font-medium" title="Incorrect">
            ✗ {row.incorrect_count}
          </span>
          <span className="text-gray-400 font-medium" title="Unanswered">
            — {row.unanswered_count}
          </span>
        </div>
      )
    },
    {
      key: 'time',
      header: 'Time Taken',
      render: (_, row) => (
        <span className="text-xs text-gray-600">
          {Math.floor(row.time_taken_seconds / 60)}m {row.time_taken_seconds % 60}s
        </span>
      )
    },
    {
      key: 'status',
      header: 'Result',
      render: (_, row) => (
        <Badge variant={row.passed ? 'success' : 'danger'}>
          {row.passed ? 'PASS' : 'FAIL'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'View',
      render: (_, row) => (
        <button
          onClick={() => handleOpenReview(row.attempt_id)}
          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
          title="Inspect Answers"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examination Results</h1>
          <p className="text-sm text-gray-500 mt-1">Audit, export, and review candidate performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleExport('csv')} icon={Download}>
            CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport('excel')} icon={FileSpreadsheet}>
            Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport('pdf')} icon={FileDown}>
            PDF
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val)
              setPage(1)
            }}
            placeholder="Search candidate name or registration number..."
          />
        </div>
        <div className="w-full md:w-60">
          <Select
            placeholder="Filter by Exam"
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All Examinations' },
              ...exams.map((e) => ({ value: String(e.id), label: e.title }))
            ]}
          />
        </div>
        <div className="w-full md:w-36">
          <Select
            placeholder="Outcome"
            value={passedFilter}
            onChange={(e) => {
              setPassedFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All Outcomes' },
              { value: 'true', label: 'Passed Only' },
              { value: 'false', label: 'Failed Only' }
            ]}
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table columns={columns} data={results} loading={loading} emptyMessage="No submission records found" />
        <Pagination
          page={page}
          totalPages={Math.ceil(total / limit) || 1}
          total={total}
          perPage={limit}
          onPageChange={setPage}
        />
      </div>

      {/* Candidate Answer Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewData ? `${reviewData.student_name} (${reviewData.reg_number}) — Review` : 'Candidate Review'}
        size="xl"
      >
        {reviewLoading ? (
          <div className="py-12 text-center">
            <Spinner />
          </div>
        ) : reviewData ? (
          <div className="space-y-4">
            {/* Score pill header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl text-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Final Score</p>
                <p className="text-lg font-bold text-gray-900">
                  {reviewData.result?.total_marks} / {reviewData.result?.max_marks}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Percentage</p>
                <p className="text-lg font-bold text-blue-600">{reviewData.result?.percentage}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Accuracy</p>
                <p className="text-lg font-bold text-emerald-600">{reviewData.result?.accuracy}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Outcome</p>
                <Badge variant={reviewData.result?.passed ? 'success' : 'danger'}>
                  {reviewData.result?.passed ? 'PASSED' : 'FAILED'}
                </Badge>
              </div>
            </div>

            {/* Answer Item List */}
            {reviewData.answer_review ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {reviewData.answer_review.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      item.is_correct
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : item.selected_option
                        ? 'border-rose-200 bg-rose-50/40'
                        : 'border-gray-200 bg-gray-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">
                        Q{idx + 1}. {item.question_text}
                      </p>
                      <span className="font-bold">
                        {item.is_correct ? (
                          <span className="text-emerald-700">✓ Correct</span>
                        ) : item.selected_option ? (
                          <span className="text-rose-700">✗ Incorrect</span>
                        ) : (
                          <span className="text-gray-400">— Unanswered</span>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        Candidate Answer:{' '}
                        <strong className={item.is_correct ? 'text-emerald-700' : 'text-rose-700'}>
                          {item.selected_option ? `Option ${item.selected_option}` : 'None'}
                        </strong>
                      </div>
                      <div>
                        Correct Answer:{' '}
                        <strong className="text-emerald-700">Option {item.correct_option}</strong>
                      </div>
                    </div>

                    {item.explanation && (
                      <p className="text-gray-600 bg-white p-2 rounded border border-gray-100 mt-1">
                        <strong>Solution:</strong> {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">
                Question review is restricted per examination settings.
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
