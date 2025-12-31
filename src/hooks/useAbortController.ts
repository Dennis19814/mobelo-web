import { useEffect, useRef } from 'react';

/**
 * useAbortController - Centralized AbortController management with automatic cleanup
 *
 * Manages AbortControllers for cancelling API requests. Automatically aborts
 * all pending requests on component unmount, preventing memory leaks and race conditions.
 *
 * @returns Object with getSignal and abortAll methods
 *
 * @example
 * const abortController = useAbortController();
 *
 * // Use in API call
 * const fetchData = async () => {
 *   try {
 *     const response = await fetch('/api/data', {
 *       signal: abortController.getSignal()
 *     });
 *     const data = await response.json();
 *   } catch (error) {
 *     if (error.name === 'AbortError') {
 *       // Request was cancelled - this is expected behavior
 *       return;
 *     }
 *     // Handle other errors
 *   }
 * };
 *
 * // Manually abort all requests
 * abortController.abortAll();
 */
export function useAbortController() {
  const controllersRef = useRef<AbortController[]>([]);

  /**
   * Get a new AbortSignal for an API request
   *
   * Creates a new AbortController, tracks it, and returns its signal.
   * The controller will be automatically aborted on unmount.
   *
   * @returns AbortSignal to pass to fetch/axios
   */
  const getSignal = (): AbortSignal => {
    const controller = new AbortController();
    controllersRef.current.push(controller);
    return controller.signal;
  };

  /**
   * Abort all pending requests
   *
   * Aborts all active AbortControllers and clears the tracking list.
   * Useful for manually cancelling requests or resetting state.
   */
  const abortAll = (): void => {
    controllersRef.current.forEach((controller) => {
      controller.abort();
    });
    controllersRef.current = [];
  };

  // Cleanup: abort all pending requests on unmount
  useEffect(() => {
    return () => {
      abortAll();
    };
  }, []);

  return {
    getSignal,
    abortAll,
  };
}
