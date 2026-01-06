/**
 * Modal Component
 * Reusable modal component with backdrop and animations
 */

'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Package, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModalProps } from '@/types'

interface ExtendedModalProps extends ModalProps {
  children: React.ReactNode
  overlay?: boolean
  closeOnEscape?: boolean
  closeOnOverlayClick?: boolean
  position?: 'center' | 'top'
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  children,
  overlay = true,
  closeOnEscape = true,
  closeOnOverlayClick = false,
  position = 'center',
  className = ''
}: ExtendedModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Scroll to center the modal when it opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        modalRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        })
      }, 50)
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalSizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  const modalContent = (
    <div
      ref={modalRef}
      className={cn(
        'fixed inset-0 z-50 flex justify-center items-center',
        overlay && 'bg-black bg-opacity-50'
      )}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl w-full',
          'transform transition-all duration-200',
          'animate-in fade-in-0 zoom-in-95',
          'm-4 max-h-[calc(100vh-2rem)] flex flex-col',
          'overflow-hidden',
          modalSizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
         <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Package className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
        )}

        {/* Content */}
        <div className="px-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )

  // Render modal using portal to ensure it's rendered at document body level
  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null
}