'use client';

import { useState, useRef } from 'react';
import { X, Plus, Upload, Image as ImageIcon, Tags, LayoutGrid } from 'lucide-react';
import { Category } from '@/types/category';
import { useCategoryForm } from '@/hooks/useLocalCategoryForm';
import { UnifiedAssetPicker } from '@/components/ui/UnifiedAssetPicker';
import { UnifiedAssetData } from '@/lib/unified-asset-loader';
import { CategoryIcon } from '@/components/ui/icons/LocalCategoryIcon';
import { LocalEmoji } from '@/components/ui/emojis/LocalEmoji';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: number;
  parentCategories?: Category[];
  onSuccess: (category: Category) => void;
  onSubmit: (data: any) => Promise<Category | null>;
}

export function AddCategoryModal({
  isOpen,
  onClose,
  appId,
  parentCategories = [],
  onSuccess,
  onSubmit
}: AddCategoryModalProps) {
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<UnifiedAssetData | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    formData,
    errors,
    isSubmitting,
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
    onSubmit,
    onCancel: onClose,
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit();
    if (result) {
      onSuccess(result);
      resetForm();
      setImagePreview(null);
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    setImagePreview(null);
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
         Add Category 

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

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
            {/* General Error */}
            {errors._general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors._general}</p>
              </div>
            )}

            {/* Replacement Warning */}
            {replacementWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
                <svg className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-amber-800">{replacementWarning}</p>
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
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFieldValue('description', e.target.value)}
                rows={2}
                className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter category description"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Image (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">Upload an image OR select an icon/emoji below. You can only use one at a time.</p>

              {!imagePreview ? (
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-orange-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                  </button>
                  <p className="text-xs text-gray-500">Max 5MB, JPEG/PNG/WebP</p>
                </div>
              ) : (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Category preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1">{imageFile?.name}</p>
                </div>
              )}
            </div>

            {/* Icon/Emoji Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Icon or Emoji {!imageFile && '*'}
              </label>
              {imageFile ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Image uploaded. Icon/emoji selection is disabled when using a custom image.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsIconPickerOpen(true)}
                      className={`flex items-center justify-center w-12 h-12 border-2 border-dashed rounded-lg transition-colors ${
                        (formData.displayType === 'icon' && formData.iconUrl) || (formData.displayType === 'emoji' && formData.emojiUnicode)
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-300 hover:border-blue-400 hover:bg-orange-50'
                      } ${errors.iconName ? 'border-red-300' : ''}`}
                    >
                      {formData.displayType === 'icon' && formData.iconUrl ? (
                        <CategoryIcon iconUrl={formData.iconUrl} size={24} />
                      ) : formData.displayType === 'emoji' && selectedEmoji ? (
                        <LocalEmoji emojiData={selectedEmoji} size={24} />
                      ) : (
                        <Plus className="w-6 h-6 text-gray-400" />
                      )}
                    </button>

                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => setIsIconPickerOpen(true)}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                      >
                        {(formData.displayType === 'icon' && formData.iconUrl) || (formData.displayType === 'emoji' && formData.emojiUnicode)
                          ? 'Change Selection' : 'Select Icon or Emoji'}
                      </button>
                      {formData.displayType === 'icon' && selectedIcon && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Icon: {selectedIcon.name}
                        </p>
                      )}
                      {formData.displayType === 'emoji' && selectedEmoji && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Emoji: {selectedEmoji.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {errors.iconName && (
                    <p className="mt-1 text-xs text-red-600">{errors.iconName}</p>
                  )}
                </>
              )}
            </div>

            {/* Parent Category */}
            {parentCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFieldValue('parentId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No parent (top level)</option>
                  {parentCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
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
                disabled={isSubmitting}
                className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Category'}
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
          } else if (asset.type === 'emoji') {
            // Convert to emoji format expected by form
            setSelectedEmoji({
              name: asset.name,
              unicode: asset.unicode || '',
              shortcode: asset.shortcode || '',
              category: asset.category,
              sourceKey: asset.libraryKey || '',
              source: asset.library || '',
              subcategory: '',
              keywords: asset.keywords || [],
              tags: [],
              version: '',
              license: asset.license || '',
              website: asset.website || '',
              filePath: asset.filePath || '',
              optimized: asset.optimized || false
            });
            setSelectedAsset(asset);
          }
          setIsIconPickerOpen(false);
        }}
        selectedAsset={selectedAsset}
        title="Select Category Icon or Emoji"
      />
    </>
  );
}