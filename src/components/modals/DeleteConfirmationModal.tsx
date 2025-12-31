'use client'
import { logger } from '@/lib/logger'

import { useState } from 'react'
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title?: string
  message?: string
  itemName?: string
  itemType?: string
  confirmButtonText?: string
  cancelButtonText?: string
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemType = 'item',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel'
}: DeleteConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      logger.error('Error during delete confirmation:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  const defaultTitle = `Delete ${itemType}`
  const defaultMessage = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {title || defaultTitle}
          </h2>
          <p className="text-gray-600 text-sm">
            {message || defaultMessage}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}