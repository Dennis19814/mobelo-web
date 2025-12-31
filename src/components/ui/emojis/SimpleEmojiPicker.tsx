'use client';
import { logger } from '@/lib/logger'

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { SimpleEmojiData, useSimpleEmojis } from '@/lib/simple-emoji-loader';

interface SimpleEmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: SimpleEmojiData) => void;
  selectedEmoji?: SimpleEmojiData;
  title?: string;
  embedded?: boolean;
}

export const SimpleEmojiPicker: React.FC<SimpleEmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedEmoji,
  title = 'Select Emoji',
  embedded = false,
}) => {
  const { emojis, loading, error } = useSimpleEmojis();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('emotions-reactions');
  const [currentPage, setCurrentPage] = useState(1);
  const emojisPerPage = 24;

  // Debug logging
  useEffect(() => {
    logger.debug('[SimpleEmojiPicker] State:', {
      isOpen,
      emojisCount: emojis.length,
      loading,
      error,
      embedded,
      selectedCategory,
      currentPage
    });
  }, [isOpen, emojis.length, loading, error, embedded, selectedCategory, currentPage]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!emojis.length) return [];
    const cats = new Set(emojis.map(e => e.category));
    return ['all', ...Array.from(cats)];
  }, [emojis]);

  // Filter emojis
  const filteredEmojis = useMemo(() => {
    let results = emojis;

    if (selectedCategory && selectedCategory !== 'all') {
      results = results.filter(e => e.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.shortcode.toLowerCase().includes(query)
      );
    }

    return results;
  }, [emojis, selectedCategory, searchQuery]);

  // Paginate
  const totalPages = Math.ceil(filteredEmojis.length / emojisPerPage);
  const paginatedEmojis = useMemo(() => {
    const start = (currentPage - 1) * emojisPerPage;
    const paginated = filteredEmojis.slice(start, start + emojisPerPage);
    logger.debug('[SimpleEmojiPicker] Pagination:', {
      filteredCount: filteredEmojis.length,
      start,
      paginatedCount: paginated.length,
      currentPage,
      totalPages
    });
    return paginated;
  }, [filteredEmojis, currentPage, totalPages]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const content = (
    <>
      {/* Header */}
      <div className="p-1.5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-medium text-gray-900">{title}</h3>
          {!embedded && (
            <button
              onClick={onClose}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-0.5">
          {categories.slice(0, 3).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-1 py-0.5 text-xs rounded transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat.replace(/-/g, ' ').replace('emotions reactions', 'emotions')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading emojis...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600">Error: {error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-6 gap-1">
              {paginatedEmojis.map((emoji) => (
                <button
                  key={emoji.unicode}
                  onClick={() => onSelect(emoji)}
                  className={`p-1 rounded transition-all duration-150 hover:bg-orange-50 hover:scale-105 ${
                    selectedEmoji?.unicode === emoji.unicode
                      ? 'bg-blue-100 scale-105 shadow-sm'
                      : 'hover:shadow-sm'
                  }`}
                  title={emoji.name}
                >
                  <Image
                    src={emoji.filePath.startsWith('/') ? emoji.filePath : `/${emoji.filePath}`}
                    alt={emoji.name}
                    width={18}
                    height={18}
                    className="w-4 h-4 mx-auto"
                    unoptimized={true}
                    onError={(e) => {
                      logger.debug('Failed to load emoji:', { value: emoji.filePath });
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-1 mt-1 pt-1 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-1 py-0.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  ←
                </button>
                <span className="text-xs text-gray-600 px-0.5">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-1 py-0.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  →
                </button>
              </div>
            )}

            {!paginatedEmojis.length && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No emojis found</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  if (embedded) {
    return <div className="flex flex-col h-full">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm h-[320px] flex flex-col">
        {content}
      </div>
    </div>
  );
};

export default SimpleEmojiPicker;