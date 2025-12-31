'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { ICON_REGISTRY, IconData, ICON_CATEGORIES, IconCategory } from './icon-registry';

interface IconSearchProps {
  onSearchResults: (results: IconData[]) => void;
  selectedCategory?: IconCategory;
  onCategoryChange?: (category: IconCategory) => void;
  placeholder?: string;
  className?: string;
}

export const IconSearch: React.FC<IconSearchProps> = ({
  onSearchResults,
  selectedCategory = 'all',
  onCategoryChange,
  placeholder = 'Search icons...',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Setup Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    const options = {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'keywords', weight: 0.4 },
        { name: 'description', weight: 0.2 },
      ],
      threshold: 0.3, // Lower threshold = more strict matching
      includeScore: true,
      minMatchCharLength: 2,
    };

    return new Fuse(ICON_REGISTRY, options);
  }, []);

  // Filter icons based on search query and category
  useEffect(() => {
    let filteredIcons: IconData[] = [];

    // Filter by category first
    const categoryIcons = selectedCategory === 'all'
      ? ICON_REGISTRY
      : ICON_REGISTRY.filter(icon => icon.category === selectedCategory);

    if (!searchQuery.trim()) {
      // No search query, return all icons in category
      filteredIcons = categoryIcons;
    } else {
      // Search within the category
      const searchResults = fuse.search(searchQuery);
      filteredIcons = searchResults
        .map(result => result.item)
        .filter(icon => selectedCategory === 'all' || icon.category === selectedCategory);
    }

    onSearchResults(filteredIcons);
  }, [searchQuery, selectedCategory, fuse, onSearchResults]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const formatCategoryName = (category: string) => {
    return category === 'all'
      ? 'All'
      : category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   placeholder-gray-500 text-sm"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      {onCategoryChange && (
        <div className="flex flex-wrap gap-2">
          {ICON_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-800 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {formatCategoryName(category)}
            </button>
          ))}
        </div>
      )}

      {/* Search Stats */}
      {searchQuery && (
        <div className="text-sm text-gray-500">
          {/* This will be updated by parent component based on results */}
        </div>
      )}
    </div>
  );
};

export default IconSearch;