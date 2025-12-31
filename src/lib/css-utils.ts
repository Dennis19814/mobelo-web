/**
 * CSS and styling utilities
 * Provides safe className and style handling
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names safely with Tailwind CSS class merging
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts style object to CSS string
 */
export function styleToString(style: Record<string, string | number | undefined>): string {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${value}`)
    .join('; ')
}

/**
 * Validates and sanitizes CSS class names
 */
export function sanitizeClassName(className: unknown): string {
  if (typeof className !== 'string') return ''
  
  // Remove any potentially harmful characters
  return className
    .replace(/[^a-zA-Z0-9\s\-_:]/g, '')
    .trim()
}

/**
 * Safe style object that prevents undefined values
 */
export function safeStyle(style: Record<string, unknown>): React.CSSProperties {
  const safeStyles: React.CSSProperties = {}
  
  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined && value !== null) {
      // @ts-expect-error - We're safely assigning known style properties
      safeStyles[key as keyof React.CSSProperties] = value
    }
  }
  
  return safeStyles
}

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  xs: '(max-width: 639px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const

/**
 * Common CSS variables for consistent theming
 */
export const cssVars = {
  colors: {
    primary: 'var(--color-primary, #8055f3)',
    primaryHover: 'var(--color-primary-hover, #6d43e8)',
    textPrimary: 'var(--color-text-primary, #1e1e1e)',
    textSecondary: 'var(--color-text-secondary, #6e6e6e)',
    highlightBlue: 'var(--color-highlight-blue, #eef2ff)',
    highlightGreen: 'var(--color-highlight-green, #e9f9f1)',
    highlightPurple: 'var(--color-highlight-purple, #f3ebfd)',
  },
  spacing: {
    xs: 'var(--spacing-xs, 0.25rem)',
    sm: 'var(--spacing-sm, 0.5rem)',
    md: 'var(--spacing-md, 1rem)',
    lg: 'var(--spacing-lg, 1.5rem)',
    xl: 'var(--spacing-xl, 2rem)',
  },
} as const