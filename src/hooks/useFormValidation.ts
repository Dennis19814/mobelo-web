import { useState, useCallback, useMemo } from 'react';

export type ValidationRule<T = any> = {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  email?: boolean | string;
  url?: boolean | string;
  custom?: (value: T) => string | true;
};

export type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type ValidationErrors<T extends Record<string, any>> = {
  [K in keyof T]?: string;
};

export interface UseFormValidationReturn<T extends Record<string, any>> {
  errors: ValidationErrors<T>;
  isValid: boolean;
  validate: (data: T) => boolean;
  validateField: (field: keyof T, value: any) => string | undefined;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  setFieldError: (field: keyof T, error: string) => void;
}

export function useFormValidation<T extends Record<string, any>>(
  schema: ValidationSchema<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<ValidationErrors<T>>({});

  const validateValue = useCallback(
    (field: keyof T, value: any, rules: ValidationRule): string | undefined => {
      // Required validation
      if (rules.required) {
        const isEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          return typeof rules.required === 'string' ? rules.required : `${String(field)} is required`;
        }
      }

      // Skip other validations if value is empty and not required
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      // Email validation
      if (rules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return typeof rules.email === 'string' ? rules.email : 'Invalid email address';
        }
      }

      // URL validation
      if (rules.url) {
        try {
          new URL(String(value));
        } catch {
          return typeof rules.url === 'string' ? rules.url : 'Invalid URL';
        }
      }

      // Pattern validation
      if (rules.pattern) {
        const pattern = typeof rules.pattern === 'object' && 'value' in rules.pattern ? rules.pattern.value : rules.pattern;
        const message = typeof rules.pattern === 'object' && 'message' in rules.pattern ? rules.pattern.message : `${String(field)} format is invalid`;
        if (!pattern.test(String(value))) {
          return message;
        }
      }

      // String length validations
      if (typeof value === 'string') {
        if (rules.minLength) {
          const minLength = typeof rules.minLength === 'object' ? rules.minLength.value : rules.minLength;
          const message =
            typeof rules.minLength === 'object'
              ? rules.minLength.message
              : `${String(field)} must be at least ${minLength} characters`;
          if (value.length < minLength) {
            return message;
          }
        }

        if (rules.maxLength) {
          const maxLength = typeof rules.maxLength === 'object' ? rules.maxLength.value : rules.maxLength;
          const message =
            typeof rules.maxLength === 'object'
              ? rules.maxLength.message
              : `${String(field)} must be at most ${maxLength} characters`;
          if (value.length > maxLength) {
            return message;
          }
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rules.min !== undefined) {
          const min = typeof rules.min === 'object' ? rules.min.value : rules.min;
          const message =
            typeof rules.min === 'object' ? rules.min.message : `${String(field)} must be at least ${min}`;
          if (value < min) {
            return message;
          }
        }

        if (rules.max !== undefined) {
          const max = typeof rules.max === 'object' ? rules.max.value : rules.max;
          const message =
            typeof rules.max === 'object' ? rules.max.message : `${String(field)} must be at most ${max}`;
          if (value > max) {
            return message;
          }
        }
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value);
        if (result !== true) {
          return result;
        }
      }

      return undefined;
    },
    []
  );

  const validateField = useCallback(
    (field: keyof T, value: any): string | undefined => {
      const rules = schema[field];
      if (!rules) return undefined;

      return validateValue(field, value, rules);
    },
    [schema, validateValue]
  );

  const validate = useCallback(
    (data: T): boolean => {
      const newErrors: ValidationErrors<T> = {};
      let hasErrors = false;

      for (const field in schema) {
        const error = validateField(field, data[field]);
        if (error) {
          newErrors[field] = error;
          hasErrors = true;
        }
      }

      setErrors(newErrors);
      return !hasErrors;
    },
    [schema, validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    errors,
    isValid,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}
