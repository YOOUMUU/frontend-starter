import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 创建一个 React Query 客户端实例，用于管理应用的数据请求和缓存
const queryClient = new QueryClient();

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// 创建一个 TanStack Router 实例，并将 queryClient 作为上下文传递
const router = createRouter({ routeTree, context: { queryClient } });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  );
}
