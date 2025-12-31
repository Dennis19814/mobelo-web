import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce - Debounces a value
 *
 * Returns a debounced version of the value that only updates
 * after the specified delay has passed without changes.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     // Perform search with debounced value
 *     searchProducts(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Creates a debounced callback function
 *
 * Returns a memoized debounced version of the callback that only
 * executes after the specified delay has passed since the last call.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @param deps - Dependency array for callback
 *
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => {
 *     apiService.searchProducts(query);
 *   },
 *   300
 * );
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...deps]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * useThrottle - Throttles a value
 *
 * Returns a throttled version of the value that updates at most
 * once per specified interval.
 *
 * @param value - The value to throttle
 * @param interval - Minimum time between updates in milliseconds (default: 500ms)
 *
 * @example
 * ```tsx
 * const [scrollPosition, setScrollPosition] = useState(0);
 * const throttledScroll = useThrottle(scrollPosition, 100);
 *
 * useEffect(() => {
 *   // Only runs at most every 100ms
 *   updateScrollIndicator(throttledScroll);
 * }, [throttledScroll]);
 * ```
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastExecution);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * useDebouncedSearch - Specialized hook for search inputs
 *
 * Combines debounced value with loading state for search UX.
 *
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 *
 * @example
 * ```tsx
 * const { value, debouncedValue, setValue, isDebouncing } = useDebouncedSearch('', 300);
 *
 * <input
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   placeholder="Search products..."
 * />
 * {isDebouncing && <Spinner />}
 *
 * useEffect(() => {
 *   if (debouncedValue) {
 *     searchProducts(debouncedValue);
 *   }
 * }, [debouncedValue]);
 * ```
 */
export function useDebouncedSearch(initialValue: string = '', delay: number = 300) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);
  const isDebouncing = value !== debouncedValue;

  return {
    value,
    debouncedValue,
    setValue,
    isDebouncing,
    clear: () => setValue(''),
  };
}
