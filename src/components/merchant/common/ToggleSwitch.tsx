'use client';

import { InputHTMLAttributes } from 'react';

interface ToggleSwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'h-4 w-4',
    label: 'text-xs',
    description: 'text-xs',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'h-5 w-5',
    label: 'text-sm',
    description: 'text-xs',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'h-6 w-6',
    label: 'text-base',
    description: 'text-sm',
  },
};

export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
}: ToggleSwitchProps) {
  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label className={`${sizes.label} font-medium text-gray-700`}>
              {label}
            </label>
          )}
          {description && (
            <p className={`${sizes.description} text-gray-500`}>
              {description}
            </p>
          )}
        </div>
      )}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`${sizes.track} bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full ${sizes.thumb} after:transition-all peer-checked:bg-orange-600 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
      </label>
    </div>
  );
}
