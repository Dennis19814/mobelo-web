'use client'
import { useEffect } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onBackHome: () => void
  title?: string
  message?: string
  status?: number
}

export default function AppSpecErrorModal({ isOpen, onClose, onBackHome, title, message, status }: Props) {
  useEffect(() => {
    if (!isOpen) return
    const id = setTimeout(() => {
      onBackHome()
    }, 4000)
    return () => clearTimeout(id)
  }, [isOpen, onBackHome])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="p-6">
          <div className="flex items-start">
            <div className="mr-3 mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              {/* Alert icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M12 2.25c.414 0 .75.336.75.75v12a.75.75 0 01-1.5 0v-12c0-.414.336-.75.75-.75zm0 15a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/></svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {title || 'Unable to generate app spec'}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {message || 'Something went wrong while analyzing your idea. Please try again.'}
                {typeof status === 'number' && (
                  <span className="ml-2 text-gray-400">(HTTP {status})</span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-700"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

