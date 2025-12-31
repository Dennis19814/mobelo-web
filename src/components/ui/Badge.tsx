/**
 * Badge Component
 * Reusable badge component for status indicators and labels
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
  destructive: 'bg-red-100 text-red-800',
  outline: 'border border-gray-300 text-gray-800 bg-transparent'
}

const badgeSizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 py-1.5 text-sm',
  lg: 'px-3 py-2 text-sm'
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className
}: BadgeProps & { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge