// client/src/App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AlertStreamProvider } from './context/AlertStreamContext';
import { AppRouter } from './routes/AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlertStreamProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AlertStreamProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
