'use client';
import { logger } from '@/lib/logger'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Search } from 'lucide-react';

interface StandaloneEmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: any) => void;
  embedded?: boolean;
  externalSearchQuery?: string;
}

export const StandaloneEmojiPicker: React.FC<StandaloneEmojiPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  embedded = false,
  externalSearchQuery,
}) => {
  const [emojis, setEmojis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const emojisPerPage = 50;

  // Use external search when embedded and provided, otherwise use local search
  const searchQuery = embedded && externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;

  useEffect(() => {
    if (!isOpen) return;

    logger.debug('[StandaloneEmojiPicker] Starting to load emojis...');

    // Direct fetch without any loader class
    fetch('/data/emojis-metadata.json')
      .then(res => {
        logger.debug('[StandaloneEmojiPicker] Fetch response:', { value: res.status });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        logger.debug('[StandaloneEmojiPicker] Data loaded:', {
          totalEmojis: data.totalEmojis,
          hasEmojis: !!data.emojis,
          firstEmoji: data.emojis?.[0],
          emojisCount: data.emojis?.length
        });
        setEmojis(data.emojis || []);
        setLoading(false);
      })
      .catch(err => {
        logger.error('[StandaloneEmojiPicker] Error loading:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
        setError(err.message);
        setLoading(false);
      });
  }, [isOpen]);

  // Filter emojis based on search
  const filteredEmojis = searchQuery
    ? emojis.filter(e =>
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.shortcode?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emojis;

  // Paginate
  const totalPages = Math.ceil(filteredEmojis.length / emojisPerPage);
  const startIndex = (currentPage - 1) * emojisPerPage;
  const paginatedEmojis = filteredEmojis.slice(startIndex, startIndex + emojisPerPage);

  logger.debug('[StandaloneEmojiPicker] Render state:', {
    isOpen,
    loading,
    error,
    embedded,
    totalEmojis: emojis.length,
    filteredCount: filteredEmojis.length,
    paginatedCount: paginatedEmojis.length,
    currentPage,
    totalPages
  });

  if (!isOpen) return null;

  // Simplified content for embedded mode
  if (embedded) {
    return (
      <div className="flex flex-col h-full w-full bg-white">
        {/* Search Section - only show if not using external search */}
        {externalSearchQuery === undefined && (
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search emojis..."
                value={localSearchQuery}
                onChange={(e) => {
                  setLocalSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {loading ? 'Loading...' : `${filteredEmojis.length} emojis found`}
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
              <p>Loading emojis...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Error: {error}</p>
            </div>
          ) : paginatedEmojis.length > 0 ? (
            <>
              <div className="grid grid-cols-8 gap-2 mb-4">
                {paginatedEmojis.map((emoji, idx) => (
                  <button
                    key={`${emoji.unicode}-${idx}`}
                    onClick={() => onSelect(emoji)}
                    className="p-2 border rounded hover:bg-orange-50 hover:border-blue-500"
                    title={emoji.name}
                  >
                    <Image
                      src={`/${emoji.filePath}`}
                      alt={emoji.name}
                      width={24}
                      height={24}
                      className="mx-auto"
                      unoptimized={true}
                      onError={(e) => {
                        // Fallback to unicode character
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const span = document.createElement('span');
                        span.textContent = String.fromCodePoint(parseInt(emoji.unicode.split('-')[0], 16));
                        span.style.fontSize = '24px';
                        img.parentNode?.appendChild(span);
                      }}
                    />
                  </button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No emojis found</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Non-embedded mode (standalone modal)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Select Emoji</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search emojis..."
              value={localSearchQuery}
              onChange={(e) => {
                setLocalSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          <div className="text-sm text-gray-500 mt-2">
            {loading ? 'Loading...' : `${filteredEmojis.length} emojis found`}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
              <p>Loading emojis...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Error: {error}</p>
            </div>
          ) : paginatedEmojis.length > 0 ? (
            <>
              <div className="grid grid-cols-8 gap-2 mb-4">
                {paginatedEmojis.map((emoji, idx) => (
                  <button
                    key={`${emoji.unicode}-${idx}`}
                    onClick={() => onSelect(emoji)}
                    className="p-2 border rounded hover:bg-orange-50 hover:border-blue-500"
                    title={emoji.name}
                  >
                    <Image
                      src={`/${emoji.filePath}`}
                      alt={emoji.name}
                      width={24}
                      height={24}
                      className="mx-auto"
                      unoptimized={true}
                      onError={(e) => {
                        // Fallback to unicode character
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const span = document.createElement('span');
                        span.textContent = String.fromCodePoint(parseInt(emoji.unicode.split('-')[0], 16));
                        span.style.fontSize = '24px';
                        img.parentNode?.appendChild(span);
                      }}
                    />
                  </button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No emojis found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandaloneEmojiPicker;