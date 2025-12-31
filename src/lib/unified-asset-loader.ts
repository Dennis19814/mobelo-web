'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect, useMemo } from 'react';

// Unified asset type that can represent both icons and emojis
export interface UnifiedAssetData {
  // Common fields
  id: string;
  type: 'icon' | 'emoji';
  name: string;
  title: string;
  keywords: string[];
  category: string;
  library: string;
  libraryKey: string;

  // Icon-specific fields
  description?: string;
  license?: string;
  website?: string;
  optimized?: boolean;

  // Emoji-specific fields
  unicode?: string;
  shortcode?: string;

  // Display fields
  filePath: string;
  svgContent?: string; // For icons
}

export interface UnifiedAssetMetadata {
  version: string;
  generated: string;
  totalAssets: number;
  libraries: number;
  assets: UnifiedAssetData[];
  categories: string[];
  libraryStats: {
    key: string;
    name: string;
    count: number;
    license?: string;
    website?: string;
    type: 'icon' | 'emoji';
  }[];
}

class UnifiedAssetLoader {
  private metadata: UnifiedAssetMetadata | null = null;
  private iconAssets: UnifiedAssetData[] = [];
  private emojiAssets: UnifiedAssetData[] = [];
  private loading = false;
  private error: string | null = null;

  async loadMetadata(): Promise<UnifiedAssetMetadata | null> {
    if (this.metadata) {
      return this.metadata;
    }

    if (this.loading) {
      // Wait for ongoing load
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.loadMetadata();
    }

    this.loading = true;
    this.error = null;

    try {
      // Load both icon and emoji metadata in parallel
      const [iconResponse, emojiResponse] = await Promise.all([
        fetch('/data/icons-metadata.json'),
        fetch('/data/emojis-metadata.json')
      ]);

      if (!iconResponse.ok || !emojiResponse.ok) {
        throw new Error('Failed to fetch metadata');
      }

      const [iconData, emojiData] = await Promise.all([
        iconResponse.json(),
        emojiResponse.json()
      ]);

      // Transform icon data
      this.iconAssets = iconData.icons.map((icon: any) => ({
        id: `icon-${icon.library}-${icon.name}`,
        type: 'icon' as const,
        name: icon.name,
        title: icon.title || icon.name,
        keywords: icon.keywords || [],
        category: icon.category,
        library: icon.library,
        libraryKey: icon.libraryKey,
        description: icon.description,
        license: icon.license,
        website: icon.website,
        optimized: icon.optimized,
        filePath: icon.filePath
      }));

      // Transform emoji data - treat OpenMoji as a library
      this.emojiAssets = emojiData.emojis.map((emoji: any) => ({
        id: `emoji-${emoji.unicode}`,
        type: 'emoji' as const,
        name: emoji.name,
        title: emoji.name,
        keywords: emoji.shortcode ? [emoji.shortcode] : [],
        category: emoji.category,
        library: 'OpenMoji',
        libraryKey: 'openmoji',
        unicode: emoji.unicode,
        shortcode: emoji.shortcode,
        filePath: emoji.filePath,
        license: 'CC BY-SA 4.0',
        website: 'https://openmoji.org'
      }));

      // Combine all assets
      const allAssets = [...this.iconAssets, ...this.emojiAssets];

      // Get unique categories from both sources
      const allCategories = new Set<string>();
      allAssets.forEach(asset => {
        if (asset.category) {
          allCategories.add(asset.category);
        }
      });

      // Calculate library stats
      const libraryMap = new Map<string, any>();

      // Add icon libraries
      iconData.libraryStats?.forEach((lib: any) => {
        libraryMap.set(lib.key, {
          key: lib.key,
          name: lib.name,
          count: lib.count,
          license: lib.license,
          website: lib.website,
          type: 'icon' as const
        });
      });

      // Add emoji library
      libraryMap.set('openmoji', {
        key: 'openmoji',
        name: 'OpenMoji',
        count: this.emojiAssets.length,
        license: 'CC BY-SA 4.0',
        website: 'https://openmoji.org',
        type: 'emoji' as const
      });

      // Create unified metadata
      this.metadata = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        totalAssets: allAssets.length,
        libraries: libraryMap.size,
        assets: allAssets,
        categories: Array.from(allCategories).sort(),
        libraryStats: Array.from(libraryMap.values())
      };

      logger.debug('[UnifiedAssetLoader] Loaded metadata:', {
        totalAssets: this.metadata.totalAssets,
        iconCount: this.iconAssets.length,
        emojiCount: this.emojiAssets.length,
        libraries: this.metadata.libraries,
        categories: this.metadata.categories.length
      });

      return this.metadata;
    } catch (err) {
      logger.error('[UnifiedAssetLoader] Error loading metadata:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      this.error = err instanceof Error ? err.message : 'Failed to load metadata';
      return null;
    } finally {
      this.loading = false;
    }
  }

