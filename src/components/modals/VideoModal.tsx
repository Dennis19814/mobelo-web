'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
}

export default function VideoModal({
  isOpen,
  onClose,
  videoUrl = 'https://player.vimeo.com/video/76979871?autoplay=1'
}: VideoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Scroll to top when modal opens
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Focus on close button after a short delay to allow scroll
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-black rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden">
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close video"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Video Container - Responsive 16:9 aspect ratio */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={videoUrl}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Demo Video"
          />
        </div>
      </div>
    </div>
  )
}
