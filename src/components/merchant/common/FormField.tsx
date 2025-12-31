'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type BaseFieldProps = {
  label?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
};

type InputFieldProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement> & {
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel';
  showPasswordToggle?: boolean;
};

type TextAreaFieldProps = BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & {
  rows?: number;
};

type SelectFieldProps = BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement> & {
  options?: Array<{ value: string | number; label: string }>;
  children?: ReactNode;
};

export function InputField({
  label,
  required,
  error,
  helpText,
  className = '',
  type = 'text',
  showPasswordToggle = false,
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle && type === 'password'
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${showPasswordToggle && type === 'password' ? 'pr-10' : ''}`}
          {...props}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {helpText && !error && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  required,
  error,
  helpText,
  className = '',
  rows = 3,
  ...props
}: TextAreaFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {helpText && !error && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
}

export function SelectField({
  label,
  required,
  error,
  helpText,
  className = '',
  options,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {helpText && !error && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
}

// Composite export for backward compatibility
export const FormField = {
  Input: InputField,
  TextArea: TextAreaField,
  Select: SelectField,
};
