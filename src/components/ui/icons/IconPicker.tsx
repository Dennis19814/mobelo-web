'use client';
import { logger } from '@/lib/logger'

import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { IconData, IconCategory, ICON_REGISTRY, getRecentIcons } from './icon-registry';
import IconSearch from './IconSearch';
import IconGrid from './IconGrid';
import IconPreview from './IconPreview';

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconData: IconData) => void;
  selectedIcon?: IconData;
  title?: string;
  className?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedIcon,
  title = 'Select Category Icon',
  className = '',
}) => {
  const [searchResults, setSearchResults] = useState<IconData[]>(ICON_REGISTRY);
  const [selectedCategory, setSelectedCategory] = useState<IconCategory>('all');
  const [localSelectedIcon, setLocalSelectedIcon] = useState<IconData | undefined>(selectedIcon);
  const [recentIcons, setRecentIcons] = useState<IconData[]>([]);

  // Load recent icons from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recent-category-icons');
      if (stored) {
        try {
          const recentIconNames = JSON.parse(stored) as string[];
          const recent = getRecentIcons(recentIconNames);
          setRecentIcons(recent);
        } catch (error) {
          logger.warn('Failed to load recent icons:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        }
      }
    }
  }, []);

  // Save recent icon to localStorage
  const saveRecentIcon = useCallback((icon: IconData) => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recent-category-icons');
        const existing = stored ? JSON.parse(stored) as string[] : [];

        // Remove if already exists and add to front
        const filtered = existing.filter(name => name !== icon.name);
        const updated = [icon.name, ...filtered].slice(0, 10); // Keep last 10

        localStorage.setItem('recent-category-icons', JSON.stringify(updated));

        // Update state
        const recent = getRecentIcons(updated);
        setRecentIcons(recent);
      } catch (error) {
        logger.warn('Failed to save recent icon:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }
  }, []);

  const handleSearchResults = useCallback((results: IconData[]) => {
    setSearchResults(results);
  }, []);

  const handleCategoryChange = useCallback((category: IconCategory) => {
    setSelectedCategory(category);
  }, []);

  const handleIconSelect = useCallback((icon: IconData) => {
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
    }
  }, [isOpen, selectedIcon]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Search and Grid */}
            <div className="flex-1 flex flex-col border-r border-gray-200">
              {/* Search */}
              <div className="p-6 border-b border-gray-100">
                <IconSearch
                  onSearchResults={handleSearchResults}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  placeholder="Search icons by name, keyword, or description..."
                />
              </div>

              {/* Recent Icons */}
              {recentIcons.length > 0 && selectedCategory === 'all' && (
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Recently Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentIcons.slice(0, 8).map((icon, index) => {
                      const IconComponent = icon.component;
                      return (
                        <button
                          key={`recent-${icon.name}-${index}`}
                          onClick={() => handleIconSelect(icon)}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            localSelectedIcon?.name === icon.name
                              ? 'border-blue-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          title={icon.name}
                        >
                          <IconComponent size={20} className="text-gray-600" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Icon Grid */}
              <div className="flex-1 overflow-hidden">
                <IconGrid
                  icons={searchResults}
                  selectedIcon={localSelectedIcon}
                  onSelect={handleIconSelect}
                  className="h-full"
                  iconSize={20}
                  columns={8}
                />
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="w-80 p-6 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Preview</h3>
              <IconPreview
                selectedIcon={localSelectedIcon}
                showDetails={true}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {localSelectedIcon ? (
                <span>
                  Selected: <strong>{localSelectedIcon.name}</strong>
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
      </div>
    </>
  );
};

export default IconPicker;