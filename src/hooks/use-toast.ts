import { logger } from '@/lib/logger'
import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({
    title,
    description,
    variant = 'default',
    duration = 5000
  }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)

    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration
    }

    setToasts((prev) => [...prev, newToast])

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)

    // For development, also log to console
    logger.debug(`Toast [${variant}]:`, { title, description })

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return {
    toast,
    dismiss,
    toasts
  }
}