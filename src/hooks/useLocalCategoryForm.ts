'use client';

import { useState, useCallback, useEffect } from 'react';
import { Category, CreateCategoryData, UpdateCategoryData } from '@/types/category';
import { LocalIconData, getIconKey } from '@/lib/local-icon-loader';
import { LocalEmojiData } from '@/lib/local-emoji-loader';
import { logger } from '@/lib/logger';
import { apiService } from '@/lib/api-service';

interface LocalCategoryFormData {
  name: string;
  description: string;
  iconName: string;
  iconLibrary: string;
  iconUrl: string;
  // Emoji support
  emojiUnicode?: string;
  emojiShortcode?: string;
  emojiSource?: string;
  displayType: 'icon' | 'emoji';
  parentId?: number;
  displayOrder: number;
  isActive: boolean;
}

export interface UseLocalCategoryFormOptions {
  appId: number;
  category?: Category;
  onSubmit?: (data: CreateCategoryData | UpdateCategoryData) => Promise<Category | null>;
  onCancel?: () => void;
}

export interface UseLocalCategoryFormReturn {
  formData: LocalCategoryFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  selectedIcon?: LocalIconData;
  selectedEmoji?: LocalEmojiData;
  imageFile: File | null;
  replacementWarning: string | null;
  setFieldValue: (field: keyof LocalCategoryFormData, value: any) => void;
  setSelectedIcon: (icon: LocalIconData) => void;
  setSelectedEmoji: (emoji: LocalEmojiData) => void;
  setImageFile: (file: File | null) => void;
  validateForm: () => boolean;
  handleSubmit: () => Promise<Category | null>;
  handleCancel: () => void;
  resetForm: () => void;
}

