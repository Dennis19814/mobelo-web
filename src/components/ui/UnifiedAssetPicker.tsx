'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { X, Search, Filter, Loader2, Check, Info } from 'lucide-react';
import { UnifiedAssetData, useUnifiedAssets } from '@/lib/unified-asset-loader';
import { UnifiedAsset } from './UnifiedAsset';

export interface UnifiedAssetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: UnifiedAssetData) => void;
  selectedAsset?: UnifiedAssetData;
  title?: string;
  className?: string;
}

export const UnifiedAssetPicker: React.FC<UnifiedAssetPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedAsset,
  title = 'Select Icon or Emoji',
  className = '',
}) => {
  const { metadata, loading, error, searchAssets, libraries } = useUnifiedAssets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewAsset, setPreviewAsset] = useState<UnifiedAssetData | undefined>(selectedAsset);
  const modalRef = useRef<HTMLDivElement>(null);

  const assetsPerPage = 60;

  // Get filtered categories based on selected library
  const availableCategories = useMemo(() => {
    if (!metadata) return [];

    const assets = selectedLibrary === 'all'
      ? metadata.assets
      : metadata.assets.filter(a => a.libraryKey === selectedLibrary);

    const categories = new Set<string>();
    assets.forEach(asset => {
      if (asset.category) {
        categories.add(asset.category);
      }
    });

    return Array.from(categories).sort();
  }, [metadata, selectedLibrary]);

  // Search and filter assets
  const searchResults = useMemo(() => {
    if (!metadata) return [];

    return searchAssets(
      searchQuery,
      selectedLibrary === 'all' ? undefined : selectedLibrary,
      selectedCategory === 'all' ? undefined : selectedCategory
    );
  }, [metadata, searchQuery, selectedLibrary, selectedCategory, searchAssets]);

  // Paginate results
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * assetsPerPage;
    return searchResults.slice(startIndex, startIndex + assetsPerPage);
  }, [searchResults, currentPage, assetsPerPage]);

  const totalPages = Math.ceil(searchResults.length / assetsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLibrary, selectedCategory]);

  // Set initial preview asset when modal opens
  useEffect(() => {
    if (isOpen && selectedAsset) {
      setPreviewAsset(selectedAsset);
    }
  }, [isOpen, selectedAsset]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleAssetClick = useCallback((asset: UnifiedAssetData) => {
    setPreviewAsset(asset);
  }, []);

  const handleAssetSelect = useCallback(() => {
    if (previewAsset) {
      onSelect(previewAsset);
      onClose();
    }
  }, [previewAsset, onSelect, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-[1000px] h-[580px] flex ${className}`}
        style={{ maxWidth: '95vw', maxHeight: '90vh' }}
      >
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between p-4 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Browse {searchResults.length.toLocaleString()} icons and emojis
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="px-4 pb-3 space-y-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search icons and emojis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Library Dropdown */}
                  <select
                    value={selectedLibrary}
                    onChange={(e) => setSelectedLibrary(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Libraries</option>
                    {libraries.map(lib => (
                      <option key={lib.key} value={lib.key}>
                        {lib.name} ({lib.count.toLocaleString()})
                      </option>
                    ))}
                  </select>

                  {/* Category Dropdown */}
                  {availableCategories.length > 0 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Results Count */}
                <div className="text-xs text-gray-500">
                  {searchResults.length.toLocaleString()} results
                </div>
              </div>
            </div>
          </div>

          {/* Assets Grid */}
          <div className="flex-1 overflow-auto min-h-0 p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading assets...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 text-sm">Error: {error}</p>
              </div>
            ) : paginatedResults.length > 0 ? (
              <>
                <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-14 gap-1.5">
                  {paginatedResults.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleAssetClick(asset)}
                      className={`p-2 rounded-md border transition-all hover:bg-gray-50 ${
                        previewAsset?.id === asset.id
                          ? 'border-blue-500 bg-orange-50 ring-1 ring-blue-200'
                          : selectedAsset?.id === asset.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title="Click to preview"
                    >
                      <UnifiedAsset asset={asset} size={20} />
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-2 pt-2 border-t">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-0.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-0.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No assets found</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-64 border-l border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
          </div>

          {previewAsset ? (
            <div className="flex-1 overflow-hidden p-3">
              {/* Large Preview */}
              <div className="bg-white rounded-lg p-4 mb-3 flex items-center justify-center">
                <UnifiedAsset asset={previewAsset} size={40} />
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Name</label>
                  <p className="mt-0.5 text-xs font-medium text-gray-900">{previewAsset.name}</p>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Title</label>
                  <p className="mt-0.5 text-xs text-gray-900">{previewAsset.title}</p>
                </div>

                {previewAsset.keywords && previewAsset.keywords.length > 0 && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Keywords</label>
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {previewAsset.keywords.slice(0, 6).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 text-[10px] bg-gray-200 text-gray-700 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                      {previewAsset.keywords.length > 6 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-gray-500">
                          +{previewAsset.keywords.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Category</label>
                  <p className="mt-0.5 text-xs text-gray-900">
                    {previewAsset.category ? previewAsset.category.charAt(0).toUpperCase() + previewAsset.category.slice(1) : 'Uncategorized'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Library</label>
                  <p className="mt-0.5 text-xs text-gray-900">{previewAsset.library}</p>
                </div>

                {previewAsset.license && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">License</label>
                    <p className="mt-0.5 text-xs text-gray-900">{previewAsset.license}</p>
                  </div>
                )}

                {previewAsset.description && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Description</label>
                    <p className="mt-0.5 text-[11px] text-gray-700 line-clamp-2">{previewAsset.description}</p>
                  </div>
                )}

                {previewAsset.unicode && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Unicode</label>
                    <p className="mt-0.5 text-[11px] font-mono text-gray-900">{previewAsset.unicode}</p>
                  </div>
                )}

                {previewAsset.shortcode && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Shortcode</label>
                    <p className="mt-0.5 text-[11px] font-mono text-gray-900">{previewAsset.shortcode}</p>
                  </div>
                )}
              </div>

              {/* Select Button */}
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleAssetSelect}
                  className="w-full px-2.5 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Select {previewAsset.type === 'icon' ? 'Icon' : 'Emoji'}</span>
                </button>

                {selectedAsset?.id === previewAsset.id && (
                  <div className="flex items-center justify-center space-x-0.5 text-[11px] text-green-600">
                    <Check className="w-3 h-3" />
                    <span>Currently selected</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-gray-500">
                <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">Click an icon or emoji to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedAssetPicker;