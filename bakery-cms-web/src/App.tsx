/**
 * Main App Component
 * Configures Ant Design theme, routing, authentication, i18n, and error boundaries
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import enUS from 'antd/es/locale/en_US';
import viVN from 'antd/es/locale/vi_VN';
import { useThemeStore } from './stores/themeStore';
import { useLanguage, useInitializeLanguage } from './stores/languageStore';
import { lightTheme, darkTheme } from './config/theme.config';
import { DashboardLayout, ErrorBoundary, LoadingSpinner } from './components/shared';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { setDayjsLocale } from './i18n/utils/locale.utils';
import type { SupportedLanguage } from './i18n/types';

// Import i18n configuration (initializes i18next)
import './i18n';

// Ant Design locale map
const antdLocales: Record<SupportedLanguage, typeof enUS> = {
  en: enUS,
  vi: viVN,
};

// TEMPORARY TEST: Verify @bakery-cms/common import resolution
import { UserRole, PaymentMethod } from '@bakery-cms/common';
console.log('Test import successful:', { UserRole, PaymentMethod });

// Lazy load all page components for code splitting
const LoginPage = lazy(() =>
  import('./pages/LoginPage/LoginPage').then((module) => ({
    default: module.LoginPage,
  }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  }))
);
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
const StockItemsPage = lazy(() =>
  import('./pages/stock/StockItemsPage').then((module) => ({
    default: module.StockItemsPage,
  }))
);
const StockItemDetailPage = lazy(() =>
  import('./pages/stock/StockItemDetailPage').then((module) => ({
    default: module.StockItemDetailPage,
  }))
);
const StockMovementsPage = lazy(() =>
  import('./pages/stock/StockMovementsPage').then((module) => ({
    default: module.StockMovementsPage,
  }))
);

// Import global styles
import './styles/global.css';
import './styles/antd-overrides.less';

export const App = (): React.JSX.Element => {
  const { mode } = useThemeStore();
  const language = useLanguage();
  const initializeLanguage = useInitializeLanguage();

  const theme = mode === 'light' ? lightTheme : darkTheme;
  const antdLocale = antdLocales[language];

  // Initialize language on mount
  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  // Sync dayjs locale when language changes
  useEffect(() => {
    setDayjsLocale(language);
  }, [language]);

  return (
    <ErrorBoundary>
      <ConfigProvider theme={theme} locale={antdLocale}>
        <AntApp>
          <Router>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected routes with dashboard layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <DashboardPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <ProductsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <ProductDetailPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrdersPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <OrderDetailPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <PaymentsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <PaymentDetailPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock/items"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <StockItemsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock/items/:id"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <StockItemDetailPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock/movements"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <StockMovementsPage />
                      </DashboardLayout>
                    </ProtectedRoute>
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
