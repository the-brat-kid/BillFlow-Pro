"use client";

import { QueryClient, QueryClientProvider as Provider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <Provider client={queryClient}>
      {children}
    </Provider>
  );
}
