import { logger } from '@/lib/logger'
/**
 * Global error handling utilities
 * Provides consistent error handling across the application
 */

export interface AppError {
  message: string
  code?: string
  cause?: unknown
}

export class ApplicationError extends Error {
  public readonly code?: string
  public readonly cause?: unknown

  constructor(message: string, code?: string, cause?: unknown) {
    super(message)
    this.name = 'ApplicationError'
    this.code = code
    this.cause = cause
  }
}

export function handleError(error: unknown, context?: string): AppError {
  logger.error(`Error in ${context || 'unknown context'}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
  
  if (error instanceof ApplicationError) {
    return {
      message: error.message,
      code: error.code,
      cause: error.cause
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      cause: error
    }
  }

  return {
    message: 'An unknown error occurred',
    cause: error
  }
}

export function isValidElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement
}

export function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}