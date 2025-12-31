import { logger } from '@/lib/logger'
/**
 * Local Icon Loader
 *
 * Handles loading and managing locally stored SVG icons
 * Replaces react-icons dependency with local SVG files
 */

import { useState, useEffect, useMemo } from 'react';

// Types
export interface LocalIconData {
  name: string;
  library: string;
  libraryKey: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  license: string;
  website: string;
  filePath: string;
  optimized: boolean;
}

export interface IconMetadata {
  version: string;
  generated: string;
  totalIcons: number;
  libraries: number;
  icons: LocalIconData[];
  categories: string[];
  libraryStats: {
    key: string;
    name: string;
    count: number;
    license: string;
    website: string;
  }[];
}

export type IconCategory = string;

// Icon loader class
class LocalIconLoader {
  private metadata: IconMetadata | null = null;
  private iconCache: Map<string, string> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();

  async loadMetadata(): Promise<IconMetadata> {
    if (this.metadata) {
      return this.metadata;
    }

    try {
      const response = await fetch('/data/icons-metadata.json');
      if (!response.ok) {
        throw new Error(`Failed to load metadata: ${response.status}`);
      }
      this.metadata = await response.json();
      return this.metadata!;
    } catch (error) {
      logger.error('Failed to load icon metadata:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  }

  async loadIconSvg(iconData: LocalIconData): Promise<string> {
    const iconKey = `${iconData.libraryKey}/${iconData.name}`;

    // Return cached SVG if available
    if (this.iconCache.has(iconKey)) {
      return this.iconCache.get(iconKey)!;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(iconKey)) {
      return this.loadingPromises.get(iconKey)!;
    }

    // Start loading the SVG
    const loadPromise = this.fetchIconSvg(iconData);
    this.loadingPromises.set(iconKey, loadPromise);

    try {
      const svg = await loadPromise;
      this.iconCache.set(iconKey, svg);
      return svg;
    } finally {
      this.loadingPromises.delete(iconKey);
    }
  }

  private async fetchIconSvg(iconData: LocalIconData): Promise<string> {
    try {
      // Ensure the path doesn't have double slashes and starts with /
      const filePath = iconData.filePath.startsWith('/')
        ? iconData.filePath
        : `/${iconData.filePath}`;

      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load icon: ${response.status} for path: ${filePath}`);
      }
      return await response.text();
    } catch (error) {
      logger.error(`Failed to load icon ${iconData.name} from ${iconData.filePath}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      // Return a fallback SVG
      return this.getFallbackSvg();
    }
  }

  private getFallbackSvg(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>`;
  }

  searchIcons(
    query: string,
    category: IconCategory = 'all',
    library?: string
  ): LocalIconData[] {
    if (!this.metadata) {
      return [];
    }

    let icons = this.metadata.icons;

    // Filter by category
    if (category !== 'all') {
      icons = icons.filter(icon => icon.category === category);
    }

    // Filter by library
    if (library) {
      icons = icons.filter(icon => icon.libraryKey === library);
    }

    // Search query
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase().trim();
      icons = icons.filter(icon => {
        const searchableText = [
          icon.name,
          icon.title,
          icon.description,
          ...icon.keywords
        ].join(' ').toLowerCase();

        return searchableText.includes(lowercaseQuery);
      });
    }

    return icons;
  }

  getCategories(): string[] {
    return this.metadata?.categories || [];
  }

  getLibraries(): IconMetadata['libraryStats'] {
    return this.metadata?.libraryStats || [];
  }

  getIconsByCategory(category: string): LocalIconData[] {
    if (!this.metadata) return [];
    return this.metadata.icons.filter(icon => icon.category === category);
  }

  getIconByName(name: string, library?: string): LocalIconData | undefined {
    if (!this.metadata) return undefined;
    return this.metadata.icons.find(icon =>
      icon.name === name && (!library || icon.libraryKey === library)
    );
  }

  getPopularIcons(limit: number = 20): LocalIconData[] {
    if (!this.metadata) return [];

    // For now, return first icons from each library
    // In future, this could be based on usage analytics
    const iconsPerLibrary = Math.ceil(limit / this.metadata.libraryStats.length);
    const popularIcons: LocalIconData[] = [];

    this.metadata.libraryStats.forEach(libStat => {
      const libIcons = this.metadata!.icons
        .filter(icon => icon.libraryKey === libStat.key)
        .slice(0, iconsPerLibrary);
      popularIcons.push(...libIcons);
    });

    return popularIcons.slice(0, limit);
  }

  getTotalIconCount(): number {
    return this.metadata?.totalIcons || 0;
  }

  clearCache(): void {
    this.iconCache.clear();
    this.loadingPromises.clear();
  }
}

// Singleton instance
export const iconLoader = new LocalIconLoader();

// React hooks for using the icon loader
export function useIconMetadata() {
  const [metadata, setMetadata] = useState<IconMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    iconLoader.loadMetadata()
      .then(setMetadata)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { metadata, loading, error };
}

export function useIconSearch(query: string, category: string = 'all', library?: string) {
  const { metadata } = useIconMetadata();

  const results = useMemo(() => {
    if (!metadata) return [];
    return iconLoader.searchIcons(query, category, library);
  }, [metadata, query, category, library]);

  return results;
}

export function useIconSvg(iconData: LocalIconData | null) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iconData) {
      setSvg(null);
      return;
    }

    setLoading(true);
    setError(null);

    iconLoader.loadIconSvg(iconData)
      .then(setSvg)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [iconData]);

  return { svg, loading, error };
}

// Utility functions
export function createIconUrl(iconData: LocalIconData): string {
  return `/${iconData.filePath}`;
}

export function getIconKey(iconData: LocalIconData): string {
  return `${iconData.libraryKey}:${iconData.name}`;
}

export function parseIconKey(iconKey: string): { library: string; name: string } | null {
  const parts = iconKey.split(':');
  if (parts.length !== 2) return null;
  return { library: parts[0], name: parts[1] };
}

export default iconLoader;