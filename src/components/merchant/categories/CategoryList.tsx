'use client';

import { useState } from 'react';
import { FolderTree, Search } from 'lucide-react';
import { Category } from '@/types/category';
import { CategoryCard } from './CategoryCard';

interface CategoryListProps {
  categories: Category[];
  isLoading?: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryList({ categories, isLoading, onEdit, onDelete }: CategoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Organize categories hierarchically
  const topLevelCategories = filteredCategories.filter(cat => !cat.parentId);
  const getChildCategories = (parentId: number) =>
    filteredCategories.filter(cat => cat.parentId === parentId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Categories</h2>

          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderTree className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Create categories to organize your products and make them easier for customers to find.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Categories ({categories.length})
          </h2>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <Search className="mx-auto w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No categories found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topLevelCategories.map((category) => (
              <div key={category.id}>
                <CategoryCard
                  category={category}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />

                {/* Child categories */}
                {getChildCategories(category.id).map((childCategory) => (
                  <div key={childCategory.id} className="mt-2">
                    <CategoryCard
                      category={childCategory}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isNested={true}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}