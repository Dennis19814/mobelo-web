'use client'
import React, { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { AlertTriangle } from 'lucide-react'

interface DeleteAppModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  appName: string
}

export default function DeleteAppModal({
  isOpen,
  onClose,
  onConfirm,
  appName
}: DeleteAppModalProps) {
  const [confirmationText, setConfirmationText] = useState('')

  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationText('')
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (confirmationText === appName) {
      onConfirm()
      onClose()
    }
  }

  const isConfirmDisabled = confirmationText !== appName

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Delete Mobile App?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to permanently delete this app? This action cannot be undone. All app data including products, orders, and settings will be lost.
        </p>

        {/* Confirmation Input */}
        <div className="mb-6 text-left">
          <label htmlFor="app-name-confirm" className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="font-semibold text-gray-900">{appName}</span> to confirm
          </label>
          <input
            id="app-name-confirm"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Enter app name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isConfirmDisabled
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            }`}
          >
            Delete App
          </button>
        </div>
      </div>
    </Modal>
  )
}