  async loadAssetContent(asset: UnifiedAssetData): Promise<string | null> {
    if (asset.type === 'icon' && asset.svgContent) {
      return asset.svgContent;
    }

    try {
      const response = await fetch(`/${asset.filePath}`);
      if (!response.ok) {
        throw new Error(`Failed to load asset: ${response.status}`);
      }
      const content = await response.text();

      // Cache SVG content for icons
      if (asset.type === 'icon') {
        asset.svgContent = content;
      }

      return content;
    } catch (err) {
      logger.error('[UnifiedAssetLoader] Error loading asset content:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      return null;
    }
  }

  searchAssets(
    query: string,
    library?: string,
    category?: string
  ): UnifiedAssetData[] {
    if (!this.metadata) return [];

    let results = this.metadata.assets;

    // Filter by library
    if (library && library !== '' && library !== 'all') {
      results = results.filter(asset => asset.libraryKey === library);
    }

    // Filter by category
    if (category && category !== 'all') {
      results = results.filter(asset => asset.category === category);
    }

    // Search by query
    if (query) {
      const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
      results = results.filter(asset => {
        const searchableText = [
          asset.name,
          asset.title,
          ...asset.keywords,
          asset.category,
          asset.library,
          asset.shortcode || ''
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    return results;
  }

  getLibraries(): Array<{ key: string; name: string; count: number; type: 'icon' | 'emoji' }> {
    if (!this.metadata) return [];
    return this.metadata.libraryStats;
  }

  getCategories(library?: string): string[] {
    if (!this.metadata) return [];

    let assets = this.metadata.assets;

    if (library && library !== '' && library !== 'all') {
      assets = assets.filter(asset => asset.libraryKey === library);
    }

    const categories = new Set<string>();
    assets.forEach(asset => {
      if (asset.category) {
        categories.add(asset.category);
      }
    });

    return Array.from(categories).sort();
  }
}

// Singleton instance
const assetLoader = new UnifiedAssetLoader();

// React hook for using unified assets
export function useUnifiedAssets() {
  const [metadata, setMetadata] = useState<UnifiedAssetMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await assetLoader.loadMetadata();
        setMetadata(data);
      } catch (err) {
        logger.error('[useUnifiedAssets] Error:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
        setError(err instanceof Error ? err.message : 'Failed to load assets');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const searchAssets = useMemo(() => {
    return (query: string, library?: string, category?: string) => {
      return assetLoader.searchAssets(query, library, category);
    };
  }, []);

  const loadAssetContent = useMemo(() => {
    return (asset: UnifiedAssetData) => {
      return assetLoader.loadAssetContent(asset);
    };
  }, []);

  return {
    metadata,
    loading,
    error,
    searchAssets,
    loadAssetContent,
    libraries: metadata?.libraryStats || [],
    categories: metadata?.categories || []
  };
}

// Component for rendering a unified asset (icon or emoji)
export interface UnifiedAssetProps {
  asset: UnifiedAssetData;
  size?: number;
  className?: string;
}

export async function renderUnifiedAsset(asset: UnifiedAssetData, size: number = 24): Promise<string> {
  if (asset.type === 'emoji') {
    return `<img src="/${asset.filePath}" alt="${asset.name}" width="${size}" height="${size}" />`;
  }

  // For icons, load and return SVG content
  const content = await assetLoader.loadAssetContent(asset);
  if (content) {
    // Parse and modify SVG size
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (svg) {
      svg.setAttribute('width', size.toString());
      svg.setAttribute('height', size.toString());
      return svg.outerHTML;
    }
  }

  return '';
}

export default assetLoader;