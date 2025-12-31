'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

// Default configuration for React Query
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 1 time
      retry: 1,
      // Refetch on window focus in production only
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
};

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Create a new QueryClient instance per component tree
  // This ensures SSR doesn't share state between requests
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

// Export a function to create a new query client for server-side use
export function makeQueryClient() {
  return new QueryClient(queryClientConfig);
}
