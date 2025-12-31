'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api-service';
import { TaxOptionsMetadata } from '@/types/tax.types';

export interface UseTaxOptionsOptions {}

export interface UseTaxOptionsReturn {
  options: TaxOptionsMetadata | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTaxOptions(optionsConfig: UseTaxOptionsOptions = {}): UseTaxOptionsReturn {
  const [options, setOptions] = useState<TaxOptionsMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tax options metadata
  const fetchOptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getTaxOptions();

      if (response.ok) {
        setOptions(response.data);
      } else {
        throw new Error('Failed to fetch tax options');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    isLoading,
    error,
    refetch: fetchOptions,
  };
}
