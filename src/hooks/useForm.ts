/**
 * Simplified Form Hook
 * Replaces complex form logic with focused, reusable utilities
 */

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface FormField<T = any> {
  value: T;
  error?: string;
  required?: boolean;
  validator?: (value: T) => string | undefined;
}

export interface FormState<T = Record<string, any>> {
  data: T;
  errors: Record<keyof T, string>;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface UseFormOptions<T> {
  initialData: T;
  onSubmit?: (data: T) => Promise<any>;
  validators?: Partial<Record<keyof T, (value: any) => string | undefined>>;
}

export interface UseFormReturn<T> {
  formState: FormState<T>;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  validate: () => boolean;
  handleSubmit: () => Promise<any>;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialData, onSubmit, validators = {} } = options;

  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({} as Record<keyof T, string>);
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;

    // Run validators
    (Object.entries(validators) as Array<[keyof T, ((value: any) => string | undefined) | undefined]>).forEach(([field, validator]) => {
      if (validator) {
        const error = validator(data[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data, validators]);

  const handleSubmit = useCallback(async () => {
    if (!onSubmit) {
      logger.warn('No onSubmit handler provided for form');
      return null;
    }

    if (!validate()) {
      return null;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit(data);
      setIsDirty(false);
      return result;
    } catch (error) {
      logger.error('Form submission failed', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [data, onSubmit, validate]);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({} as Record<keyof T, string>);
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialData]);

  return {
    formState: {
      data,
      errors,
      isDirty,
      isSubmitting,
    },
    setValue,
    setError,
    clearErrors,
    validate,
    handleSubmit,
    reset,
  };
}