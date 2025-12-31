'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api-service';
import { TaxRule, TaxRuleFormData } from '@/types/tax.types';

export interface UseTaxRulesOptions {
  filters?: {
    taxCategoryId?: number;
    country?: string;
    isActive?: boolean;
  };
}

export interface UseTaxRulesReturn {
  rules: TaxRule[];
  isLoading: boolean;
  error: string | null;
  createRule: (data: TaxRuleFormData) => Promise<TaxRule | null>;
  updateRule: (id: number, data: TaxRuleFormData) => Promise<TaxRule | null>;
  deleteRule: (id: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useTaxRules(options: UseTaxRulesOptions = {}): UseTaxRulesReturn {
  const { filters } = options;

  const [rules, setRules] = useState<TaxRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tax rules
  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getTaxRules(filters);

      if (response.ok) {
        setRules(response.data || []);
      } else {
        throw new Error('Failed to fetch tax rules');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Create tax rule
  const createRule = useCallback(async (data: TaxRuleFormData): Promise<TaxRule | null> => {
    try {
      setError(null);

      const response = await apiService.createTaxRule(data);

      if (response.ok && response.data) {
        const newRule = response.data;

        // Optimistic update
        setRules(prev => [...prev, newRule]);

        // Refetch to ensure correct order
        await fetchRules();

        return newRule;
      } else {
        throw new Error('Failed to create tax rule');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tax rule';
      setError(errorMessage);
      return null;
    }
  }, [fetchRules]);

  // Update tax rule
  const updateRule = useCallback(async (id: number, data: TaxRuleFormData): Promise<TaxRule | null> => {
    try {
      setError(null);

      const response = await apiService.updateTaxRule(id, data);

      if (response.ok && response.data) {
        const updatedRule = response.data;

        // Optimistic update
        setRules(prev =>
          prev.map(rule => rule.id === id ? updatedRule : rule)
        );

        return updatedRule;
      } else {
        throw new Error('Failed to update tax rule');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tax rule';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Delete tax rule
  const deleteRule = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);

      const response = await apiService.deleteTaxRule(id);

      if (response.ok) {
        // Optimistic update
        setRules(prev => prev.filter(rule => rule.id !== id));
        return true;
      } else {
        throw new Error('Failed to delete tax rule');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tax rule';
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    rules,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    refetch: fetchRules,
  };
}
