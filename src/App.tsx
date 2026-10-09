/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { InstallPrompt } from './components/pwa/InstallPrompt';

// Safe dynamic import with automatic retry for Vite module loading
function lazyWithRetry<T extends React.ComponentType<any> = React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then((module) => {
            sessionStorage.removeItem('vite_chunk_reload');
            resolve(module);
          })
          .catch((err) => {
            if (remaining > 0) {
              setTimeout(() => attempt(remaining - 1), 700);
            } else {
              const reloaded = sessionStorage.getItem('vite_chunk_reload');
              if (!reloaded) {
                sessionStorage.setItem('vite_chunk_reload', 'true');
                window.location.reload();
                return;
              }
              reject(err);
            }
          });
      };
      attempt(2);
    })
  );
}

// Optimize with React.lazy + retry
const Home = lazyWithRetry(() => import('./pages/Home').then(m => ({ default: (m as any).Home || (m as any).default })));
const Login = lazyWithRetry(() => import('./pages/Login').then(m => ({ default: (m as any).Login || (m as any).default })));
const Register = lazyWithRetry(() => import('./pages/Register').then(m => ({ default: (m as any).Register || (m as any).default })));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword').then(m => ({ default: (m as any).ResetPassword || (m as any).default })));
const MatchCentre = lazyWithRetry(() => import('./pages/MatchCentre').then(m => ({ default: (m as any).MatchCentre || (m as any).default })));
const TeamProfile = lazyWithRetry(() => import('./pages/TeamProfile').then(m => ({ default: (m as any).TeamProfile || (m as any).default })));
const PlayerProfile = lazyWithRetry(() => import('./pages/PlayerProfile').then(m => ({ default: (m as any).PlayerProfile || (m as any).default })));
const NewsList = lazyWithRetry(() => import('./pages/NewsList').then(m => ({ default: (m as any).NewsList || (m as any).default })));
const ArticlePage = lazyWithRetry(() => import('./pages/ArticlePage').then(m => ({ default: (m as any).ArticlePage || (m as any).default })));
const FootballQuiz = lazyWithRetry(() => import('./pages/FootballQuiz').then(m => ({ default: (m as any).FootballQuiz || (m as any).default })));
const H2HQuiz = lazyWithRetry(() => import('./pages/H2HQuiz').then(m => ({ default: (m as any).H2HQuiz || (m as any).default })));
const DailyTrivia = lazyWithRetry(() => import('./pages/DailyTrivia').then(m => ({ default: (m as any).DailyTrivia || (m as any).default })));

const Tips = lazyWithRetry(() => import('./pages/Tips').then(m => ({ default: (m as any).Tips || (m as any).default })));
const Livescore = lazyWithRetry(() => import('./pages/Livescore').then(m => ({ default: (m as any).Livescore || (m as any).default })));
const UserProfile = lazyWithRetry(() => import('./pages/UserProfile').then(m => ({ default: (m as any).UserProfile || (m as any).default })));
const Settings = lazyWithRetry(() => import('./pages/Settings').then(m => ({ default: (m as any).Settings || (m as any).default })));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService').then(m => ({ default: (m as any).TermsOfService || (m as any).default })));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy').then(m => ({ default: (m as any).PrivacyPolicy || (m as any).default })));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard').then(m => ({ default: (m as any).AdminDashboard || (m as any).default })));
const AdminQuizManagement = lazyWithRetry(() => import('./pages/admin/AdminQuizManagement').then(m => ({ default: (m as any).AdminQuizManagement || (m as any).default })));
const AdminTipsManagement = lazyWithRetry(() => import("./pages/admin/AdminTipsManagement").then(m => ({ default: (m as any).AdminTipsManagement || (m as any).default })));
const AdminNewsManagement = lazyWithRetry(() => import('./pages/admin/AdminNewsManagement').then(m => ({ default: (m as any).AdminNewsManagement || (m as any).default })));
const AdminNotifications = lazyWithRetry(() => import('./pages/admin/AdminNotifications').then(m => ({ default: (m as any).AdminNotifications || (m as any).default })));
const AdminPolls = lazyWithRetry(() => import('./pages/admin/AdminPolls').then(m => ({ default: (m as any).AdminPolls || (m as any).default })));
const AdminSeasons = lazyWithRetry(() => import('./pages/admin/AdminSeasons').then(m => ({ default: (m as any).AdminSeasons || (m as any).default })));
const AdminFeedback = lazyWithRetry(() => import('./pages/admin/AdminFeedback').then(m => ({ default: (m as any).AdminFeedback || (m as any).default })));
const PlaceholderPage = lazyWithRetry<React.ComponentType<{ title: string }>>(() => import('./pages/PlaceholderPage').then(m => ({ default: (m as any).PlaceholderPage || (m as any).default })));

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-2xl border border-rose-100 bg-white p-8 shadow-xl max-w-md w-full">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Notice</h2>
            <p className="text-sm text-slate-500 mb-6">
              {this.state.error?.message?.includes('dynamically imported module')
                ? 'A page update was received. Please reload to display the newest version.'
                : 'An unexpected issue occurred while loading this page.'}
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem('vite_chunk_reload');
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingScreen = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
  </div>
);

// Redirect component for successful login based on role
function LoginRedirect() {
  const { userData, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (userData?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Home />;
}

export default function App() {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
        <InstallPrompt />
        <Toaster 
          position={isMobile ? "top-center" : "top-right"} 
          richColors 
          closeButton 
          visibleToasts={2}
          duration={3500}
        />
        <HotToaster 
          position={isMobile ? "top-center" : "top-right"} 
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              maxWidth: '380px'
            }
          }}
        />
        <BrowserRouter>
          <ScrollToTop />
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                </Route>
                
                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="quiz" element={<AdminQuizManagement />} />
                    <Route path="news" element={<AdminNewsManagement />} />
                    <Route path="tips" element={<AdminTipsManagement />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="polls" element={<AdminPolls />} />
                    <Route path="seasons" element={<AdminSeasons />} />
                    <Route path="feedback" element={<AdminFeedback />} />
                  </Route>
                </Route>

                {/* Protected App Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="livescore" element={<Livescore />} />
                    <Route path="matches/:id" element={<MatchCentre />} />
                    
                    <Route path="teams/:id" element={<TeamProfile />} />
                    <Route path="players/:id" element={<PlayerProfile />} />
                    
                    <Route path="news" element={<NewsList />} />
                    <Route path="news/:id" element={<ArticlePage />} />
                    <Route path="quiz" element={<FootballQuiz />} />
                    <Route path="quiz/h2h" element={<H2HQuiz />} />
                    <Route path="quiz/daily" element={<DailyTrivia />} />

                    
                    <Route path="tips" element={<Tips />} />
                    
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<UserProfile />} />
                    <Route path="terms" element={<TermsOfService />} />
                    <Route path="privacy" element={<PrivacyPolicy />} />
                    
                    <Route path="my-feed" element={<Navigate to="/tips" replace />} />
                    <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
