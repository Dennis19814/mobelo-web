import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateCount: number;
}

/**
 * usePerformanceMonitor - Monitors component render performance
 *
 * Logs render times and update counts in development.
 * Useful for identifying performance bottlenecks.
 *
 * @param componentName - Name of the component for logging
 * @param enabled - Enable monitoring (default: only in development)
 *
 * @example
 * ```tsx
 * function ProductList() {
 *   usePerformanceMonitor('ProductList');
 *   // ... component code
 * }
 * ```
 */
export function usePerformanceMonitor(
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const lastRenderRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Track mount time
    if (renderCountRef.current === 0) {
      mountTimeRef.current = performance.now();
    }

    renderCountRef.current += 1;
    const renderTime = performance.now() - lastRenderRef.current;

    console.log(`[Performance] ${componentName}:`, {
      renderCount: renderCountRef.current,
      renderTime: renderTime.toFixed(2) + 'ms',
      mountTime: mountTimeRef.current.toFixed(2) + 'ms',
    });

    lastRenderRef.current = performance.now();
  });
}

/**
 * useRenderCount - Tracks how many times a component renders
 *
 * @param componentName - Name of the component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const renderCount = useRenderCount('MyComponent');
 *   console.log('Rendered', renderCount, 'times');
 * }
 * ```
 */
export function useRenderCount(componentName?: string): number {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;

    if (process.env.NODE_ENV === 'development' && componentName) {
      console.log(`[Render Count] ${componentName}: ${renderCount.current}`);
    }
  });

  return renderCount.current;
}

/**
 * useWhyDidYouUpdate - Logs which props/state changed causing re-render
 *
 * @param name - Component name
 * @param props - Props object to track
 *
 * @example
 * ```tsx
 * function ProductCard({ product, onEdit, isSelected }) {
 *   useWhyDidYouUpdate('ProductCard', { product, onEdit, isSelected });
 * }
 * ```
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any> | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current && process.env.NODE_ENV === 'development') {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[Why Did Update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * measureAsync - Measures execution time of async operations
 *
 * @param name - Operation name
 * @param fn - Async function to measure
 *
 * @example
 * ```tsx
 * const loadData = async () => {
 *   await measureAsync('Load Products', async () => {
 *     return await apiService.getProducts(appId);
 *   });
 * };
 * ```
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance Error] ${name}: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * useComponentTime - Measures component lifecycle timing
 *
 * @example
 * ```tsx
 * function ProductList() {
 *   const { mountTime, updateTime } = useComponentTime('ProductList');
 *
 *   return <div>Mount: {mountTime}ms, Update: {updateTime}ms</div>;
 * }
 * ```
 */
export function useComponentTime(componentName: string) {
  const mountTimeRef = useRef<number>(performance.now());
  const renderTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);

  useEffect(() => {
    const mountTime = performance.now() - mountTimeRef.current;

    if (updateCountRef.current === 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Component Time] ${componentName} mounted in ${mountTime.toFixed(2)}ms`);
    }

    updateCountRef.current += 1;
    renderTimeRef.current = performance.now();
  });

  return {
    mountTime: performance.now() - mountTimeRef.current,
    updateTime: updateCountRef.current > 0 ? performance.now() - renderTimeRef.current : 0,
    updateCount: updateCountRef.current,
  };
}

/**
 * useMeasure - Hook to measure callback execution time
 *
 * @example
 * ```tsx
 * const measure = useMeasure();
 *
 * const handleClick = () => {
 *   measure('Button Click', () => {
 *     // Expensive operation
 *     processData();
 *   });
 * };
 * ```
 */
export function useMeasure() {
  return useCallback((name: string, fn: () => void) => {
    const start = performance.now();
    try {
      fn();
    } finally {
      const duration = performance.now() - start;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Measure] ${name}: ${duration.toFixed(2)}ms`);
      }
    }
  }, []);
}

/**
 * Performance utilities for Web Vitals
 */
export const reportWebVitals = (metric: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    // window.gtag?.('event', metric.name, {
    //   value: Math.round(metric.value),
    //   event_label: metric.id,
    //   non_interaction: true,
    // });
  }
};
