'use client';
import { logger } from '@/lib/logger'

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { LocalEmojiData, useLightEmojiMetadata, useEmojiSearch, useEmojisBatch, emojiLoader } from '@/lib/local-emoji-loader';
import { LocalEmoji } from './LocalEmoji';

interface LocalEmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emojiData: LocalEmojiData) => void;
  selectedEmoji?: LocalEmojiData;
  title?: string;
  className?: string;
  embedded?: boolean; // New prop for embedded mode
}

export const LocalEmojiPicker: React.FC<LocalEmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedEmoji,
  title = 'Select Category Emoji',
  className = '',
  embedded = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [localSelectedEmoji, setLocalSelectedEmoji] = useState<LocalEmojiData | undefined>(selectedEmoji);
  const [recentEmojis, setRecentEmojis] = useState<LocalEmojiData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  // Initialize all state first
  const [currentPage, setCurrentPage] = useState(1);
  const emojisPerPage = 50;

  // Load light metadata first for quick UI render
  const { metadata, loading: metadataLoading, error: metadataError } = useLightEmojiMetadata();

  // Debug logging
  useEffect(() => {
    logger.debug('[LocalEmojiPicker] Metadata state:', {
      metadata,
      metadataLoading,
      metadataError,
      embedded,
      isOpen
    });
  }, [metadata, metadataLoading, metadataError, embedded, isOpen]);

  // Search with debouncing and limits for performance
  const { results: searchResults, searching } = useEmojiSearch(
    searchQuery,
    selectedCategory,
    selectedSource,
    100
  );

  // Calculate offset for batch loading using useMemo to ensure currentPage is ready
  const batchOffset = useMemo(() => (currentPage - 1) * emojisPerPage, [currentPage, emojisPerPage]);

  // Batch loading for pagination when not searching
  const { results: batchResults, loading: batchLoading } = useEmojisBatch(
    selectedCategory,
    selectedSource,
    batchOffset,
    emojisPerPage
  );

  // Use search results if searching, otherwise use batch results
  const displayResults = searchQuery.trim() ? searchResults : batchResults;
  const isLoading = searchQuery.trim() ? searching : batchLoading;

  // Load recent emojis from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && metadata) {
      const stored = localStorage.getItem('recent-local-emojis');
      if (stored) {
        try {
          const recentEmojiKeys = JSON.parse(stored) as string[];
          const recent = recentEmojiKeys
            .map(key => {
              const [source, unicode] = key.split(':');
              return emojiLoader.getEmojiByUnicode(unicode, source);
            })
            .filter((emoji): emoji is LocalEmojiData => emoji !== undefined)
            .slice(0, 10);
          setRecentEmojis(recent);
        } catch (error) {
          logger.warn('Failed to load recent emojis:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        }
      }
    }
  }, [metadata]);

  // Save recent emoji to localStorage
  const saveRecentEmoji = useCallback((emoji: LocalEmojiData) => {
    if (typeof window !== 'undefined') {
      try {
        const emojiKey = `${emoji.sourceKey}:${emoji.unicode}`;
        const stored = localStorage.getItem('recent-local-emojis');
        const existing = stored ? JSON.parse(stored) as string[] : [];
        const filtered = existing.filter(key => key !== emojiKey);
        const updated = [emojiKey, ...filtered].slice(0, 10);
        localStorage.setItem('recent-local-emojis', JSON.stringify(updated));

        const recent = updated
          .map(key => {
            const [source, unicode] = key.split(':');
            return emojiLoader.getEmojiByUnicode(unicode, source);
          })
          .filter((emoji): emoji is LocalEmojiData => emoji !== undefined);
        setRecentEmojis(recent);
      } catch (error) {
        logger.warn('Failed to save recent emoji:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }
  }, []);

  const handleEmojiSelect = useCallback((emoji: LocalEmojiData) => {
    setLocalSelectedEmoji(emoji);
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (localSelectedEmoji) {
      saveRecentEmoji(localSelectedEmoji);
      onSelect(localSelectedEmoji);
      onClose();
    }
  }, [localSelectedEmoji, onSelect, onClose, saveRecentEmoji]);

  const handleCancel = useCallback(() => {
    setLocalSelectedEmoji(selectedEmoji);
    onClose();
  }, [selectedEmoji, onClose]);

  // Reset local selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedEmoji(selectedEmoji);
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedSource('');
    }
  }, [isOpen, selectedEmoji]);

  // For search results, calculate total pages using useMemo
  const totalPages = useMemo(() => {
    return searchQuery.trim()
      ? Math.ceil(searchResults.length / emojisPerPage)
      : Math.ceil((metadata?.totalEmojis || 0) / emojisPerPage);
  }, [searchQuery, searchResults.length, metadata?.totalEmojis, emojisPerPage]);

  // Use display results directly for batch mode, paginate for search mode using useMemo
  const paginatedResults = useMemo(() => {
    return searchQuery.trim()
      ? displayResults.slice((currentPage - 1) * emojisPerPage, currentPage * emojisPerPage)
      : displayResults;
  }, [searchQuery, displayResults, currentPage, emojisPerPage]);

  // Debug logging for results
  useEffect(() => {
    logger.debug('[LocalEmojiPicker] Display state:', {
      searchQuery,
      searchResultsCount: searchResults.length,
      batchResultsCount: batchResults.length,
      displayResultsCount: displayResults.length,
      paginatedResultsCount: paginatedResults.length,
      isLoading,
      searching,
      batchLoading,
      currentPage,
      totalPages,
      selectedCategory,
      selectedSource
    });
  }, [searchQuery, searchResults, batchResults, displayResults, paginatedResults, isLoading, searching, batchLoading, currentPage, totalPages, selectedCategory, selectedSource]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSource]);

  // Show loading for first time users
  const isFirstLoad = metadataLoading && !metadata;

  if (!isOpen) {
    return null;
  }

  if (isFirstLoad) {
    const loadingContent = (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading emoji library...</p>
        <p className="text-xs text-gray-500 mt-2">This may take a moment for the first load</p>
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
        <p className="text-red-600 mb-4">Failed to load emojis: {metadataError}</p>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emojis by name, keyword, or shortcode..."
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
              {isLoading && (searchQuery.trim() ? 'Searching...' : 'Loading...')}
              {!isLoading && searchQuery.trim() && `${searchResults.length.toLocaleString()} results`}
              {!isLoading && !searchQuery.trim() && `${metadata?.totalEmojis?.toLocaleString() || 0} total emojis`}
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
                  {metadata?.categories?.map(category => (
                    <option key={category} value={category}>
                      {metadata.categoryInfo?.[category]?.name || category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sources</option>
                  {metadata?.sourceStats?.map(source => (
                    <option key={source.key} value={source.key}>
                      {source.name} ({source.count.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Emoji Grid */}
          <div className="flex-1 flex flex-col">
            {/* Recent Emojis */}
            {recentEmojis.length > 0 && !searchQuery && selectedCategory === 'all' && !selectedSource && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recently Used</h3>
                <div className="flex flex-wrap gap-2">
                  {recentEmojis.slice(0, 10).map((emoji, index) => (
                    <button
                      key={`recent-${emoji.sourceKey}-${emoji.unicode}-${index}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        localSelectedEmoji?.unicode === emoji.unicode && localSelectedEmoji?.sourceKey === emoji.sourceKey
                          ? 'border-blue-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={emoji.name}
                    >
                      <LocalEmoji emojiData={emoji} size={20} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emojis Grid */}
            <div className="flex-1 overflow-auto p-4">
              {/* Debug info */}
              {embedded && (
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded mb-2">
                  Debug: Loading={isLoading ? 'true' : 'false'},
                  Results={paginatedResults.length},
                  Total={metadata?.totalEmojis || 0},
                  Category={selectedCategory},
                  Page={currentPage}/{totalPages}
                </div>
              )}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{searchQuery.trim() ? 'Searching emojis...' : 'Loading emojis...'}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                  {paginatedResults.map((emoji) => (
                    <button
                      key={`${emoji.sourceKey}-${emoji.unicode}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`p-3 rounded-lg border-2 transition-all hover:bg-gray-50 ${
                        localSelectedEmoji?.unicode === emoji.unicode && localSelectedEmoji?.sourceKey === emoji.sourceKey
                          ? 'border-blue-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={emoji.name}
                    >
                      <LocalEmoji emojiData={emoji} size={24} />
                    </button>
                  ))}
                  {!isLoading && paginatedResults.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <div className="text-gray-400 text-lg mb-2">🔍</div>
                      <p className="text-gray-500">
                        {searchQuery.trim() ? 'No emojis found for your search' : 'No emojis available'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
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
            {localSelectedEmoji ? (
              <div className="space-y-4">
                {/* Emoji Preview */}
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border">
                  <LocalEmoji emojiData={localSelectedEmoji} size={48} />
                </div>

                {/* Emoji Details */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{localSelectedEmoji.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Shortcode:</span>
                    <span className="ml-2 text-gray-600">{localSelectedEmoji.shortcode}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">
                      {metadata?.categoryInfo?.[localSelectedEmoji.category]?.name || localSelectedEmoji.category}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Source:</span>
                    <span className="ml-2 text-gray-600">{localSelectedEmoji.source}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Unicode:</span>
                    <span className="ml-2 text-gray-600 font-mono">{localSelectedEmoji.unicode}</span>
                  </div>
                  {localSelectedEmoji.keywords?.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Keywords:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {localSelectedEmoji.keywords.slice(0, 8).map((keyword, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 mt-4">
                  <strong>Selected:</strong> {localSelectedEmoji.name}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">😊</div>
                <p className="text-gray-500">Select an emoji to preview</p>
                <p className="text-sm text-gray-400 mt-1">No emoji selected</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!localSelectedEmoji}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Select Emoji
          </button>
        </div>
      </div>
    );
  }

  // Standard modal mode with overlay
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {metadata?.totalEmojis?.toLocaleString() || 0} emojis from {metadata?.sources || 0} sources
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emojis by name, keyword, or description..."
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
              {searchQuery
                ? `${searchResults.length.toLocaleString()} results`
                : `${displayResults.length.toLocaleString()} emojis`}
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
                  {metadata?.categories?.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sources</option>
                  {metadata?.sourceStats?.map(source => (
                    <option key={source.key} value={source.key}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Emoji Grid/List */}
          <div className="flex-1 flex flex-col">
            {/* Recent Emojis */}
            {recentEmojis.length > 0 && !searchQuery && selectedCategory === 'all' && !selectedSource && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recently Used</h3>
                <div className="flex flex-wrap gap-2">
                  {recentEmojis.slice(0, 10).map((emoji, index) => (
                    <button
                      key={`recent-${emoji.unicode}-${index}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`p-2 rounded-lg border-2 transition-all hover:bg-gray-50 ${
                        localSelectedEmoji?.unicode === emoji.unicode
                          ? 'border-blue-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={emoji.name}
                    >
                      <LocalEmoji emojiData={emoji} size={20} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emojis Grid */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading emojis...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 xl:grid-cols-20 gap-2">
                    {displayResults.map((emoji) => (
                      <button
                        key={emoji.unicode}
                        onClick={() => handleEmojiSelect(emoji)}
                        className={`p-2 rounded-lg border-2 transition-all hover:bg-gray-50 ${
                          localSelectedEmoji?.unicode === emoji.unicode
                            ? 'border-blue-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        title={emoji.name}
                      >
                        <LocalEmoji emojiData={emoji} size={20} />
                      </button>
                    ))}
                  </div>

                  {/* Pagination for batch loading */}
                  {!searchQuery && totalPages > 1 && (
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
                </>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Preview</h3>
            {localSelectedEmoji ? (
              <div className="space-y-4">
                {/* Emoji Preview */}
                <div className="flex items-center justify-center p-8 bg-white rounded-lg border">
                  <LocalEmoji emojiData={localSelectedEmoji} size={48} />
                </div>

                {/* Emoji Details */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{localSelectedEmoji.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Shortcode:</span>
                    <span className="ml-2 text-gray-600">{localSelectedEmoji.shortcode}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{localSelectedEmoji.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Source:</span>
                    <span className="ml-2 text-gray-600">{localSelectedEmoji.source}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Unicode:</span>
                    <span className="ml-2 text-gray-600 font-mono text-xs">{localSelectedEmoji.unicode}</span>
                  </div>
                  {localSelectedEmoji.keywords.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Keywords:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {localSelectedEmoji.keywords.map((keyword, index) => (
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
                <p>Select an emoji to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!localSelectedEmoji}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Select Emoji
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalEmojiPicker;