'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Upload, Image as ImageIcon, Tags, LayoutGrid, AlertCircle } from 'lucide-react';
import { Category } from '@/types/category';
import { useCategoryForm } from '@/hooks/useLocalCategoryForm';
import { UnifiedAssetPicker } from '@/components/ui/UnifiedAssetPicker';
import { UnifiedAssetData } from '@/lib/unified-asset-loader';
import { CategoryIcon } from '@/components/ui/icons/LocalCategoryIcon';
import { LocalEmoji } from '@/components/ui/emojis/LocalEmoji';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: number;
  category: Category | null;
  parentCategories?: Category[];
  onSuccess: (category: Category) => void;
  onSubmit: (data: any) => Promise<Category | null>;
}

export function EditCategoryModal({
  isOpen,
  onClose,
  appId,
  category,
  parentCategories = [],
  onSuccess,
  onSubmit
}: EditCategoryModalProps) {
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<UnifiedAssetData | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayMode, setDisplayMode] = useState<'image' | 'icon'>('image');
  const [showReplacementWarning, setShowReplacementWarning] = useState(false);

  const {
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
    handleSubmit,
    resetForm
  } = useCategoryForm({
    appId,
    category: category || undefined,
    onSubmit,
    onCancel: onClose,
  });

  // Initialize image preview and display mode from existing category
  useEffect(() => {
    if (category?.imageUrl) {
      setImagePreview(category.imageUrl);
      setDisplayMode('image');
    } else if (category?.iconUrl || category?.emojiUnicode) {
      setImagePreview(null);
      setDisplayMode('icon');
    } else {
      setImagePreview(null);
      setDisplayMode('image'); // Default to image mode
    }
  }, [category?.imageUrl, category?.iconUrl, category?.emojiUnicode]);

  // Auto-hide replacement warning after 5 seconds
  useEffect(() => {
    if (replacementWarning) {
      setShowReplacementWarning(true);
      const timer = setTimeout(() => {
        setShowReplacementWarning(false);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    } else {
      setShowReplacementWarning(false);
    }
  }, [replacementWarning]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit();
    if (result) {
      onSuccess(result);
      // Reset form will use the updated category data from onSuccess
      resetForm();
      // Preserve image preview if category still has an image
      if (result.imageUrl) {
        setImagePreview(result.imageUrl);
      } else if (!imageFile) {
        // Only clear if no new image was uploaded
        setImagePreview(null);
      }
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    setImagePreview(null);
    setDisplayMode('image');
    setShowReplacementWarning(false);
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setImageFile(file);
    setDisplayMode('image'); // Switch to image mode

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChangeImage = () => {
    // Reset the input value so selecting the same file will trigger onChange
    if (fileInputRef.current) {
      const input = fileInputRef.current;
      input.value = '';
      // Trigger click after reset
      setTimeout(() => {
        input.click();
      }, 10);
    }
  };

  const handleModeSwitch = (mode: 'image' | 'icon') => {
    setDisplayMode(mode);
    // Don't clear imageFile or imagePreview when switching tabs
    // They will be cleared by the hook when user actually selects icon/emoji
    // Don't clear icon/emoji fields when switching tabs either
    // They will be cleared by the hook when user actually uploads an image
    
    // If switching to image mode and we have imageFile but no preview, recreate preview
    if (mode === 'image' && imageFile && !imagePreview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
    
    // When switching to icon mode, only restore original category image if:
    // 1. No new file was uploaded AND
    // 2. No icon/emoji has been selected (user hasn't made a choice yet)
    // This prevents showing the image when user has already chosen icon/emoji
    const hasIconOrEmojiSelected = (formData.iconUrl && formData.iconUrl !== 'lucide-react:Folder') || formData.emojiUnicode;
    if (mode === 'icon' && !imageFile && category?.imageUrl && !hasIconOrEmojiSelected) {
      setImagePreview(category.imageUrl);
    } else if (mode === 'icon' && hasIconOrEmojiSelected) {
      // If icon/emoji is selected, ensure image preview is cleared
      setImagePreview(null);
    }
    
    // When switching to image mode, don't clear icon/emoji - let the hook handle it when image is uploaded
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setDisplayMode('icon'); // Switch back to icon mode
    // Only clear preview if it was a newly uploaded file
    // If it's an existing category image, keep it visible
    if (imageFile) {
      // New file was removed, restore original image if it exists
      if (category?.imageUrl) {
        setImagePreview(category.imageUrl);
        setDisplayMode('image');
      } else {
        setImagePreview(null);
      }
    } else {
      // Existing image was removed
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter out the current category and its descendants from parent options
  const availableParentCategories = parentCategories.filter(
    (parentCat) => parentCat.id !== category?.id && parentCat.parentId !== category?.id
  );

  if (!isOpen || !category) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  Edit Category 
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
          </div>

          {/* Replacement Warning - Sticky at top */}
          {showReplacementWarning && replacementWarning && (
            <div className="sticky top-[45px] z-10 px-3 py-2 animate-in slide-in-from-top duration-300">
              <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-sm px-3 py-2 flex items-center gap-2">
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs text-amber-800 flex-1">{replacementWarning}</p>
                <button
                  onClick={() => setShowReplacementWarning(false)}
                  className="flex-shrink-0 p-0.5 hover:bg-amber-100 rounded transition-colors"
                  aria-label="Close warning"
                >
                  <X className="w-3.5 h-3.5 text-amber-600" />
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
            {/* General Error */}
            {errors._general && (
              <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm px-3 py-2 flex items-center gap-2">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-xs text-red-800 flex-1">{errors._general}</p>
              </div>
            )}

            {/* Parent Category */}
            {availableParentCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category *
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFieldValue('parentId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No parent (top level)</option>
                  {availableParentCategories.map((parentCategory) => (
                    <option key={parentCategory.id} value={parentCategory.id}>
                      {parentCategory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFieldValue('name', e.target.value)}
                className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter category name"
                   maxLength={30}
              />
              {errors.name && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFieldValue('description', e.target.value)}
                rows={2}
                className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter category description"
              />
              {errors.description && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.description}</span>
                </div>
              )}
            </div>

            {/* Display Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Display *
              </label>
              <p className="text-xs text-gray-500 mb-2">Choose one: Upload image OR select icon/emoji</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('image')}
                  className={`relative flex items-center justify-center space-x-2 p-2.5 border rounded-lg transition-all ${
                    displayMode === 'image'
                      ? 'border-orange-500 bg-orange-50 shadow-sm'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {displayMode === 'image' && (
                    <div className="absolute top-1 right-1">
                      <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <ImageIcon className={`w-4 h-4 ${displayMode === 'image' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${displayMode === 'image' ? 'text-orange-600' : 'text-gray-700'}`}>
                    Upload Image
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('icon')}
                  className={`relative flex items-center justify-center space-x-2 p-2.5 border rounded-lg transition-all ${
                    displayMode === 'icon'
                      ? 'border-orange-500 bg-orange-50 shadow-sm'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {displayMode === 'icon' && (
                    <div className="absolute top-1 right-1">
                      <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <Tags className={`w-4 h-4 ${displayMode === 'icon' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${displayMode === 'icon' ? 'text-orange-600' : 'text-gray-700'}`}>
                    Icon/Emoji
                  </span>
                </button>
              </div>
            </div>

            {/* Image Upload Section */}
            {displayMode === 'image' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Upload Your Image 
                </label>
                {/* File input - always rendered so it's available for "Change image" */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {!imagePreview ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-white transition-colors bg-white"
                    >
                      <Upload className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">Click to upload</span>
                      <span className="text-xs text-gray-500">• Max 5MB</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="w-24 h-24 object-cover rounded-lg border-2 border-orange-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span className="truncate">{imageFile ? imageFile.name : 'Current image'}</span>
                      {imageFile && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>{(imageFile.size / 1024).toFixed(1)} KB</span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeImage}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Change image
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Icon/Emoji Selection Section */}
            {displayMode === 'icon' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Icon or Emoji 
                </label>
                {((formData.displayType === 'icon' && formData.iconUrl) || (formData.displayType === 'emoji' && formData.emojiUnicode)) ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-center justify-center w-10 h-10 border border-orange-200 rounded-lg bg-white">
                        {formData.displayType === 'icon' && formData.iconUrl ? (
                          <CategoryIcon iconUrl={formData.iconUrl} size={24} />
                        ) : formData.displayType === 'emoji' && formData.emojiUnicode ? (
                          selectedEmoji ? (
                            <LocalEmoji emojiData={selectedEmoji} size={24} />
                          ) : (
                            <span className="text-2xl">{String.fromCodePoint(parseInt(formData.emojiUnicode, 16))}</span>
                          )
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {formData.displayType === 'icon' 
                            ? (selectedIcon?.name || formData.iconName || 'Icon selected')
                            : (selectedEmoji?.name || formData.emojiShortcode || 'Emoji selected')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formData.displayType === 'icon' ? 'Icon' : 'Emoji'} selected
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsIconPickerOpen(true)}
                      className="w-full px-3 py-1.5 text-sm font-medium text-orange-600 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Change Selection
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-white transition-colors bg-white"
                  >
                    <Tags className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Click to select</span>
                    <span className="text-xs text-gray-500">• Browse library</span>
                  </button>
                )}

                {errors.iconName && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.iconName}</span>
                  </div>
                )}
              </div>
            )}


            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFieldValue('isActive', e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active category (visible to customers)
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unified Asset Picker Modal */}
      <UnifiedAssetPicker
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(asset) => {
          if (asset.type === 'icon') {
            // Convert to icon format expected by form
            setSelectedIcon({
              name: asset.name,
              library: asset.libraryKey,
              libraryKey: asset.libraryKey,
              filePath: asset.filePath,
              title: asset.title,
              description: asset.description || '',
              keywords: asset.keywords,
              category: asset.category,
              license: asset.license || '',
              website: asset.website || '',
              optimized: asset.optimized || false
            });
            setSelectedAsset(asset);
            setDisplayMode('icon'); // Ensure we're in icon mode
            // Clear image preview when icon is selected (hook will clear imageFile)
            // This ensures the backend image is not displayed after icon selection
            setImagePreview(null);
            // Also clear imageUrl in formData to signal backend to remove the image
            // The hook's handleSubmit will handle sending icon data instead of preserving image
          } else if (asset.type === 'emoji') {
            // Convert to emoji format expected by form
            setSelectedEmoji({
              name: asset.name,
              unicode: asset.unicode || '',
              shortcode: asset.shortcode || '',
              category: asset.category,
              subcategory: '',
              keywords: asset.keywords || [],
              tags: [],
              version: '',
              source: asset.library || '',
              sourceKey: asset.libraryKey || '',
              license: asset.license || '',
              website: asset.website || '',
              filePath: asset.filePath || '',
              optimized: asset.optimized || false
            });
            setSelectedAsset(asset);
            setDisplayMode('icon'); // Ensure we're in icon mode
            // Clear image preview when emoji is selected (hook will clear imageFile)
            // This ensures the backend image is not displayed after emoji selection
            setImagePreview(null);
            // The hook's handleSubmit will handle sending emoji data instead of preserving image
          }
          setIsIconPickerOpen(false);
        }}
        selectedAsset={selectedAsset}
        title="Select Category Icon or Emoji"
      />
    </>
  );
}