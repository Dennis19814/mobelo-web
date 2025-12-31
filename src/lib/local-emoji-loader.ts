import { logger } from '@/lib/logger'
/**
 * Local Emoji Loader
 *
 * Handles loading and managing locally stored SVG emojis
 * Similar architecture to the icon loader but for emojis
 */

import { useState, useEffect, useMemo } from 'react';

// Types
export interface LocalEmojiData {
  unicode: string;          // Unicode codepoint (e.g., "1F600")
  name: string;             // Human readable name (e.g., "grinning face")
  shortcode: string;        // Shortcode format (e.g., ":grinning:")
  category: string;         // E-commerce category (e.g., "emotions-reactions")
  subcategory: string;      // Original emoji subcategory
  keywords: string[];       // Search keywords
  tags: string[];          // Additional tags
  version: string;         // Unicode version
  source: string;          // Source library name
  sourceKey: string;       // Source key (e.g., "openmoji")
  license: string;         // License information
  website: string;         // Source website
  filePath: string;        // Path to SVG file
  optimized: boolean;      // Whether SVG is optimized
}

export interface EmojiMetadata {
  version: string;
  generated: string;
  totalEmojis: number;
  sources: number;
  emojis: LocalEmojiData[];
  categories: string[];
  categoryInfo: Record<string, {
    name: string;
    description: string;
    keywords: string[];
  }>;
  sourceStats: {
    key: string;
    name: string;
    count: number;
    license: string;
    website: string;
  }[];
  // Chunking info
  chunksInfo?: {
    totalChunks: number;
    emojisPerChunk: number;
    chunkSize: number;
  };
}

export interface EmojiChunk {
  category: string;
  chunkIndex: number;
  totalChunks: number;
  emojis: LocalEmojiData[];
  startIndex: number;
  endIndex: number;
  count: number;
}

export interface CategoryIndex {
  [category: string]: {
    totalEmojis: number;
    chunks: number;
    files: string[];
  };
}

export interface PopularCache {
  generated: string;
  count: number;
  categories: string[];
  emojis: LocalEmojiData[];
}

export type EmojiCategory = string;

// Emoji loader class
class LocalEmojiLoader {
  private metadata: EmojiMetadata | null = null;
  private lightMetadata: Partial<EmojiMetadata> | null = null;
  private categoryIndex: CategoryIndex | null = null;
  private popularCache: PopularCache | null = null;
  private emojiCache: Map<string, string> = new Map();
  private chunkCache: Map<string, EmojiChunk> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();
  private chunkLoadingPromises: Map<string, Promise<EmojiChunk>> = new Map();
  private metadataLoadingPromise: Promise<EmojiMetadata> | null = null;

  async loadMetadata(): Promise<EmojiMetadata> {
    if (this.metadata) {
      return this.metadata;
    }

    if (this.metadataLoadingPromise) {
      return this.metadataLoadingPromise;
    }

    this.metadataLoadingPromise = this.fetchLightMetadataAndBuildFull();
    return this.metadataLoadingPromise;
  }

