/**
 * Confirmation Modal Component
 * Reusable confirmation dialog with customizable content and actions
 */

'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import { AlertTriangle } from 'lucide-react'
import { ConfirmationModalProps } from '@/types/shared-props'

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isDestructive
                ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'text-white bg-orange-600 hover:bg-orange-700 focus:ring-blue-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}