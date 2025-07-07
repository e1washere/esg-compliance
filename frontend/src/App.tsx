import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/react';

// Import styles
import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';
import './styles/globals.css';

// Import providers and contexts
import { store } from './store/store';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';

// Import layout components
import { MainLayout } from './components/layouts/MainLayout';
import { AuthLayout } from './components/layouts/AuthLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorFallback } from './components/common/ErrorFallback';

// Import route guards
import { PrivateRoute } from './components/auth/PrivateRoute';
import { PublicRoute } from './components/auth/PublicRoute';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Compliance = React.lazy(() => import('./pages/Compliance'));
const ComplianceDetails = React.lazy(() => import('./pages/ComplianceDetails'));
const Metrics = React.lazy(() => import('./pages/Metrics'));
const Reports = React.lazy(() => import('./pages/Reports'));
const ReportDetails = React.lazy(() => import('./pages/ReportDetails'));
const Integrations = React.lazy(() => import('./pages/Integrations'));
const Recommendations = React.lazy(() => import('./pages/Recommendations'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Profile = React.lazy(() => import('./pages/Profile'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.href = '/'}
    >
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ThemeProvider>
              <Router>
                <AuthProvider>
                  <Suspense fallback={<LoadingSpinner fullScreen />}>
                    <Routes>
                      {/* Public routes */}
                      <Route element={<PublicRoute />}>
                        <Route element={<AuthLayout />}>
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password/:token" element={<ResetPassword />} />
                        </Route>
                      </Route>

                      {/* Private routes */}
                      <Route element={<PrivateRoute />}>
                        <Route element={<MainLayout />}>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/compliance" element={<Compliance />} />
                          <Route path="/compliance/:id" element={<ComplianceDetails />} />
                          <Route path="/metrics" element={<Metrics />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/reports/:id" element={<ReportDetails />} />
                          <Route path="/integrations" element={<Integrations />} />
                          <Route path="/recommendations" element={<Recommendations />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/profile" element={<Profile />} />
                        </Route>
                      </Route>

                      {/* 404 route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>

                  {/* Global components */}
                  <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                  />
                </AuthProvider>
              </Router>
            </ThemeProvider>
          </I18nProvider>

          {/* React Query Devtools */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
          )}
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default Sentry.withProfiler(App);