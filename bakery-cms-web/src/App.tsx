/**
 * Main App Component
 * Configures Ant Design theme, routing, authentication, and error boundaries
 */

import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import { lightTheme, darkTheme } from './config/theme.config';
import { DashboardLayout, ErrorBoundary, LoadingSpinner } from './components/shared';

// Lazy load all page components for code splitting
const DashboardPage = lazy(() =>
  import('./pages/Dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);
const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage }))
);
const ProductDetailPage = lazy(() =>
  import('./pages/Products/ProductDetailPage').then((module) => ({
    default: module.ProductDetailPage,
  }))
);
const OrdersPage = lazy(() =>
  import('./pages/OrdersPage').then((module) => ({ default: module.OrdersPage }))
);
const OrderDetailPage = lazy(() =>
  import('./pages/Orders/OrderDetailPage').then((module) => ({
    default: module.OrderDetailPage,
  }))
);
const PaymentsPage = lazy(() =>
  import('./pages/PaymentsPage').then((module) => ({ default: module.PaymentsPage }))
);
const PaymentDetailPage = lazy(() =>
  import('./pages/Payments/PaymentDetailPage').then((module) => ({
    default: module.PaymentDetailPage,
  }))
);

// Import global styles
import './styles/global.css';
import './styles/antd-overrides.less';

export const App = (): React.JSX.Element => {
  const { mode } = useThemeStore();
  const { login } = useAuthStore();

  // Mock login on app start (for development)
  useEffect(() => {
    login('admin@bakery.com', 'password');
  }, [login]);

  const theme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ErrorBoundary>
      <ConfigProvider theme={theme}>
        <AntApp>
          <Router>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Routes>
                {/* Dashboard routes with layout */}
                <Route
                  path="/"
                  element={
                    <DashboardLayout>
                      <DashboardPage />
                    </DashboardLayout>
                  }
                />
            <Route
              path="/products"
              element={
                <DashboardLayout>
                  <ProductsPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/products/:id"
              element={
                <DashboardLayout>
                  <ProductDetailPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/orders"
              element={
                <DashboardLayout>
                  <OrdersPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <DashboardLayout>
                  <OrderDetailPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/payments"
              element={
                <DashboardLayout>
                  <PaymentsPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/payments/:id"
              element={
                <DashboardLayout>
                  <PaymentDetailPage />
                </DashboardLayout>
              }
            />
            
                
                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
};