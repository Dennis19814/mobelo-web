'use client';

import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Category } from '@/types/category';
import { UnifiedCategoryDisplay } from '@/components/ui/icons/LocalCategoryIcon';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  isNested?: boolean;
}

export function CategoryCard({ category, onEdit, onDelete, isNested = false }: CategoryCardProps) {
  return (
    <div
      className={`p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all ${
        isNested ? 'ml-8 border-l-4 border-l-blue-200' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <UnifiedCategoryDisplay
              category={category}
              size={24}
              className="text-gray-600"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-sm text-gray-500 truncate">
                {category.description}
              </p>
            )}
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-400">
                {category.productCount || 0} products
              </span>
              {!category.isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Edit category"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(category)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}