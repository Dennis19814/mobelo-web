'use client';
import { logger } from '@/lib/logger'

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { LocalIconData } from '@/lib/local-icon-loader';
import { LocalIconPicker } from './icons/LocalIconPicker';
import { StandaloneEmojiPicker } from './emojis/StandaloneEmojiPicker';

export type UnifiedPickerSelection = {
  type: 'icon' | 'emoji';
  data: any; // Using any for now to simplify
};

interface UnifiedPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: UnifiedPickerSelection) => void;
  selectedItem?: UnifiedPickerSelection;
  title?: string;
  className?: string;
  defaultTab?: 'icons' | 'emojis';
}

export const UnifiedPicker: React.FC<UnifiedPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedItem,
  title = 'Select Icon or Emoji',
  className = '',
  defaultTab = 'icons',
}) => {
  const [activeTab, setActiveTab] = useState<'icons' | 'emojis'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    logger.debug('[UnifiedPicker] Component mounted/updated', {
      isOpen,
      activeTab,
      selectedItem,
      defaultTab,
      searchQuery
    });
  }, [isOpen, activeTab, selectedItem, defaultTab, searchQuery]);

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

  const handleIconSelect = useCallback((iconData: LocalIconData) => {
    onSelect({
      type: 'icon',
      data: iconData
    });
  }, [onSelect]);

  const handleEmojiSelect = useCallback((emojiData: any) => {
    logger.debug('[UnifiedPicker] Emoji selected:', { value: emojiData });
    onSelect({
      type: 'emoji',
      data: emojiData
    });
  }, [onSelect]);

  if (!isOpen) {
    return null;
  }

  const selectedIcon = selectedItem?.type === 'icon' ? selectedItem.data as LocalIconData : undefined;
  const selectedEmoji = selectedItem?.type === 'emoji' ? selectedItem.data : undefined;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col ${className}`}
      >
        {/* Header with Close Button */}
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose between icons and emojis for your category
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Unified Search Bar */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search icons and emojis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => {
                logger.debug('[UnifiedPicker] Switching to Icons tab');
                setActiveTab('icons');
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'icons'
                  ? 'border-blue-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Icons
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                10,801
              </span>
            </button>
            <button
              onClick={() => {
                logger.debug('[UnifiedPicker] Switching to Emojis tab');
                setActiveTab('emojis');
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'emojis'
                  ? 'border-blue-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Emojis
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                4,295
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {/* Render only the active picker to avoid React hooks conflicts */}
          {activeTab === 'icons' ? (
              <LocalIconPicker
                isOpen={true}
                onClose={onClose}
                onSelect={handleIconSelect}
                selectedIcon={selectedIcon}
                title=""
                embedded={true}
                externalSearchQuery={searchQuery}
              />
            ) : (
              <StandaloneEmojiPicker
                isOpen={true}
                onClose={onClose}
                onSelect={handleEmojiSelect}
                embedded={true}
                externalSearchQuery={searchQuery}
              />
            )}
        </div>
      </div>
    </div>
  );
};

// Simplified picker component for backward compatibility
interface SimpleUnifiedPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon?: (iconData: LocalIconData) => void;
  onSelectEmoji?: (emojiData: any) => void;
  selectedIcon?: LocalIconData;
  selectedEmoji?: any;
  title?: string;
  className?: string;
  defaultTab?: 'icons' | 'emojis';
}

export const SimpleUnifiedPicker: React.FC<SimpleUnifiedPickerProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
  onSelectEmoji,
  selectedIcon,
  selectedEmoji,
  title,
  className,
  defaultTab,
}) => {
  const selectedItem: UnifiedPickerSelection | undefined = selectedIcon
    ? { type: 'icon', data: selectedIcon }
    : selectedEmoji
    ? { type: 'emoji', data: selectedEmoji }
    : undefined;

  const handleSelect = useCallback((selection: UnifiedPickerSelection) => {
    if (selection.type === 'icon' && onSelectIcon) {
      onSelectIcon(selection.data as LocalIconData);
    } else if (selection.type === 'emoji' && onSelectEmoji) {
      onSelectEmoji(selection.data);
    }
  }, [onSelectIcon, onSelectEmoji]);

  return (
    <UnifiedPicker
      isOpen={isOpen}
      onClose={onClose}
      onSelect={handleSelect}
      selectedItem={selectedItem}
      title={title}
      className={className}
      defaultTab={defaultTab}
    />
  );
};

export default UnifiedPicker;