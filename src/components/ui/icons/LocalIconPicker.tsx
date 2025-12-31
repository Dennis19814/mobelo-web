'use client';
import { logger } from '@/lib/logger'

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { LocalIconData, useIconMetadata, useIconSearch, iconLoader } from '@/lib/local-icon-loader';
import { LocalIcon } from './LocalIcon';

interface LocalIconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconData: LocalIconData) => void;
  selectedIcon?: LocalIconData;
  title?: string;
  className?: string;
  embedded?: boolean; // New prop for embedded mode
  externalSearchQuery?: string; // New prop for external search from UnifiedPicker
}

export const LocalIconPicker: React.FC<LocalIconPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedIcon,
  title = 'Select Category Icon',
  className = '',
  embedded = false,
  externalSearchQuery,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [localSelectedIcon, setLocalSelectedIcon] = useState<LocalIconData | undefined>(selectedIcon);
  const [recentIcons, setRecentIcons] = useState<LocalIconData[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Use external search query when embedded, otherwise use local search
  const searchQuery = embedded && externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;

  // Load metadata and search results
  const { metadata, loading: metadataLoading, error: metadataError } = useIconMetadata();
  const searchResults = useIconSearch(searchQuery, selectedCategory, selectedLibrary);

  // Load recent icons from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && metadata) {
      const stored = localStorage.getItem('recent-local-icons');
      if (stored) {
        try {
          const recentIconKeys = JSON.parse(stored) as string[];
          const recent = recentIconKeys
            .map(key => {
              const [library, name] = key.split(':');
              return iconLoader.getIconByName(name, library);
            })
            .filter((icon): icon is LocalIconData => icon !== undefined)
            .slice(0, 10);
          setRecentIcons(recent);
        } catch (error) {
          logger.warn('Failed to load recent icons:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        }
      }
    }
  }, [metadata]);

  // Save recent icon to localStorage
  const saveRecentIcon = useCallback((icon: LocalIconData) => {
    if (typeof window !== 'undefined') {
      try {
        const iconKey = `${icon.libraryKey}:${icon.name}`;
        const stored = localStorage.getItem('recent-local-icons');
        const existing = stored ? JSON.parse(stored) as string[] : [];

        // Remove if already exists and add to front
        const filtered = existing.filter(key => key !== iconKey);
        const updated = [iconKey, ...filtered].slice(0, 10); // Keep last 10

        localStorage.setItem('recent-local-icons', JSON.stringify(updated));

        // Update state
        const recent = updated
          .map(key => {
            const [library, name] = key.split(':');
            return iconLoader.getIconByName(name, library);
          })
          .filter((icon): icon is LocalIconData => icon !== undefined);
        setRecentIcons(recent);
      } catch (error) {
        logger.warn('Failed to save recent icon:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }
  }, []);

  const handleIconSelect = useCallback((icon: LocalIconData) => {
    setLocalSelectedIcon(icon);
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (localSelectedIcon) {
      saveRecentIcon(localSelectedIcon);
      onSelect(localSelectedIcon);
      onClose();
    }
  }, [localSelectedIcon, onSelect, onClose, saveRecentIcon]);

  const handleCancel = useCallback(() => {
    setLocalSelectedIcon(selectedIcon);
    onClose();
  }, [selectedIcon, onClose]);

  // Reset local selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIcon(selectedIcon);
      setLocalSearchQuery('');
      setSelectedCategory('all');
      setSelectedLibrary('');
    }
  }, [isOpen, selectedIcon]);

  // Pagination for large result sets
  const [currentPage, setCurrentPage] = useState(1);
  const iconsPerPage = 100;
  const totalPages = Math.ceil(searchResults.length / iconsPerPage);
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * iconsPerPage;
    return searchResults.slice(startIndex, startIndex + iconsPerPage);
  }, [searchResults, currentPage]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLibrary]);

  if (!isOpen) {
    return null;
  }

  if (metadataLoading) {
    const loadingContent = (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading icons...</p>
      </div>
    );

    if (embedded) {
      return <div className="flex-1 flex items-center justify-center">{loadingContent}</div>;
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">{loadingContent}</div>
      </div>
    );
  }

  if (metadataError) {
    const errorContent = (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load icons: {metadataError}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Close
        </button>
      </div>
    );

    if (embedded) {
      return <div className="flex-1 flex items-center justify-center">{errorContent}</div>;
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md">{errorContent}</div>
      </div>
    );
  }

  // Render content based on embedded mode
  if (embedded) {
    return (
      <div className={`flex-1 flex flex-col overflow-hidden ${className}`}>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Search icons by name, keyword, or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter size={16} />
                <span>Filters</span>
              </button>

            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              {searchResults.length.toLocaleString()} results
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {metadata?.categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Library Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Library</label>
                <select
                  value={selectedLibrary}
                  onChange={(e) => setSelectedLibrary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Libraries</option>
                  {metadata?.libraryStats.map(lib => (
                    <option key={lib.key} value={lib.key}>
                      {lib.name} ({lib.count.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Icon Grid/List */}
          <div className="flex-1 flex flex-col">
            {/* Recent Icons */}
            {recentIcons.length > 0 && !searchQuery && selectedCategory === 'all' && !selectedLibrary && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recently Used</h3>
                <div className="flex flex-wrap gap-2">
                  {recentIcons.slice(0, 10).map((icon, index) => (
                    <button
                      key={`recent-${icon.libraryKey}-${icon.name}-${index}`}
                      onClick={() => handleIconSelect(icon)}
                      className={`p-2 rounded-lg border-2 transition-all text-gray-600 hover:text-gray-800 ${
                        localSelectedIcon?.name === icon.name && localSelectedIcon?.libraryKey === icon.libraryKey
                          ? 'border-blue-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={icon.title || icon.name}
                    >
                      <LocalIcon iconData={icon} size={20} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Icons Grid */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                {paginatedResults.map((icon) => (
                  <button
                    key={`${icon.libraryKey}-${icon.name}`}
                    onClick={() => handleIconSelect(icon)}
                    className={`p-3 rounded-lg border-2 transition-all text-gray-600 hover:text-gray-800 hover:bg-gray-50 ${
                      localSelectedIcon?.name === icon.name && localSelectedIcon?.libraryKey === icon.libraryKey
                        ? 'border-blue-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={icon.title || icon.name}
                  >
                    <LocalIcon iconData={icon} size={24} />
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Preview</h3>
            {localSelectedIcon ? (
              <div className="space-y-4">
                {/* Icon Preview */}
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border">
                  <LocalIcon iconData={localSelectedIcon} size={48} />
                </div>

                {/* Icon Details */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{localSelectedIcon.title || localSelectedIcon.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Library:</span>
                    <span className="ml-2 text-gray-600">{localSelectedIcon.library}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{localSelectedIcon.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">License:</span>
                    <span className="ml-2 text-gray-600">{localSelectedIcon.license}</span>
                  </div>
                  {localSelectedIcon.keywords.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Keywords:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {localSelectedIcon.keywords.map((keyword, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <p>Select an icon to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {localSelectedIcon ? (
              <span>
                Selected: <strong>{localSelectedIcon.title || localSelectedIcon.name}</strong>
              </span>
            ) : (
              'No icon selected'
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!localSelectedIcon}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                localSelectedIcon
                  ? 'text-white bg-orange-600 hover:bg-orange-700'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
            >
              Select Icon
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard modal mode with overlay
  const pickerContent = (
    <div className={`bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {metadata?.totalIcons.toLocaleString()} icons from {metadata?.libraries} libraries
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Search icons by name, keyword, or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter size={16} />
                <span>Filters</span>
              </button>

            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              {searchResults.length.toLocaleString()} results
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {metadata?.categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Library Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Library</label>
                <select
                  value={selectedLibrary}
                  onChange={(e) => setSelectedLibrary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Libraries</option>
                  {metadata?.libraryStats.map(lib => (
                    <option key={lib.key} value={lib.key}>
                      {lib.name} ({lib.count.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Icon Grid/List */}
          <div className="flex-1 flex flex-col">
            {/* Recent Icons */}
            {recentIcons.length > 0 && !searchQuery && selectedCategory === 'all' && !selectedLibrary && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recently Used</h3>
                <div className="flex flex-wrap gap-2">
                  {recentIcons.slice(0, 10).map((icon, index) => (
                    <button
                      key={`recent-${icon.libraryKey}-${icon.name}-${index}`}
                      onClick={() => handleIconSelect(icon)}
                      className={`p-2 rounded-lg border-2 transition-all text-gray-600 hover:text-gray-800 ${
                        localSelectedIcon?.name === icon.name && localSelectedIcon?.libraryKey === icon.libraryKey
                          ? 'border-blue-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={icon.title || icon.name}
                    >
                      <LocalIcon iconData={icon} size={20} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Icons Grid */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                {paginatedResults.map((icon) => (
                  <button
                    key={`${icon.libraryKey}-${icon.name}`}
                    onClick={() => handleIconSelect(icon)}
                    className={`p-3 rounded-lg border-2 transition-all text-gray-600 hover:text-gray-800 hover:bg-gray-50 ${
                      localSelectedIcon?.name === icon.name && localSelectedIcon?.libraryKey === icon.libraryKey
                        ? 'border-blue-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={icon.title || icon.name}
                  >
                    <LocalIcon iconData={icon} size={24} />
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Preview</h3>
            {localSelectedIcon ? (
              <div className="space-y-4">
                {/* Icon Preview */}
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border">
                  <LocalIcon iconData={localSelectedIcon} size={48} />
                </div>

                {/* Icon Details */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{localSelectedIcon.title || localSelectedIcon.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Library:</span>
                    <span className="ml-2 text-gray-600">{localSelectedIcon.library}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{localSelectedIcon.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">License:</span>
                    <span className="ml-2 text-gray-600">{localSelectedIcon.license}</span>
                  </div>
                  {localSelectedIcon.keywords.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Keywords:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {localSelectedIcon.keywords.map((keyword, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <p>Select an icon to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {localSelectedIcon ? (
              <span>
                Selected: <strong>{localSelectedIcon.title || localSelectedIcon.name}</strong>
              </span>
            ) : (
              'No icon selected'
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!localSelectedIcon}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                localSelectedIcon
                  ? 'text-white bg-orange-600 hover:bg-orange-700'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
            >
              Select Icon
            </button>
          </div>
        </div>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      {pickerContent}
    </div>
  );
};

export default LocalIconPicker;