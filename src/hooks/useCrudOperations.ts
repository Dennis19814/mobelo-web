import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface CrudState {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

interface CrudOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  autoHideSuccess?: number; // ms to auto-hide success message (default: 3000)
  autoHideError?: number; // ms to auto-hide error message (default: 5000)
}

/**
 * Custom hook for managing CRUD operations with standardized state management
 *
 * Centralizes loading, error, and success message patterns used across merchant sections.
 * Eliminates ~200 lines of duplicate state management code.
 *
 * @example
 * const { executeOperation, loading, error, successMessage, clearMessages } = useCrudOperations();
 *
 * const handleDelete = async () => {
 *   await executeOperation(
 *     () => apiClient.deleteProduct(id, headers),
 *     {
 *       successMessage: 'Product deleted successfully! ✅',
 *       onSuccess: () => fetchProducts()
 *     }
 *   );
 * };
 */
export function useCrudOperations() {
  const [state, setState] = useState<CrudState>({
    loading: false,
    error: null,
    successMessage: null
  });

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      successMessage: null
    }));
  }, []);

  /**
   * Set error message with auto-hide
   */
  const setError = useCallback((error: string | null, autoHide = 5000) => {
    setState(prev => ({ ...prev, error, successMessage: null }));

    if (error && autoHide > 0) {
      setTimeout(() => {
        setState(prev => prev.error === error ? { ...prev, error: null } : prev);
      }, autoHide);
    }
  }, []);

  /**
   * Set success message with auto-hide
   */
  const setSuccessMessage = useCallback((message: string | null, autoHide = 3000) => {
    setState(prev => ({ ...prev, successMessage: message, error: null }));

    if (message && autoHide > 0) {
      setTimeout(() => {
        setState(prev => prev.successMessage === message ? { ...prev, successMessage: null } : prev);
      }, autoHide);
    }
  }, []);

  /**
   * Execute a CRUD operation with standardized error handling and state management
   *
   * @param operation - Async function to execute (API call)
   * @param options - Configuration options for success/error handling
   * @returns The result of the operation
   */
  const executeOperation = useCallback(async <T = any>(
    operation: () => Promise<T>,
    options: CrudOptions = {}
  ): Promise<T | null> => {
    const {
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      autoHideSuccess = 3000,
      autoHideError = 5000
    } = options;

    // Set loading state
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      successMessage: null
    }));

    try {
      const result = await operation();

      // Set success state
      setState(prev => ({
        ...prev,
        loading: false,
        successMessage: successMessage || null
      }));

      // Auto-hide success message
      if (successMessage && autoHideSuccess > 0) {
        setTimeout(() => {
          setState(prev =>
            prev.successMessage === successMessage
              ? { ...prev, successMessage: null }
              : prev
          );
        }, autoHideSuccess);
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      logger.error('CRUD operation failed', {
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Set error state
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage || errorMsg
      }));

      // Auto-hide error message
      const finalErrorMsg = errorMessage || errorMsg;
      if (autoHideError > 0) {
        setTimeout(() => {
          setState(prev =>
            prev.error === finalErrorMsg
              ? { ...prev, error: null }
              : prev
          );
        }, autoHideError);
      }

      // Call error callback
      if (onError && error instanceof Error) {
        onError(error);
      }

      return null;
    }
  }, []);

  /**
   * Execute multiple operations in parallel
   *
   * @param operations - Array of operations to execute
   * @param options - Configuration options
   * @returns Array of results
   */
  const executeBulkOperation = useCallback(async <T = any>(
    operations: Array<() => Promise<T>>,
    options: CrudOptions = {}
  ): Promise<(T | null)[]> => {
    setState(prev => ({ ...prev, loading: true, error: null, successMessage: null }));

    try {
      const results = await Promise.all(
        operations.map(op => op().catch(err => {
          logger.error('Bulk operation item failed', { error: err });
          return null;
        }))
      );

      const successCount = results.filter(r => r !== null).length;
      const message = options.successMessage ||
        `${successCount} of ${operations.length} operations completed successfully`;

      setState(prev => ({
        ...prev,
        loading: false,
        successMessage: message
      }));

      if (options.autoHideSuccess !== 0) {
        setTimeout(() => {
          setState(prev => ({ ...prev, successMessage: null }));
        }, options.autoHideSuccess || 3000);
      }

      if (options.onSuccess) {
        options.onSuccess();
      }

      return results;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: options.errorMessage || errorMsg
      }));

      return [];
    }
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    successMessage: state.successMessage,
    executeOperation,
    executeBulkOperation,
    setError,
    setSuccessMessage,
    clearMessages
  };
}
