'use client'
import { logger } from '@/lib/logger'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Star, Smile } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import type { Review } from '@/types/product.types'
import { StarRating } from '@/components/ui/StarRating'
import { SimpleEmojiPicker } from '@/components/ui/emojis/SimpleEmojiPicker'
import type { SimpleEmojiData } from '@/lib/simple-emoji-loader'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  review: Review | null
  productName: string
  apiKey?: string
  appSecretKey?: string
  onResponseAdded?: (reviewId: number, response: string) => void
  position?: { x: number; y: number } | null
}

export default function ReviewModal({
  isOpen,
  onClose,
  review,
  productName,
  apiKey,
  appSecretKey,
  onResponseAdded,
  position
}: ReviewModalProps) {
  const [merchantResponse, setMerchantResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({})

  // Calculate modal position based on click location
  useEffect(() => {
    if (isOpen && position) {
      const modalWidth = 672 // max-w-2xl is 672px
      const modalHeight = window.innerHeight * 0.8 // max-h-[80vh]
      const padding = 20

      // Get current scroll position
      const scrollY = window.scrollY

      // Calculate initial position (center horizontally from click, below click point)
      let left = position.x - modalWidth / 2
      let top = position.y - scrollY + 20 // Position below click with some offset

      // Ensure modal stays within viewport horizontally
      if (left < padding) {
        left = padding
      } else if (left + modalWidth > window.innerWidth - padding) {
        left = window.innerWidth - modalWidth - padding
      }

      // Ensure modal stays within viewport vertically
      if (top < padding) {
        top = padding
      } else if (top + modalHeight > window.innerHeight - padding) {
        // If modal would go off bottom, position it above the click point
        top = Math.max(padding, position.y - scrollY - modalHeight - 20)
      }

      // If still doesn't fit, center it vertically in viewport
      if (top < padding || top + modalHeight > window.innerHeight - padding) {
        top = (window.innerHeight - modalHeight) / 2
      }

      setModalStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        maxWidth: '672px',
        width: 'calc(100vw - 40px)',
        maxHeight: '80vh',
        zIndex: 50
      })
    } else {
      // Default centered position if no position provided
      setModalStyle({})
    }
  }, [isOpen, position])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current scroll position and prevent scrolling
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !review) return null

  const handleSubmitResponse = async () => {
    if (!merchantResponse.trim()) return

    try {
      setSubmitting(true)
      setError(null)
      
      const response = await apiService.addMerchantResponse(
        review.productId,
        review.id,
        { response: merchantResponse.trim() }
      )
      
      if (response.ok) {
        onResponseAdded?.(review.id, merchantResponse.trim())
        setMerchantResponse('')
        onClose()
      } else {
        throw new Error('Failed to submit response')
      }
    } catch (error) {
      logger.error('Error submitting merchant response:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      setError('Failed to submit response. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setMerchantResponse('')
    setError(null)
    setShowEmojiPicker(false)
    onClose()
  }

  const handleEmojiSelect = (emoji: SimpleEmojiData) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = merchantResponse
    const beforeText = currentText.substring(0, start)
    const afterText = currentText.substring(end)

    // Get the emoji unicode character
    const emojiChar = String.fromCodePoint(parseInt(emoji.unicode.replace('U+', ''), 16))
    const newText = beforeText + emojiChar + afterText

    setMerchantResponse(newText)
    setShowEmojiPicker(false)

    // Focus back to textarea and set cursor position after emoji
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + emojiChar.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />
      {!position ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-lg flex flex-col max-w-2xl w-full max-h-[80vh] z-50"
          >
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Review Details</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Product: {productName}</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Review Content */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {review.mobileUser?.firstName} {review.mobileUser?.lastName}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <StarRating rating={review.rating} size="sm" showNumber={false} showCount={false} />
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {review.title && (
                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                )}
                
                {review.description && (
                  <p className="text-gray-600 mb-4">{review.description}</p>
                )}
                
                {review.helpfulCount > 0 && (
                  <div className="text-sm text-gray-500">
                    {review.helpfulCount} {review.helpfulCount === 1 ? 'person found' : 'people found'} this helpful
                  </div>
                )}
              </div>

              {/* Existing Merchant Response */}
              {review.merchantResponse && (
                <div className="bg-orange-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-slate-900">Your Response</span>
                    <span className="text-sm text-orange-600 ml-2">
                      {review.merchantResponseAt && new Date(review.merchantResponseAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-blue-800">{review.merchantResponse}</p>
                </div>
              )}

              {/* Add/Update Response Form */}
              {!review.merchantResponse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Merchant Response
                  </label>
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={merchantResponse}
                      onChange={(e) => setMerchantResponse(e.target.value)}
                      placeholder="Write a professional response to this review..."
                      rows={4}
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={submitting}
                    />
                    <div className="flex justify-between items-end mt-2">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 transition-colors rounded-lg ${
                          showEmojiPicker
                            ? 'text-orange-600 bg-orange-50'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        disabled={submitting}
                        title="Add emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!merchantResponse.trim() || submitting}
                      className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Submit Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={modalRef}
          className="bg-white rounded-lg flex flex-col max-w-2xl w-full max-h-[80vh] z-50"
          style={modalStyle}
        >
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Review Details</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Product: {productName}</p>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {/* Review Content */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {review.mobileUser?.firstName} {review.mobileUser?.lastName}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <StarRating rating={review.rating} size="sm" showNumber={false} showCount={false} />
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {review.title && (
                <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
              )}
              
              {review.description && (
                <p className="text-gray-600 mb-4">{review.description}</p>
              )}
              
              {review.helpfulCount > 0 && (
                <div className="text-sm text-gray-500">
                  {review.helpfulCount} {review.helpfulCount === 1 ? 'person found' : 'people found'} this helpful
                </div>
              )}
            </div>

            {/* Existing Merchant Response */}
            {review.merchantResponse && (
              <div className="bg-orange-50 p-4 rounded-lg mb-6">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-slate-900">Your Response</span>
                  <span className="text-sm text-orange-600 ml-2">
                    {review.merchantResponseAt && new Date(review.merchantResponseAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-blue-800">{review.merchantResponse}</p>
              </div>
            )}

            {/* Add/Update Response Form */}
            {!review.merchantResponse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Merchant Response
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={merchantResponse}
                    onChange={(e) => setMerchantResponse(e.target.value)}
                    placeholder="Write a professional response to this review..."
                    rows={4}
                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={submitting}
                  />
                  <div className="flex justify-between items-end mt-2">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 transition-colors rounded-lg ${
                        showEmojiPicker
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      disabled={submitting}
                      title="Add emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitResponse}
                    disabled={!merchantResponse.trim() || submitting}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Response
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji Picker Modal */}
      <SimpleEmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
        embedded={false}
        title="Add Emoji"
      />
    </>
  )
}