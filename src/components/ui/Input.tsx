/**
 * Input Component
 * Reusable input component with consistent styling and validation
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { InputSize, FormFieldProps } from '@/types'

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    FormFieldProps {
  size?: InputSize
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const inputSizes: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-3 text-base'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    size = 'md',
    icon,
    iconPosition = 'left',
    label,
    error,
    helpText,
    required,
    disabled,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              disabled && 'text-gray-400'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{icon}</span>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base styles
              'w-full border border-gray-300 rounded-lg',
              'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-colors duration-200',
              'placeholder-gray-400',
              
              // Size styles
              inputSizes[size],
              
              // Icon padding
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              
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
          
          {icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{icon}</span>
            </div>
          )}
        </div>
        
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

Input.displayName = 'Input'

export default Input