'use client';
import { logger } from '@/lib/logger'

import { useState, useCallback } from 'react';
import { Category, CreateCategoryData, UpdateCategoryData } from '@/types/category';
import { IconData } from '@/components/ui/icons/icon-registry';

interface CategoryFormData {
  name: string;
  description: string;
  iconName: string;
  iconLibrary: string;
  iconUrl: string;
  displayType: 'icon' | 'emoji';
  parentId?: number;
  displayOrder: number;
  isActive: boolean;
}

export interface UseCategoryFormOptions {
  appId: number;
  category?: Category;
  onSubmit?: (data: CreateCategoryData | UpdateCategoryData) => Promise<Category | null>;
  onCancel?: () => void;
}

export interface UseCategoryFormReturn {
  formData: CategoryFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  selectedIcon?: IconData;
  setFieldValue: (field: keyof CategoryFormData, value: any) => void;
  setSelectedIcon: (icon: IconData) => void;
  validateForm: () => boolean;
  handleSubmit: () => Promise<Category | null>;
  handleCancel: () => void;
  resetForm: () => void;
}

export function useCategoryForm(options: UseCategoryFormOptions): UseCategoryFormReturn {
  const { appId, category, onSubmit, onCancel } = options;

  // Initial form data
  const getInitialFormData = useCallback((): CategoryFormData => ({
    name: category?.name || '',
    description: category?.description || '',
    iconName: category?.iconName || '',
    iconLibrary: category?.iconLibrary || '',
    iconUrl: category?.iconUrl || '',
    displayType: category?.displayType || 'icon',
    parentId: category?.parentId,
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive ?? true,
  }), [category]);

  const [formData, setFormData] = useState<CategoryFormData>(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedIcon, setSelectedIconState] = useState<IconData | undefined>();

  // Set field value
  const setFieldValue = useCallback((field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

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

  // Set selected icon and update form data
  const setSelectedIcon = useCallback((icon: IconData) => {
    setSelectedIconState(icon);

    // Update form data with icon information
    const iconUrl = `${icon.library}:${icon.name}`;

    setFormData(prev => ({
      ...prev,
      iconName: icon.name,
      iconLibrary: icon.library,
      iconUrl: iconUrl,
      displayType: 'icon' as const,
    }));

    setIsDirty(true);

    // Clear icon-related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.iconName;
      delete newErrors.iconLibrary;
      delete newErrors.iconUrl;
      return newErrors;
    });
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Category name must be 100 characters or less';
    }

    if (!formData.iconName) {
      newErrors.iconName = 'Category icon is required';
    }

    if (!formData.iconLibrary) {
      newErrors.iconLibrary = 'Icon library is required';
    }

    if (!formData.iconUrl) {
      newErrors.iconUrl = 'Icon URL is required';
    }

    // Optional validation rules
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (formData.displayOrder < 0) {
      newErrors.displayOrder = 'Display order must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (): Promise<Category | null> => {
    if (!onSubmit) {
      logger.warn('No onSubmit handler provided');
      return null;
    }

    // Validate form first
    if (!validateForm()) {
      return null;
    }

    setIsSubmitting(true);

    try {
      let submitData: CreateCategoryData | UpdateCategoryData;

      if (category) {
        // Update existing category
        submitData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          iconName: formData.iconName,
          iconLibrary: formData.iconLibrary,
          iconUrl: formData.iconUrl,
          displayType: formData.displayType || 'icon',
          parentId: formData.parentId,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };
      } else {
        // Create new category
        submitData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          iconName: formData.iconName,
          iconLibrary: formData.iconLibrary,
          iconUrl: formData.iconUrl,
          displayType: formData.displayType || 'icon',
          appId,
          parentId: formData.parentId,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };
      }

      const result = await onSubmit(submitData);

      if (result) {
        setIsDirty(false);
      }

      return result;
    } catch (error) {
      logger.error('Form submission error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });

      // Set general error
      setErrors(prev => ({
        ...prev,
        _general: error instanceof Error ? error.message : 'An error occurred while saving',
      }));

      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, appId, category, onSubmit, validateForm]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setErrors({});
    setIsSubmitting(false);
    setIsDirty(false);
    setSelectedIconState(undefined);
  }, [getInitialFormData]);

  return {
    formData,
    errors,
    isSubmitting,
    isDirty,
    selectedIcon,
    setFieldValue,
    setSelectedIcon,
    validateForm,
    handleSubmit,
    handleCancel,
    resetForm,
  };
}