  private async fetchLightMetadataAndBuildFull(): Promise<EmojiMetadata> {
    try {
      // Load light metadata first
      const lightMetadata = await this.loadLightMetadata();

      // For full metadata, we need to load all chunks
      // This is only used for search operations that need all emojis
      logger.debug('Building full metadata from chunks...');
      const allEmojis: LocalEmojiData[] = [];

      const categoryIndex = await this.loadCategoryIndex();

      // Load all chunks to build full metadata
      for (const category of lightMetadata.categories || []) {
        const categoryInfo = categoryIndex[category];
        if (categoryInfo) {
          for (const chunkFile of categoryInfo.files) {
            try {
              const chunk = await this.loadChunk(chunkFile);
              allEmojis.push(...chunk.emojis);
            } catch (error) {
              logger.warn(`Failed to load chunk ${chunkFile}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
            }
          }
        }
      }

      this.metadata = {
        ...lightMetadata,
        emojis: allEmojis
      } as EmojiMetadata;

      logger.debug(`Built full metadata with ${allEmojis.length} emojis from chunks`);
      return this.metadata;
    } catch (error) {
      logger.error('Failed to build full emoji metadata:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      this.metadataLoadingPromise = null;
      throw error;
    }
  }

  // Quick metadata for immediate UI needs
  async loadLightMetadata(): Promise<Partial<EmojiMetadata>> {
    if (this.lightMetadata) {
      return this.lightMetadata;
    }

    try {
      logger.debug('Loading light emoji metadata...');
      const response = await fetch('/data/emoji-metadata-light.json');
      if (!response.ok) {
        throw new Error(`Failed to load light emoji metadata: ${response.status}`);
      }
      this.lightMetadata = await response.json();
      logger.debug(`Loaded light metadata for ${this.lightMetadata!.totalEmojis} emojis`);
      return this.lightMetadata!;
    } catch (error) {
      logger.error('Failed to load light emoji metadata:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  }

  // Load category index for chunk information
  async loadCategoryIndex(): Promise<CategoryIndex> {
    if (this.categoryIndex) {
      return this.categoryIndex;
    }

    try {
      const response = await fetch('/data/emoji-category-index.json');
      if (!response.ok) {
        throw new Error(`Failed to load category index: ${response.status}`);
      }
      this.categoryIndex = await response.json();
      return this.categoryIndex!;
    } catch (error) {
      logger.error('Failed to load category index:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  }

  // Load popular emojis cache
  async loadPopularCache(): Promise<PopularCache> {
    if (this.popularCache) {
      return this.popularCache;
    }

    try {
      const response = await fetch('/data/emoji-popular-cache.json');
      if (!response.ok) {
        throw new Error(`Failed to load popular cache: ${response.status}`);
      }
      this.popularCache = await response.json();
      return this.popularCache!;
    } catch (error) {
      logger.error('Failed to load popular cache:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  }

  // Load a specific emoji chunk
  private async loadChunk(chunkFile: string): Promise<EmojiChunk> {
    if (this.chunkCache.has(chunkFile)) {
      return this.chunkCache.get(chunkFile)!;
    }

    if (this.chunkLoadingPromises.has(chunkFile)) {
      return this.chunkLoadingPromises.get(chunkFile)!;
    }

    const loadPromise = this.fetchChunk(chunkFile);
    this.chunkLoadingPromises.set(chunkFile, loadPromise);

    try {
      const chunk = await loadPromise;
      this.chunkCache.set(chunkFile, chunk);
      return chunk;
    } finally {
      this.chunkLoadingPromises.delete(chunkFile);
    }
  }

  private async fetchChunk(chunkFile: string): Promise<EmojiChunk> {
    try {
      const response = await fetch(`/data/emoji-chunks/${chunkFile}`);
      if (!response.ok) {
        throw new Error(`Failed to load chunk ${chunkFile}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      logger.error(`Failed to fetch chunk ${chunkFile}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      throw error;
    }
  }

  async loadEmojiSvg(emojiData: LocalEmojiData): Promise<string> {
    const emojiKey = `${emojiData.sourceKey}/${emojiData.unicode}`;

    // Return cached SVG if available
    if (this.emojiCache.has(emojiKey)) {
      return this.emojiCache.get(emojiKey)!;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(emojiKey)) {
      return this.loadingPromises.get(emojiKey)!;
    }

    // Start loading the SVG
    const loadPromise = this.fetchEmojiSvg(emojiData);
    this.loadingPromises.set(emojiKey, loadPromise);

    try {
      const svg = await loadPromise;
      this.emojiCache.set(emojiKey, svg);
      return svg;
    } finally {
      this.loadingPromises.delete(emojiKey);
    }
  }

  private async fetchEmojiSvg(emojiData: LocalEmojiData): Promise<string> {
    try {
      const response = await fetch(`/${emojiData.filePath}`);
      if (!response.ok) {
        throw new Error(`Failed to load emoji: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      logger.error(`Failed to load emoji ${emojiData.name}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      // Return a fallback emoji SVG
      return this.getFallbackSvg();
    }
  }

  private getFallbackSvg(): string {
    // Simple smiley face fallback
    return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#FFCC4D"/>
      <circle cx="20" cy="24" r="6" fill="#664500"/>
      <circle cx="44" cy="24" r="6" fill="#664500"/>
      <path d="M20 40 Q32 50 44 40" stroke="#664500" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>`;
  }

  async searchEmojis(
    query: string,
    category: EmojiCategory = 'all',
    source?: string,
    limit?: number
  ): Promise<LocalEmojiData[]> {
    const maxResults = limit || 100; // Smaller default limit

    try {
      if (!query.trim()) {
        // No search query, return batch results
        return await this.getEmojisBatch(category, source, 0, maxResults);
      }

      const lowercaseQuery = query.toLowerCase().trim();
      const results: LocalEmojiData[] = [];

      if (category !== 'all') {
        // Search within specific category
        const categoryIndex = await this.loadCategoryIndex();
        const categoryInfo = categoryIndex[category];

        if (categoryInfo) {
          for (const chunkFile of categoryInfo.files) {
            if (results.length >= maxResults) break;

            try {
              const chunk = await this.loadChunk(chunkFile);
              let chunkEmojis = chunk.emojis;

              if (source) {
                chunkEmojis = chunkEmojis.filter(emoji => emoji.sourceKey === source);
              }

              // Search within chunk
              for (const emoji of chunkEmojis) {
                if (results.length >= maxResults) break;

                const searchableText = [
                  emoji.name,
                  emoji.shortcode,
                  ...emoji.keywords,
                  ...emoji.tags
                ].join(' ').toLowerCase();

                if (searchableText.includes(lowercaseQuery)) {
                  results.push(emoji);
                }
              }
            } catch (error) {
              logger.warn(`Failed to search in chunk ${chunkFile}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
            }
          }
        }
      } else {
        // Search across all categories
        const lightMetadata = await this.loadLightMetadata();
        const categoryIndex = await this.loadCategoryIndex();

        for (const cat of lightMetadata.categories || []) {
          if (results.length >= maxResults) break;

          const categoryInfo = categoryIndex[cat];
          if (categoryInfo) {
            // Load only first chunk of each category for cross-category search
            const chunkFile = categoryInfo.files[0];
            if (chunkFile) {
              try {
                const chunk = await this.loadChunk(chunkFile);
                let chunkEmojis = chunk.emojis;

                if (source) {
                  chunkEmojis = chunkEmojis.filter(emoji => emoji.sourceKey === source);
                }

                // Search within chunk
                for (const emoji of chunkEmojis) {
                  if (results.length >= maxResults) break;

                  const searchableText = [
                    emoji.name,
                    emoji.shortcode,
                    ...emoji.keywords,
                    ...emoji.tags
                  ].join(' ').toLowerCase();

                  if (searchableText.includes(lowercaseQuery)) {
                    results.push(emoji);
                  }
                }
              } catch (error) {
                logger.warn(`Failed to search in chunk ${chunkFile}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
              }
            }
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to search emojis:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return [];
    }
  }

  getCategories(): string[] {
    return this.metadata?.categories || [];
  }

  getCategoryInfo(): EmojiMetadata['categoryInfo'] {
    return this.metadata?.categoryInfo || {};
  }

  getSources(): EmojiMetadata['sourceStats'] {
    return this.metadata?.sourceStats || [];
  }

  async getEmojisByCategory(category: string): Promise<LocalEmojiData[]> {
    try {
      const categoryIndex = await this.loadCategoryIndex();
      const categoryInfo = categoryIndex[category];

      if (!categoryInfo) {
        return [];
      }

      const results: LocalEmojiData[] = [];

      // Load all chunks for this category
      for (const chunkFile of categoryInfo.files) {
        try {
          const chunk = await this.loadChunk(chunkFile);
          results.push(...chunk.emojis);
        } catch (error) {
          logger.warn(`Failed to load chunk ${chunkFile}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        }
      }

      return results;
    } catch (error) {
      logger.error(`Failed to get emojis for category ${category}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return [];
    }
  }

  getEmojiByUnicode(unicode: string, source?: string): LocalEmojiData | undefined {
    if (!this.metadata) return undefined;
    return this.metadata.emojis.find(emoji =>
      emoji.unicode === unicode && (!source || emoji.sourceKey === source)
    );
  }

  getEmojiByShortcode(shortcode: string, source?: string): LocalEmojiData | undefined {
    if (!this.metadata) return undefined;
    return this.metadata.emojis.find(emoji =>
      emoji.shortcode === shortcode && (!source || emoji.sourceKey === source)
    );
  }

  async getPopularEmojis(limit: number = 20): Promise<LocalEmojiData[]> {
    try {
      const popularCache = await this.loadPopularCache();
      return popularCache.emojis.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get popular emojis:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return [];
    }
  }

  // Get emojis in batches for pagination using chunks
  async getEmojisBatch(
    category: string = 'all',
    source?: string,
    offset: number = 0,
    limit: number = 100
  ): Promise<LocalEmojiData[]> {
    try {
      if (category === 'all') {
        // For all categories, we need to load chunks across categories
        return await this.loadMixedBatch(offset, limit, source);
      } else {
        // For specific category, load from its chunks
        return await this.loadCategoryBatch(category, offset, limit, source);
      }
    } catch (error) {
      logger.error('Failed to get emojis batch:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return [];
    }
  }

  private async loadCategoryBatch(
    category: string,
    offset: number,
    limit: number,
    source?: string
  ): Promise<LocalEmojiData[]> {
    const categoryIndex = await this.loadCategoryIndex();
    const categoryInfo = categoryIndex[category];

    if (!categoryInfo) {
      return [];
    }

    const result: LocalEmojiData[] = [];
    let currentOffset = offset;
    let remaining = limit;

    // Calculate which chunks we need
    const chunkSize = 200; // From our split script
    const startChunk = Math.floor(offset / chunkSize);
    const endChunk = Math.min(
      categoryInfo.chunks - 1,
      Math.floor((offset + limit - 1) / chunkSize)
    );

    for (let chunkIndex = startChunk; chunkIndex <= endChunk && remaining > 0; chunkIndex++) {
      const chunkFile = categoryInfo.files[chunkIndex];
      if (!chunkFile) continue;

      try {
        const chunk = await this.loadChunk(chunkFile);
        let chunkEmojis = chunk.emojis;

        // Filter by source if specified
        if (source) {
          chunkEmojis = chunkEmojis.filter(emoji => emoji.sourceKey === source);
        }

        // Apply offset and limit within this chunk
        const chunkOffset = Math.max(0, currentOffset - (chunkIndex * chunkSize));
        const chunkLimit = Math.min(remaining, chunkEmojis.length - chunkOffset);

        if (chunkOffset < chunkEmojis.length) {
          const chunkResult = chunkEmojis.slice(chunkOffset, chunkOffset + chunkLimit);
          result.push(...chunkResult);
          remaining -= chunkResult.length;
        }

        currentOffset = Math.max(0, currentOffset - chunkEmojis.length);
      } catch (error) {
        logger.warn(`Failed to load chunk ${chunkFile}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }

    return result;
  }

  private async loadMixedBatch(
    offset: number,
    limit: number,
    source?: string
  ): Promise<LocalEmojiData[]> {
    // For mixed category batches, use popular cache first, then load more if needed
    if (offset === 0) {
      try {
        const popularCache = await this.loadPopularCache();
        let result = popularCache.emojis;

        if (source) {
          result = result.filter(emoji => emoji.sourceKey === source);
        }

        if (result.length >= limit) {
          return result.slice(0, limit);
        }

        // If popular cache doesn't have enough, fall back to loading more chunks
        const remaining = limit - result.length;
        const additionalEmojis = await this.loadAdditionalEmojis(remaining, source, result);
        return [...result, ...additionalEmojis].slice(0, limit);
      } catch (error) {
        logger.error('Failed to load mixed batch:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }

    // For non-zero offsets or fallback, load chunks sequentially
    return await this.loadSequentialBatch(offset, limit, source);
  }

  private async loadAdditionalEmojis(
    needed: number,
    source?: string,
    exclude: LocalEmojiData[] = []
  ): Promise<LocalEmojiData[]> {
    const result: LocalEmojiData[] = [];
    const excludeSet = new Set(exclude.map(e => `${e.sourceKey}:${e.unicode}`));

    try {
      const lightMetadata = await this.loadLightMetadata();
      const categoryIndex = await this.loadCategoryIndex();

      // Load from first chunk of each category until we have enough
      for (const category of lightMetadata.categories || []) {
        if (result.length >= needed) break;

        const categoryInfo = categoryIndex[category];
        if (categoryInfo && categoryInfo.files.length > 0) {
          try {
            const chunk = await this.loadChunk(categoryInfo.files[0]);
            let chunkEmojis = chunk.emojis;

            if (source) {
              chunkEmojis = chunkEmojis.filter(emoji => emoji.sourceKey === source);
            }

            // Add emojis that aren't already included
            for (const emoji of chunkEmojis) {
              if (result.length >= needed) break;
              const key = `${emoji.sourceKey}:${emoji.unicode}`;
              if (!excludeSet.has(key)) {
                result.push(emoji);
                excludeSet.add(key);
              }
            }
          } catch (error) {
            logger.warn(`Failed to load chunk for category ${category}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load additional emojis:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    }

    return result;
  }

  private async loadSequentialBatch(
    offset: number,
    limit: number,
    source?: string
  ): Promise<LocalEmojiData[]> {
    // This is a fallback that loads chunks sequentially
    // In a real implementation, you might want to optimize this further
    try {
      const lightMetadata = await this.loadLightMetadata();
      const categoryIndex = await this.loadCategoryIndex();

      const allEmojis: LocalEmojiData[] = [];

      // Load first few chunks from each category to get a reasonable sample
      for (const category of lightMetadata.categories || []) {
        const categoryInfo = categoryIndex[category];
        if (categoryInfo && categoryInfo.files.length > 0) {
          try {
            // Load first chunk of each category
            const chunk = await this.loadChunk(categoryInfo.files[0]);
            let chunkEmojis = chunk.emojis;

            if (source) {
              chunkEmojis = chunkEmojis.filter(emoji => emoji.sourceKey === source);
            }

            allEmojis.push(...chunkEmojis);
          } catch (error) {
            logger.warn(`Failed to load chunk for category ${category}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
          }
        }
      }

      return allEmojis.slice(offset, offset + limit);
    } catch (error) {
      logger.error('Failed to load sequential batch:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return [];
    }
  }

  getTotalEmojiCount(): number {
    return this.metadata?.totalEmojis || 0;
  }

  clearCache(): void {
    this.emojiCache.clear();
    this.loadingPromises.clear();
  }
}

// Singleton instance
export const emojiLoader = new LocalEmojiLoader();

// React hooks for using the emoji loader
export function useEmojiMetadata() {
  const [metadata, setMetadata] = useState<EmojiMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await emojiLoader.loadMetadata();
        setMetadata(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load emoji metadata');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { metadata, loading, error };
}

// Light metadata hook for immediate UI needs
export function useLightEmojiMetadata() {
  const [metadata, setMetadata] = useState<Partial<EmojiMetadata> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await emojiLoader.loadLightMetadata();
        setMetadata(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load emoji metadata');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { metadata, loading, error };
}

export function useEmojiSearch(
  query: string,
  category: string = 'all',
  source?: string,
  limit?: number
) {
  const { metadata } = useLightEmojiMetadata(); // Use light metadata
  const [results, setResults] = useState<LocalEmojiData[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      setSearching(true);
      try {
        logger.debug('[useEmojiSearch] Searching:', { query, category, source, limit });
        const searchResults = await emojiLoader.searchEmojis(query, category, source, limit);
        logger.debug('[useEmojiSearch] Search results:', { value: searchResults.length });
        setResults(searchResults);
      } catch (error) {
        logger.error('[useEmojiSearch] Search error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // Slightly longer debounce for async operations

    return () => clearTimeout(searchTimeout);
  }, [query, category, source, limit]);

  return { results, searching };
}

// Batch emoji hook for pagination
export function useEmojisBatch(
  category: string = 'all',
  source?: string,
  offset: number = 0,
  limit: number = 100
) {
  const { metadata } = useLightEmojiMetadata(); // Use light metadata
  const [results, setResults] = useState<LocalEmojiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't wait for full metadata, proceed with loading
    let isMounted = true;

    const loadBatch = async () => {
      try {
        setLoading(true);
        logger.debug('[useEmojisBatch] Loading batch:', { category, source, offset, limit });
        const batchResults = await emojiLoader.getEmojisBatch(category, source, offset, limit);
        logger.debug('[useEmojisBatch] Batch results:', { value: batchResults.length });
        if (isMounted) {
          setResults(batchResults);
        }
      } catch (error) {
        logger.error('[useEmojisBatch] Batch loading error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        if (isMounted) {
          setResults([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBatch();

    return () => {
      isMounted = false;
    };
  }, [category, source, offset, limit]);

  return { results, loading };
}

export function useEmojiSvg(emojiData: LocalEmojiData | null) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!emojiData) {
      setSvg(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadSvg = async () => {
      try {
        setLoading(true);
        setError(null);
        const svgContent = await emojiLoader.loadEmojiSvg(emojiData);
        if (isMounted) {
          setSvg(svgContent);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load emoji SVG');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSvg();

    return () => {
      isMounted = false;
    };
  }, [emojiData]);

  return { svg, loading, error };
}

// Utility functions
export function createEmojiUrl(emojiData: LocalEmojiData): string {
  return `/${emojiData.filePath}`;
}

export function getEmojiKey(emojiData: LocalEmojiData): string {
  return `${emojiData.sourceKey}:${emojiData.unicode}`;
}

export function parseEmojiKey(emojiKey: string): { source: string; unicode: string } | null {
  const parts = emojiKey.split(':');
  if (parts.length !== 2) return null;
  return { source: parts[0], unicode: parts[1] };
}

export default emojiLoader;