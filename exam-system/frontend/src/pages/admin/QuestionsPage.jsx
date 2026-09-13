import React, { useState, useEffect } from 'react'
import {
  BookOpen, Plus, Upload, Search, Filter, Edit2, Trash2,
  Eye, CheckCircle2, AlertTriangle, Download, HelpCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { questionsAPI } from '../../services/api'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Selected item
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    subject: '',
    chapter: '',
    topic: '',
    difficulty: 'medium',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    marks: 1.0,
    explanation: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Bulk Upload State
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const limit = 15

  useEffect(() => {
    fetchQuestions()
  }, [page, search, subjectFilter, difficultyFilter])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const params = {
        skip: (page - 1) * limit,
        limit,
        search: search || undefined,
        subject: subjectFilter || undefined,
        difficulty: difficultyFilter || undefined
      }
      const res = await questionsAPI.list(params)
      setQuestions(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.question_text || !formData.option_a || !formData.option_b || !formData.subject) {
      toast.error('Please fill required fields (Question, Options, Subject)')
      return
    }
    try {
      setSubmitting(true)
      await questionsAPI.create(formData)
      toast.success('Question added to bank')
      setCreateModalOpen(false)
      resetForm()
      fetchQuestions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create question')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedQuestion) return
    try {
      setSubmitting(true)
      await questionsAPI.update(selectedQuestion.id, formData)
      toast.success('Question updated')
      setEditModalOpen(false)
      fetchQuestions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update question')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedQuestion) return
    try {
      setSubmitting(true)
      await questionsAPI.delete(selectedQuestion.id)
      toast.success('Question removed')
      setDeleteDialogOpen(false)
      fetchQuestions()
    } catch (err) {
      toast.error('Failed to delete question')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadPreview = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      toast.error('Please choose a file')
      return
    }
    const form = new FormData()
    form.append('file', uploadFile)
    try {
      setUploading(true)
      const res = await questionsAPI.upload(form)
      setUploadPreview(res.data)
      toast.success(`Validated ${res.data.success_count} valid questions`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Validation failed')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!uploadPreview?.valid_questions?.length) return
    try {
      setConfirming(true)
      await questionsAPI.confirmUpload({ valid_questions: uploadPreview.valid_questions })
      toast.success(`Imported ${uploadPreview.valid_questions.length} questions!`)
      setUploadModalOpen(false)
      setUploadPreview(null)
      setUploadFile(null)
      fetchQuestions()
    } catch (err) {
      toast.error('Failed to import questions')
    } finally {
      setConfirming(false)
    }
  }

  const downloadErrorReport = () => {
    if (!uploadPreview?.errors?.length) return
    const csvContent =
      'data:text/csv;charset=utf-8,Row,Question,Errors\n' +
      uploadPreview.errors
        .map((e) => `${e.row},"${(e.question || '').replace(/"/g, '""')}","${e.errors.join('; ')}"`)
        .join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'question_upload_errors.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetForm = () => {
    setFormData({
      subject: '',
      chapter: '',
      topic: '',
      difficulty: 'medium',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      marks: 1.0,
      explanation: ''
    })
  }

  const openEdit = (q) => {
    setSelectedQuestion(q)
    setFormData({
      subject: q.subject,
      chapter: q.chapter || '',
      topic: q.topic || '',
      difficulty: q.difficulty,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      marks: q.marks,
      explanation: q.explanation || ''
    })
    setEditModalOpen(true)
  }

  const openPreview = (q) => {
    setSelectedQuestion(q)
    setPreviewModalOpen(true)
  }

  const columns = [
    {
      key: 'question_text',
      header: 'Question',
      render: (_, row) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900 line-clamp-2 text-sm">{row.question_text}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span>{row.subject}</span>
            {row.topic && <span>• {row.topic}</span>}
            <span>• {row.marks} marks</span>
          </div>
        </div>
      )
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (_, row) => {
        const variant =
          row.difficulty === 'easy' ? 'success' : row.difficulty === 'medium' ? 'warning' : 'danger'
        return <Badge variant={variant}>{row.difficulty}</Badge>
      }
    },
    {
      key: 'correct',
      header: 'Ans',
      render: (_, row) => (
        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
          {row.correct_answer}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openPreview(row)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            title="Preview Question"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedQuestion(row)
              setDeleteDialogOpen(true)
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">Create, manage, and batch import assessment questions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={Upload}
            onClick={() => {
              setUploadPreview(null)
              setUploadFile(null)
              setUploadModalOpen(true)
            }}
          >
            Upload CSV/Excel
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              resetForm()
              setCreateModalOpen(true)
            }}
          >
            Add Question
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Search questions by text..."
          />
        </div>
        <div className="w-full md:w-44">
          <Select
            placeholder="All Subjects"
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All Subjects' },
              { value: 'Physics', label: 'Physics' },
              { value: 'Chemistry', label: 'Chemistry' },
              { value: 'Mathematics', label: 'Mathematics' },
              { value: 'Biology', label: 'Biology' }
            ]}
          />
        </div>
        <div className="w-full md:w-36">
          <Select
            placeholder="Difficulty"
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All Levels' },
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' }
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table columns={columns} data={questions} loading={loading} emptyMessage="No questions found in bank" />
        <Pagination
          page={page}
          totalPages={Math.ceil(total / limit) || 1}
          total={total}
          perPage={limit}
          onPageChange={setPage}
        />
      </div>

      {/* Add / Edit Question Form Modal */}
      <Modal
        isOpen={createModalOpen || editModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setEditModalOpen(false)
        }}
        title={createModalOpen ? 'Add Question to Bank' : 'Edit Question'}
        size="xl"
      >
        <form onSubmit={createModalOpen ? handleCreate : handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Subject"
              required
              placeholder="e.g. Physics"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
            <Input
              label="Chapter / Unit"
              placeholder="e.g. Mechanics"
              value={formData.chapter}
              onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
            />
            <Input
              label="Topic"
              placeholder="e.g. Newton Laws"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Statement <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter the complete question..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
            />
          </div>

          {/* 4 Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Option A"
              required
              placeholder="Option A text"
              value={formData.option_a}
              onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
            />
            <Input
              label="Option B"
              required
              placeholder="Option B text"
              value={formData.option_b}
              onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
            />
            <Input
              label="Option C"
              required
              placeholder="Option C text"
              value={formData.option_c}
              onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
            />
            <Input
              label="Option D"
              required
              placeholder="Option D text"
              value={formData.option_d}
              onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Correct Answer"
              required
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              options={[
                { value: 'A', label: 'Option A' },
                { value: 'B', label: 'Option B' },
                { value: 'C', label: 'Option C' },
                { value: 'D', label: 'Option D' }
              ]}
            />
            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' }
              ]}
            />
            <Input
              label="Marks Allocated"
              type="number"
              step="0.5"
              value={formData.marks}
              onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1 })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explanation / Solution (shown to student during review)
            </label>
            <textarea
              rows={2}
              placeholder="Explain why this answer is correct..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => {
                setCreateModalOpen(false)
                setEditModalOpen(false)
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {createModalOpen ? 'Add Question' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Question Preview"
        size="lg"
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="primary">{selectedQuestion.subject}</Badge>
              {selectedQuestion.topic && <Badge variant="secondary">{selectedQuestion.topic}</Badge>}
              <Badge
                variant={
                  selectedQuestion.difficulty === 'easy'
                    ? 'success'
                    : selectedQuestion.difficulty === 'medium'
                    ? 'warning'
                    : 'danger'
                }
              >
                {selectedQuestion.difficulty}
              </Badge>
              <span className="text-xs text-gray-500 ml-auto">{selectedQuestion.marks} marks</span>
            </div>

            <p className="text-base font-medium text-gray-900 bg-gray-50 p-4 rounded-xl">
              {selectedQuestion.question_text}
            </p>

            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map((letter) => {
                const optKey = `option_${letter.toLowerCase()}`
                const isCorrect = selectedQuestion.correct_answer === letter
                return (
                  <div
                    key={letter}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {letter}
                    </span>
                    <span>{selectedQuestion[optKey]}</span>
                    {isCorrect && (
                      <span className="ml-auto text-xs text-emerald-700 font-semibold">
                        ✓ Correct Answer
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {selectedQuestion.explanation && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Explanation:
                </p>
                <p>{selectedQuestion.explanation}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CSV / Excel Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Bulk Question Import (CSV / Excel)"
        size="xl"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Required Columns:</p>
            <p className="font-mono">
              question_text, option_a, option_b, option_c, option_d, correct_answer, subject, difficulty
            </p>
            <p className="font-semibold pt-1">Optional Columns:</p>
            <p className="font-mono">chapter, topic, marks, explanation</p>
          </div>

          <form onSubmit={handleUploadPreview} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-between items-center">
              <a
                href="/sample_questions.csv"
                download
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
              </a>
              <Button variant="primary" type="submit" loading={uploading} disabled={!uploadFile}>
                Step 1: Validate File
              </Button>
            </div>
          </form>

          {/* Validation preview */}
          {uploadPreview && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-600">
                  ✓ Valid questions ready to import: {uploadPreview.success_count}
                </span>
                {uploadPreview.failed_count > 0 && (
                  <span className="text-sm font-semibold text-rose-600">
                    ✗ Invalid rows: {uploadPreview.failed_count}
                  </span>
                )}
              </div>

              {uploadPreview.errors?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Error Details:</span>
                    <button
                      onClick={downloadErrorReport}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Error Report
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto bg-gray-50 p-2 rounded-lg text-xs space-y-1 font-mono">
                    {uploadPreview.errors.map((err, idx) => (
                      <p key={idx} className="text-rose-600">
                        Row {err.row}: {err.errors.join(' | ')}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmImport}
                  loading={confirming}
                  disabled={!uploadPreview.success_count}
                >
                  Step 2: Confirm & Import {uploadPreview.success_count} Questions
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Question"
        message="Are you sure you want to deactivate this question? It will not appear in future examinations."
        confirmText="Delete"
        variant="danger"
        loading={submitting}
      />
    </div>
  )
}
