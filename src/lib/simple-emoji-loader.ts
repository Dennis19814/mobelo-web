'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react';

export interface SimpleEmojiData {
  unicode: string;
  name: string;
  shortcode: string;
  category: string;
  filePath: string;
}

// Simple emoji loader that loads directly from the full metadata
class SimpleEmojiLoader {
  private emojis: SimpleEmojiData[] = [];
  private loaded = false;

  async loadEmojis(): Promise<SimpleEmojiData[]> {
    if (this.loaded) {
      logger.debug('[SimpleEmojiLoader] Returning cached emojis:', { value: this.emojis.length });
      return this.emojis;
    }

    try {
      logger.debug('[SimpleEmojiLoader] Fetching emoji metadata...');
      const response = await fetch('/data/emojis-metadata.json');
      logger.debug('[SimpleEmojiLoader] Response status:', { value: response.status });

      const data = await response.json();
      logger.debug('[SimpleEmojiLoader] Loaded data with', { count: data.emojis?.length, unit: 'emojis' });

      // Extract just the essential data
      this.emojis = data.emojis.map((e: any) => ({
        unicode: e.unicode,
        name: e.name,
        shortcode: e.shortcode,
        category: e.category,
        filePath: e.filePath
      }));

      this.loaded = true;
      logger.debug('[SimpleEmojiLoader] Processed', { count: this.emojis.length, unit: 'emojis' });
      return this.emojis;
    } catch (error) {
      logger.error('[SimpleEmojiLoader] Failed to load emojis:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return [];
    }
  }

  getEmojis(): SimpleEmojiData[] {
    return this.emojis;
  }

  getCategories(): string[] {
    const categories = new Set(this.emojis.map(e => e.category));
    return Array.from(categories);
  }

  searchEmojis(query: string, category?: string): SimpleEmojiData[] {
    let results = this.emojis;

    if (category && category !== 'all') {
      results = results.filter(e => e.category === category);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(e =>
        e.name.toLowerCase().includes(lowerQuery) ||
        e.shortcode.toLowerCase().includes(lowerQuery)
      );
    }

    return results;
  }
}

export const simpleEmojiLoader = new SimpleEmojiLoader();

// React hook for using emojis
export function useSimpleEmojis() {
  const [emojis, setEmojis] = useState<SimpleEmojiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await simpleEmojiLoader.loadEmojis();
        if (mounted) {
          setEmojis(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load emojis');
          setEmojis([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return { emojis, loading, error };
}