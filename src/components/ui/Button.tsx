/**
 * Button Component
 * Reusable button component with consistent styling and variants
 */

import React from 'react'
import { cn } from '@/lib/utils'
import type { ButtonVariant, ButtonSize } from '@/types'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-blue-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
  info: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-blue-400',
  light: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300',
  dark: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-700',
  outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-lg',
        'border border-transparent transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        
        // Variant styles
        buttonVariants[variant],
        
        // Size styles
        buttonSizes[size],
        
        // Full width
        fullWidth && 'w-full',
        
        // Disabled state
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        
        // Custom className
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="mr-2 flex-shrink-0">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="ml-2 flex-shrink-0">{icon}</span>
          )}
        </>
      )}
    </button>
  )
}