import { useRef, useEffect, useCallback } from 'react';

/**
 * useTimeouts - Centralized timeout management with automatic cleanup
 *
 * Tracks all active timeouts and automatically cleans them up on unmount.
 * Prevents memory leaks from lingering timers.
 *
 * @returns Object with setTimeout, clearTimeout, and clearAll methods
 *
 * @example
 * const timeouts = useTimeouts();
 *
 * // Set a timeout
 * const id = timeouts.setTimeout(() => {
 *   console.log('Executed after 1 second');
 * }, 1000);
 *
 * // Clear specific timeout
 * timeouts.clearTimeout(id);
 *
 * // Clear all timeouts
 * timeouts.clearAll();
 */
export function useTimeouts() {
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const nextIdRef = useRef<number>(0);

  /**
   * Set a timeout with automatic tracking
   *
   * @param callback - Function to execute after delay
   * @param delay - Delay in milliseconds
   * @returns Timeout ID for clearing
   */
  const setManagedTimeout = useCallback((callback: () => void, delay: number): number => {
    const id = nextIdRef.current++;

    const timeout = setTimeout(() => {
      callback();
      // Auto-remove from tracking after execution
      timeoutsRef.current.delete(id);
    }, delay);

    timeoutsRef.current.set(id, timeout);
    return id;
  }, []);

  /**
   * Clear a specific timeout
   *
   * @param id - Timeout ID returned from setTimeout
   */
  const clearManagedTimeout = useCallback((id: number | undefined) => {
    if (id === undefined) return;

    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  /**
   * Clear all active timeouts
   */
  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeoutsRef.current.clear();
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    setTimeout: setManagedTimeout,
    clearTimeout: clearManagedTimeout,
    clearAll,
  };
}
