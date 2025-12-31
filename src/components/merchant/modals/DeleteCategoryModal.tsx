'use client';
import { logger } from '@/lib/logger'

import { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Category } from '@/types/category';
import { CategoryIcon } from '@/components/ui/icons/LocalCategoryIcon';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onConfirm: (categoryId: number) => Promise<void>;
  hasChildCategories?: boolean;
  hasProducts?: boolean;
}

export function DeleteCategoryModal({
  isOpen,
  onClose,
  category,
  onConfirm,
  hasChildCategories = false,
  hasProducts = false
}: DeleteCategoryModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (!category) return;

    setIsDeleting(true);
    try {
      await onConfirm(category.id);
      onClose();
      setConfirmText('');
    } catch (error) {
      logger.error('Delete failed:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const isConfirmValid = confirmText.toLowerCase() === category?.name.toLowerCase();

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header with close button */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Category</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-6">
            <CategoryIcon iconUrl={category.iconUrl} size={24} />
            <div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>
          </div>

          {/* Warning Messages */}
          <div className="space-y-4 mb-6">
            <p className="text-gray-700">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>

            {hasProducts && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      This category contains products
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Products in this category will be moved to "Uncategorized" and may become harder to find.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasChildCategories && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      This category has subcategories
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      All subcategories will also be deleted. Products in subcategories will be moved to "Uncategorized".
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "{category.name}" to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={category.name}
              disabled={isDeleting}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isDeleting || !isConfirmValid}
              className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Category</span>
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}