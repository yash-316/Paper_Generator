import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
        </div>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
      </div>
    </Modal>
  )
}
