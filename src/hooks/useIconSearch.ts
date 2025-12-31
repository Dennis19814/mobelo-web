'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { IconData, IconCategory, ICON_REGISTRY, getCategoryIcons } from '@/components/ui/icons/icon-registry';

export interface UseIconSearchOptions {
  initialCategory?: IconCategory;
  debounceMs?: number;
}

export interface UseIconSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: IconCategory;
  setSelectedCategory: (category: IconCategory) => void;
  filteredIcons: IconData[];
  isSearching: boolean;
  searchStats: {
    totalResults: number;
    hasQuery: boolean;
    category: IconCategory;
  };
  clearSearch: () => void;
  recentIcons: IconData[];
  addRecentIcon: (icon: IconData) => void;
}

export function useIconSearch(options: UseIconSearchOptions = {}): UseIconSearchReturn {
  const { initialCategory = 'all', debounceMs = 300 } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IconCategory>(initialCategory);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentIcons, setRecentIcons] = useState<IconData[]>([]);

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

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Load recent icons from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recent-category-icons');
        if (stored) {
          const recentIconNames = JSON.parse(stored) as string[];
          const recent = recentIconNames
            .map(name => ICON_REGISTRY.find(icon => icon.name === name))
            .filter((icon): icon is IconData => icon !== undefined);
          setRecentIcons(recent);
        }
      } catch (error) {
        logger.warn('Failed to load recent icons:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }
  }, []);

  // Filter icons based on search query and category
  const filteredIcons = useMemo(() => {
    // Get icons for selected category
    const categoryIcons = getCategoryIcons(selectedCategory);

    if (!debouncedQuery.trim()) {
      // No search query, return all icons in category
      return categoryIcons;
    }

    // Search within the category
    const searchResults = fuse.search(debouncedQuery);
    return searchResults
      .map(result => result.item)
      .filter(icon => selectedCategory === 'all' || icon.category === selectedCategory);
  }, [debouncedQuery, selectedCategory, fuse]);

  // Search statistics
  const searchStats = useMemo(() => ({
    totalResults: filteredIcons.length,
    hasQuery: debouncedQuery.trim().length > 0,
    category: selectedCategory,
  }), [filteredIcons.length, debouncedQuery, selectedCategory]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Add icon to recent list
  const addRecentIcon = useCallback((icon: IconData) => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recent-category-icons');
        const existing = stored ? JSON.parse(stored) as string[] : [];

        // Remove if already exists and add to front
        const filtered = existing.filter(name => name !== icon.name);
        const updated = [icon.name, ...filtered].slice(0, 10); // Keep last 10

        localStorage.setItem('recent-category-icons', JSON.stringify(updated));

        // Update state
        const recent = updated
          .map(name => ICON_REGISTRY.find(i => i.name === name))
          .filter((i): i is IconData => i !== undefined);
        setRecentIcons(recent);
      } catch (error) {
        logger.warn('Failed to save recent icon:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredIcons,
    isSearching,
    searchStats,
    clearSearch,
    recentIcons,
    addRecentIcon,
  };
}