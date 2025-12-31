/**
 * Textarea Component
 * Reusable textarea component with consistent styling
 */

import React from 'react'
import { cn } from '@/lib/utils'
import type { FormFieldProps } from '@/types'

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    FormFieldProps {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    error,
    helpText,
    required,
    disabled,
    className,
    id,
    ...props
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              disabled && 'text-gray-400'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            // Base styles
            'w-full px-4 py-2 border border-gray-300 rounded-lg',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors duration-200',
            'placeholder-gray-400 text-sm',
            'resize-vertical min-h-[80px]',

            // Error state
            error && 'border-red-300 focus:ring-red-500',

            // Disabled state
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',

            // Custom className
            className
          )}
          disabled={disabled}
          {...props}
        />

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}

        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
export { Textarea }