export function useLocalCategoryForm(options: UseLocalCategoryFormOptions): UseLocalCategoryFormReturn {
  const { appId, category, onSubmit, onCancel } = options;

  // Initial form data
  const getInitialFormData = useCallback((): LocalCategoryFormData => {
    // If editing existing category, use its data
    if (category) {
      return {
        name: category.name || '',
        description: category.description || '',
        iconName: category.iconName || '',
        iconLibrary: category.iconLibrary || '',
        iconUrl: category.iconUrl || '',
        // Emoji support
        emojiUnicode: category.emojiUnicode || '',
        emojiShortcode: category.emojiShortcode || '',
        emojiSource: category.emojiSource || '',
        displayType: category.displayType || 'icon',
        parentId: category.parentId,
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive ?? true,
      };
    }
    // For new categories, set default icon so form is valid by default
    return {
      name: '',
      description: '',
      iconName: 'Folder',
      iconLibrary: 'lucide-react',
      iconUrl: 'lucide-react:Folder',
      // Emoji support
      emojiUnicode: '',
      emojiShortcode: '',
      emojiSource: '',
      displayType: 'icon',
      parentId: undefined,
      displayOrder: 0,
      isActive: true,
    };
  }, [category]);

  const [formData, setFormData] = useState<LocalCategoryFormData>(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [imageFile, setImageFileState] = useState<File | null>(null);
  const [replacementWarning, setReplacementWarning] = useState<string | null>(null);

  // Initialize selectedIcon and selectedEmoji based on category data
  const getInitialIcon = useCallback((): LocalIconData | undefined => {
    if (category?.displayType === 'icon' && category?.iconName && category?.iconLibrary) {
      return {
        name: category.iconName,
        library: category.iconLibrary,
        libraryKey: category.iconLibrary,
        filePath: category.iconUrl || '',
        title: category.name,
        description: '',
        keywords: [],
        category: '',
        license: '',
        website: '',
        optimized: false
      };
    }
    // For new categories, set default icon
    if (!category) {
      return {
        name: 'Folder',
        library: 'lucide-react',
        libraryKey: 'lucide-react',
        filePath: '',
        title: 'Folder',
        description: '',
        keywords: [],
        category: '',
        license: '',
        website: '',
        optimized: false
      };
    }
    return undefined;
  }, [category]);

  const getInitialEmoji = useCallback((): LocalEmojiData | undefined => {
    if (category?.displayType === 'emoji' && category?.emojiShortcode) {
      // Construct the proper file path for the emoji
      const emojiSource = category.emojiSource || 'openmoji';
      const fileName = `${category.emojiUnicode}.svg`;
      const filePath = `emojis/${emojiSource}/${fileName}`;

      return {
        name: category.name,
        unicode: category.emojiUnicode || '',
        shortcode: category.emojiShortcode,
        category: '',
        subcategory: '',
        keywords: [],
        tags: [],
        version: '',
        source: emojiSource,
        sourceKey: emojiSource,
        license: '',
        website: '',
        filePath: filePath,
        optimized: false
      };
    }
    return undefined;
  }, [category]);

  const [selectedIcon, setSelectedIconState] = useState<LocalIconData | undefined>(getInitialIcon);
  const [selectedEmoji, setSelectedEmojiState] = useState<LocalEmojiData | undefined>(getInitialEmoji);

  // Reset form when category changes
  useEffect(() => {
    setFormData(getInitialFormData());
    setErrors({});
    setIsSubmitting(false);
    setIsDirty(false);
    setImageFileState(null);
    setSelectedIconState(getInitialIcon());
    setSelectedEmojiState(getInitialEmoji());
  }, [category?.id, getInitialFormData, getInitialIcon, getInitialEmoji]); // Reset when category ID changes

  // Mark form as dirty when imageFile changes (for edit mode)
  useEffect(() => {
    if (imageFile) {
      setIsDirty(true);
    }
  }, [imageFile]);

  // Set field value
  const setFieldValue = useCallback((field: keyof LocalCategoryFormData, value: any) => {
    // Ensure description field can be cleared (empty string)
    const normalizedValue = field === 'description' ? (value || '') : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: normalizedValue,
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
  const setSelectedIcon = useCallback((icon: LocalIconData) => {
    // Check if image exists before clearing
    const hadImage = imageFile !== null || formData.iconUrl?.startsWith('http');

    if (hadImage) {
      setReplacementWarning('Selecting an icon will replace the currently uploaded image.');
    } else {
      setReplacementWarning(null);
    }

    setSelectedIconState(icon);
    setSelectedEmojiState(undefined); // Clear emoji when icon is selected
    setImageFileState(null); // Clear image file when icon is selected

    // Use the actual filePath from metadata instead of constructing it
    const iconUrl = icon.filePath;

    setFormData(prev => ({
      ...prev,
      iconName: icon.name,
      iconLibrary: icon.libraryKey,
      iconUrl: iconUrl,
      displayType: 'icon',
      // Clear emoji fields
      emojiUnicode: '',
      emojiShortcode: '',
      emojiSource: '',
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
  }, [imageFile, formData.iconUrl]);

  // Set selected emoji and update form data
  const setSelectedEmoji = useCallback((emoji: LocalEmojiData) => {
    // Check if image exists before clearing
    const hadImage = imageFile !== null || formData.iconUrl?.startsWith('http');

    if (hadImage) {
      setReplacementWarning('Selecting an emoji will replace the currently uploaded image.');
    } else {
      setReplacementWarning(null);
    }

    setSelectedEmojiState(emoji);
    setSelectedIconState(undefined); // Clear icon when emoji is selected
    setImageFileState(null); // Clear image file when emoji is selected

    // Use source or sourceKey depending on what's available
    const emojiSource = emoji.source || emoji.sourceKey || 'default';

    setFormData(prev => ({
      ...prev,
      displayType: 'emoji',
      emojiUnicode: emoji.unicode,
      emojiShortcode: emoji.shortcode,
      emojiSource: emojiSource,
      // Clear icon fields (but keep them for backup)
      iconName: prev.iconName || '',
      iconLibrary: prev.iconLibrary || '',
      iconUrl: prev.iconUrl || '',
    }));

    setIsDirty(true);

    // Clear emoji-related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.iconName;
      delete newErrors.iconLibrary;
      delete newErrors.iconUrl;
      return newErrors;
    });
  }, [imageFile, formData.iconUrl]);

  // Set image file and mark form as dirty
  const setImageFile = useCallback((file: File | null) => {
    setImageFileState(file);
    if (file) {
      // Clear icon/emoji when image is selected
      const hadIconOrEmoji = selectedIcon || selectedEmoji || formData.iconUrl || formData.emojiUnicode;

      if (hadIconOrEmoji) {
        setReplacementWarning('Uploading an image will replace the currently selected icon or emoji.');
      } else {
        setReplacementWarning(null);
      }

      setSelectedIconState(undefined);
      setSelectedEmojiState(undefined);

      setFormData(prev => ({
        ...prev,
        displayType: 'icon', // Will be updated to image on backend
        iconName: '',
        iconLibrary: '',
        iconUrl: '',
        emojiUnicode: '',
        emojiShortcode: '',
        emojiSource: '',
      }));

      setIsDirty(true);
    } else {
      setReplacementWarning(null);
    }
  }, [selectedIcon, selectedEmoji, formData.iconUrl, formData.emojiUnicode]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Category name must be 100 characters or less';
    }

    // Validate icon/emoji selection - either icon/emoji OR image is required
    // Skip icon/emoji validation if an image file is uploaded OR if category already has an image
    const hasImage = imageFile || category?.imageUrl;
    if (!hasImage) {
      if (formData.displayType === 'icon') {
        if (!formData.iconName) {
          newErrors.iconName = 'Category icon is required';
        }
        if (!formData.iconLibrary) {
          newErrors.iconLibrary = 'Icon library is required';
        }
        if (!formData.iconUrl) {
          newErrors.iconUrl = 'Icon URL is required';
        }
      } else if (formData.displayType === 'emoji') {
        if (!formData.emojiUnicode) {
          newErrors.iconName = 'Category emoji is required'; // Use iconName error for UI consistency
        }
        if (!formData.emojiShortcode) {
          newErrors.iconLibrary = 'Emoji shortcode is required';
        }
        if (!formData.emojiSource) {
          newErrors.iconUrl = 'Emoji source is required';
        }
      } else {
        newErrors.iconName = 'Please select either an icon or emoji for the category';
      }
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
  }, [formData, imageFile, category]);

  // Handle form submission
  const handleSubmit = useCallback(async (): Promise<Category | null> => {
    if (!onSubmit) {
      logger.warn('No onSubmit handler provided for category form');
      return null;
    }

    // Validate form first
    if (!validateForm()) {
      return null;
    }

    setIsSubmitting(true);

    try {
      let submitData: CreateCategoryData | UpdateCategoryData;

      console.log('[UPLOAD-DEBUG-1] Starting form submission', {
        categoryId: category?.id,
        hasImageFile: !!imageFile,
        imageFileName: imageFile?.name,
        imageFileSize: imageFile?.size,
        formDataDisplayType: formData.displayType,
        formDataIconUrl: formData.iconUrl,
        formDataImageUrl: category?.imageUrl
      });

      if (category) {
        // Update existing category - only include changed fields
        submitData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };

        // Handle icon/emoji/image logic
        if (imageFile) {
          // New image file is being uploaded - don't include icon/emoji data
          // Image will be uploaded separately after category update
        } else if (category.imageUrl) {
          // Existing image exists and no new image - preserve the image
          // Don't send icon/emoji data to avoid overwriting the image
          // The backend should preserve the existing imageUrl
        } else {
          // No image exists - include icon/emoji data
          submitData.iconName = formData.iconName;
          submitData.iconLibrary = formData.iconLibrary;
          submitData.iconUrl = formData.iconUrl;
          submitData.emojiUnicode = formData.emojiUnicode;
          submitData.emojiShortcode = formData.emojiShortcode;
          submitData.emojiSource = formData.emojiSource;
          submitData.displayType = formData.displayType;

          // Set metadata with full icon/emoji URL for external app access
          const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';

          // Determine the URL to use based on display type
          let fullAssetUrl = '';
          if (formData.displayType === 'emoji' && selectedEmoji?.filePath) {
            fullAssetUrl = selectedEmoji.filePath.startsWith('http')
              ? selectedEmoji.filePath
              : `${baseUrl}/${selectedEmoji.filePath}`;
          } else if (formData.iconUrl) {
            fullAssetUrl = formData.iconUrl.startsWith('http')
              ? formData.iconUrl
              : `${baseUrl}${formData.iconUrl}`;
          }

          submitData.metadata = {
            iconUrl: fullAssetUrl,
            displayType: formData.displayType
          };
        }

        // Only include parentId if it has changed
        // Don't send parentId at all if it hasn't changed to avoid hierarchy recalculation
        if (formData.parentId !== category.parentId) {
          submitData.parentId = formData.parentId;
        }
      } else {
        // Create new category
        submitData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          appId,
          parentId: formData.parentId,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };

        // Only include icon/emoji data if no image file is being uploaded
        if (!imageFile) {
          submitData.iconName = formData.iconName;
          submitData.iconLibrary = formData.iconLibrary;
          submitData.iconUrl = formData.iconUrl;
          submitData.emojiUnicode = formData.emojiUnicode;
          submitData.emojiShortcode = formData.emojiShortcode;
          submitData.emojiSource = formData.emojiSource;
          submitData.displayType = formData.displayType;

          // Set metadata with full icon/emoji URL for external app access
          const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';

          // Determine the URL to use based on display type
          let fullAssetUrl = '';
          if (formData.displayType === 'emoji' && selectedEmoji?.filePath) {
            fullAssetUrl = selectedEmoji.filePath.startsWith('http')
              ? selectedEmoji.filePath
              : `${baseUrl}/${selectedEmoji.filePath}`;
          } else if (formData.iconUrl) {
            fullAssetUrl = formData.iconUrl.startsWith('http')
              ? formData.iconUrl
              : `${baseUrl}${formData.iconUrl}`;
          }

          submitData.metadata = {
            iconUrl: fullAssetUrl,
            displayType: formData.displayType
          };
        }
        // When image is uploaded, don't include icon/emoji fields at all
      }

      console.log('[UPLOAD-DEBUG-2] Calling onSubmit with data', {
        submitData,
        hasImageFile: !!imageFile
      });

      const result = await onSubmit(submitData);

      console.log('[UPLOAD-DEBUG-3] onSubmit returned result', {
        resultId: result?.id,
        resultIconUrl: result?.iconUrl,
        resultImageUrl: result?.imageUrl,
        resultDisplayType: result?.displayType
      });

      if (result) {
        setIsDirty(false);

        // Upload image if provided
        if (imageFile && result.id) {
          try {
            console.log('[UPLOAD-DEBUG-4] Starting image upload', {
              categoryId: result.id,
              fileName: imageFile.name,
              fileSize: imageFile.size,
              fileType: imageFile.type,
              appId
            });

            logger.info('Uploading category image', { categoryId: result.id, fileName: imageFile.name });
            const uploadResponse = await apiService.uploadCategoryImage(result.id, imageFile, appId);

            console.log('[UPLOAD-DEBUG-5] Upload API response', {
              ok: uploadResponse.ok,
              status: uploadResponse.status,
              hasData: !!uploadResponse.data,
              dataIconUrl: uploadResponse.data?.iconUrl,
              dataImageUrl: uploadResponse.data?.imageUrl,
              dataDisplayType: uploadResponse.data?.displayType
            });

            if (uploadResponse.ok && uploadResponse.data) {
              logger.info('Category image uploaded successfully', {
                categoryId: result.id,
                iconUrl: uploadResponse.data.iconUrl,
                imageUrl: uploadResponse.data.imageUrl,
                displayType: uploadResponse.data.displayType
              });
              console.log('[UPLOAD-DEBUG-6] Image upload succeeded - full category data:', {
                id: uploadResponse.data.id,
                name: uploadResponse.data.name,
                iconUrl: uploadResponse.data.iconUrl,
                iconName: uploadResponse.data.iconName,
                iconLibrary: uploadResponse.data.iconLibrary,
                imageUrl: uploadResponse.data.imageUrl,
                displayType: uploadResponse.data.displayType,
                emojiUnicode: uploadResponse.data.emojiUnicode
              });
              // Return the updated category with the new image URL
              return uploadResponse.data;
            } else {
              console.log('[UPLOAD-DEBUG-7] Image upload FAILED', {
                status: uploadResponse.status,
                data: uploadResponse.data
              });
              logger.error('Image upload failed', { categoryId: result.id, status: uploadResponse.status });
              // Return the original category - image upload failed but category was created/updated
              setErrors(prev => ({
                ...prev,
                _general: 'Category saved but image upload failed. Please try uploading the image again.',
              }));
              // Return result even if image upload failed - category was still created/updated
              return result;
            }
          } catch (uploadError) {
            console.log('[UPLOAD-DEBUG-8] Image upload EXCEPTION', {
              error: uploadError instanceof Error ? uploadError.message : uploadError,
              errorStack: uploadError instanceof Error ? uploadError.stack : undefined
            });
            logger.error('Error uploading category image', {
              error: uploadError instanceof Error ? uploadError.message : uploadError,
              categoryId: result.id
            });
            // Category was created/updated successfully, but image upload failed
            setErrors(prev => ({
              ...prev,
              _general: 'Category saved but image upload failed. Please try uploading the image again.',
            }));
            // Return result even if image upload failed - category was still created/updated
            return result;
          }
        }

        // No image to upload, return the original result
        return result;
      }

      return null;
    } catch (error) {
      logger.error('Category form submission failed', {
        error: error instanceof Error ? error.message : error
      });

      // Set general error
      setErrors(prev => ({
        ...prev,
        _general: error instanceof Error ? error.message : 'An error occurred while saving',
      }));

      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, appId, category, onSubmit, validateForm, imageFile]);

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
    setImageFileState(null);
    setSelectedIconState(getInitialIcon());
    setSelectedEmojiState(getInitialEmoji());
  }, [getInitialFormData, getInitialIcon, getInitialEmoji]);

  return {
    formData,
    errors,
    isSubmitting,
    isDirty,
    selectedIcon,
    selectedEmoji,
    imageFile,
    replacementWarning,
    setFieldValue,
    setSelectedIcon,
    setSelectedEmoji,
    setImageFile,
    validateForm,
    handleSubmit,
    handleCancel,
    resetForm,
  };
}

// Backward compatibility: export the same hook name but with local icon support
export const useCategoryForm = useLocalCategoryForm;