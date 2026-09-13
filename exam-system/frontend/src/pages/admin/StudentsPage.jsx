import React, { useState, useEffect } from 'react'
import {
  Users, Plus, Upload, Search, Filter, Edit2, Trash2,
  CheckCircle2, XCircle, FileSpreadsheet, Award, Download, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentsAPI } from '../../services/api'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [perfModalOpen, setPerfModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Current selections
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [performanceData, setPerformanceData] = useState(null)
  const [perfLoading, setPerfLoading] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    reg_number: '',
    name: '',
    email: '',
    password: '',
    student_class: '',
    section: '',
    roll_number: '',
    phone: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // File import state
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)

  const limit = 15

  useEffect(() => {
    fetchStudents()
  }, [page, search, classFilter, sectionFilter, statusFilter])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = {
        skip: (page - 1) * limit,
        limit,
        search: search || undefined,
        class: classFilter || undefined,
        section: sectionFilter || undefined,
        is_active: statusFilter !== '' ? statusFilter === 'true' : undefined
      }
      const res = await studentsAPI.list(params)
      setStudents(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    if (!formData.reg_number || !formData.name || !formData.password) {
      toast.error('Please fill required fields (Reg No, Name, Password)')
      return
    }
    try {
      setSubmitting(true)
      await studentsAPI.create(formData)
      toast.success('Student added successfully')
      setCreateModalOpen(false)
      resetForm()
      fetchStudents()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStudent = async (e) => {
    e.preventDefault()
    if (!selectedStudent) return
    try {
      setSubmitting(true)
      await studentsAPI.update(selectedStudent.id, formData)
      toast.success('Student updated successfully')
      setEditModalOpen(false)
      fetchStudents()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (student) => {
    try {
      await studentsAPI.toggle(student.id)
      toast.success(`Student ${student.is_active ? 'disabled' : 'enabled'}`)
      fetchStudents()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!selectedStudent) return
    try {
      setSubmitting(true)
      await studentsAPI.delete(selectedStudent.id)
      toast.success('Student deleted')
      setDeleteDialogOpen(false)
      fetchStudents()
    } catch (err) {
      toast.error('Failed to delete student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewPerformance = async (student) => {
    setSelectedStudent(student)
    setPerfModalOpen(true)
    setPerfLoading(true)
    try {
      const res = await studentsAPI.performance(student.id)
      setPerformanceData(res.data)
    } catch (err) {
      toast.error('Failed to load student performance')
    } finally {
      setPerfLoading(false)
    }
  }

  const handleImportSubmit = async (e) => {
    e.preventDefault()
    if (!importFile) {
      toast.error('Please select a CSV or Excel file')
      return
    }
    const form = new FormData()
    form.append('file', importFile)
    try {
      setImporting(true)
      const res = await studentsAPI.import(form)
      setImportResult(res.data)
      toast.success(`Imported ${res.data.success_count} students`)
      fetchStudents()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const downloadErrorReport = () => {
    if (!importResult?.errors?.length) return
    const csvContent =
      'data:text/csv;charset=utf-8,Row,Reg Number,Reason\n' +
      importResult.errors
        .map((e) => `${e.row},${e.reg_number || ''},"${e.reason || ''}"`)
        .join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'student_import_errors.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetForm = () => {
    setFormData({
      reg_number: '',
      name: '',
      email: '',
      password: '',
      student_class: '',
      section: '',
      roll_number: '',
      phone: ''
    })
  }

  const openEdit = (s) => {
    setSelectedStudent(s)
    setFormData({
      reg_number: s.reg_number,
      name: s.name,
      email: s.email || '',
      password: '',
      student_class: s.student_class || '',
      section: s.section || '',
      roll_number: s.roll_number || '',
      phone: s.phone || ''
    })
    setEditModalOpen(true)
  }

  const columns = [
    {
      key: 'reg_number',
      header: 'Reg Number',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {row.reg_number}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Student Name',
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.email || 'No email'}</p>
        </div>
      )
    },
    {
      key: 'class',
      header: 'Class / Sec',
      render: (_, row) => (
        <span className="text-xs text-gray-600">
          {row.student_class ? `Class ${row.student_class}` : '—'}
          {row.section ? ` (${row.section})` : ''}
          {row.roll_number ? ` • Roll ${row.roll_number}` : ''}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Active' : 'Disabled'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewPerformance(row)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            title="View Performance"
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
            onClick={() => handleToggleStatus(row)}
            className={`p-1.5 rounded-lg ${
              row.is_active
                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
            }`}
            title={row.is_active ? 'Disable account' : 'Enable account'}
          >
            {row.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setSelectedStudent(row)
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
          <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage enrolled candidates, credentials, and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={Upload}
            onClick={() => {
              setImportResult(null)
              setImportFile(null)
              setImportModalOpen(true)
            }}
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              resetForm()
              setCreateModalOpen(true)
            }}
          >
            Add Student
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
            placeholder="Search by name, registration number, email..."
          />
        </div>
        <div className="w-full md:w-36">
          <Select
            placeholder="All Classes"
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All Classes' },
              { value: '10', label: 'Class 10' },
              { value: '11', label: 'Class 11' },
              { value: '12', label: 'Class 12' }
            ]}
          />
        </div>
        <div className="w-full md:w-32">
          <Select
            placeholder="Section"
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All Secs' },
              { value: 'A', label: 'Sec A' },
              { value: 'B', label: 'Sec B' },
              { value: 'C', label: 'Sec C' }
            ]}
          />
        </div>
        <div className="w-full md:w-36">
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Disabled' }
            ]}
          />
        </div>
      </div>

      {/* Table & Pagination */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table columns={columns} data={students} loading={loading} emptyMessage="No students found" />
        <Pagination
          page={page}
          totalPages={Math.ceil(total / limit) || 1}
          total={total}
          perPage={limit}
          onPageChange={setPage}
        />
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Student"
        size="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              required
              placeholder="e.g. STU101"
              value={formData.reg_number}
              onChange={(e) => setFormData({ ...formData, reg_number: e.target.value })}
            />
            <Input
              label="Full Name"
              required
              placeholder="Student full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="student@school.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Password / PIN"
              required
              type="password"
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="Class / Standard"
              placeholder="e.g. 12"
              value={formData.student_class}
              onChange={(e) => setFormData({ ...formData, student_class: e.target.value })}
            />
            <Input
              label="Section"
              placeholder="e.g. A"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            />
            <Input
              label="Roll Number"
              placeholder="e.g. 24"
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Student Details"
        size="lg"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              disabled
              value={formData.reg_number}
            />
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Reset Password (leave empty to keep current)"
              type="password"
              placeholder="New password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="Class / Standard"
              value={formData.student_class}
              onChange={(e) => setFormData({ ...formData, student_class: e.target.value })}
            />
            <Input
              label="Section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            />
            <Input
              label="Roll Number"
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV / Excel Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Students from CSV / Excel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Required Columns in file:</p>
            <p className="font-mono">registration_number, name, password</p>
            <p className="font-semibold pt-1">Optional Columns:</p>
            <p className="font-mono">email, class, section, roll_number, phone</p>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-400 mt-2">Upload a .csv or .xlsx file</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setImportModalOpen(false)} type="button">
                Close
              </Button>
              <Button variant="primary" type="submit" loading={importing} disabled={!importFile}>
                Upload & Process
              </Button>
            </div>
          </form>

          {/* Import Result Summary */}
          {importResult && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-semibold">
                  ✓ Successfully Imported: {importResult.success_count}
                </span>
                {importResult.failed_count > 0 && (
                  <span className="text-red-600 font-semibold">
                    ✗ Failed: {importResult.failed_count}
                  </span>
                )}
              </div>

              {importResult.errors?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Failed Records:</span>
                    <button
                      onClick={downloadErrorReport}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Error Report
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded-lg text-xs space-y-1 font-mono">
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-red-600">
                        Row {err.row}: {err.reg_number ? `[${err.reg_number}] ` : ''}{err.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Performance Modal */}
      <Modal
        isOpen={perfModalOpen}
        onClose={() => setPerfModalOpen(false)}
        title={selectedStudent ? `${selectedStudent.name}'s Academic Performance` : 'Performance'}
        size="lg"
      >
        {perfLoading ? (
          <div className="py-12 text-center">
            <Spinner />
          </div>
        ) : performanceData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <p className="text-xs text-blue-600 font-medium">Exams Taken</p>
                <p className="text-xl font-bold text-blue-900">{performanceData.total_exams}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl text-center">
                <p className="text-xs text-green-600 font-medium">Average Score</p>
                <p className="text-xl font-bold text-green-900">{performanceData.avg_score}%</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl text-center">
                <p className="text-xs text-purple-600 font-medium">Reg Number</p>
                <p className="text-xl font-mono font-bold text-purple-900">{performanceData.reg_number}</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Examination History</h4>
              {performanceData.history?.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {performanceData.history.map((h, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-800">{h.exam_title}</p>
                        <p className="text-xs text-gray-500">
                          {h.subject} • {h.submitted_at ? new Date(h.submitted_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="font-bold text-gray-900">{h.percentage}%</span>
                        <Badge variant={h.passed ? 'success' : 'danger'}>
                          {h.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-6 text-center">No exams taken yet</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete ${selectedStudent?.name} (${selectedStudent?.reg_number})? This will also remove their exam attempts.`}
        confirmText="Delete"
        variant="danger"
        loading={submitting}
      />
    </div>
  )
}
