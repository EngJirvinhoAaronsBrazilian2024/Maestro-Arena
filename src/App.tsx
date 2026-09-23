/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { InstallPrompt } from './components/pwa/InstallPrompt';

// Optimize with React.lazy
const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const MatchCentre = React.lazy(() => import('./pages/MatchCentre').then(m => ({ default: m.MatchCentre })));
const TeamProfile = React.lazy(() => import('./pages/TeamProfile').then(m => ({ default: m.TeamProfile })));
const PlayerProfile = React.lazy(() => import('./pages/PlayerProfile').then(m => ({ default: m.PlayerProfile })));
const NewsList = React.lazy(() => import('./pages/NewsList').then(m => ({ default: m.NewsList })));
const ArticlePage = React.lazy(() => import('./pages/ArticlePage').then(m => ({ default: m.ArticlePage })));
const FootballQuiz = React.lazy(() => import('./pages/FootballQuiz').then(m => ({ default: m.FootballQuiz })));
const H2HQuiz = React.lazy(() => import('./pages/H2HQuiz').then(m => ({ default: m.H2HQuiz })));
const DailyTrivia = React.lazy(() => import('./pages/DailyTrivia').then(m => ({ default: m.DailyTrivia })));

const Tips = React.lazy(() => import('./pages/Tips').then(m => ({ default: m.Tips })));
const Livescore = React.lazy(() => import('./pages/Livescore').then(m => ({ default: m.Livescore })));
const UserProfile = React.lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminQuizManagement = React.lazy(() => import('./pages/admin/AdminQuizManagement').then(m => ({ default: m.AdminQuizManagement })));
const AdminTipsManagement = React.lazy(() => import("./pages/admin/AdminTipsManagement").then(m => ({ default: m.AdminTipsManagement })));
const AdminNewsManagement = React.lazy(() => import('./pages/admin/AdminNewsManagement').then(m => ({ default: m.AdminNewsManagement })));
const AdminNotifications = React.lazy(() => import('./pages/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const AdminPolls = React.lazy(() => import('./pages/admin/AdminPolls').then(m => ({ default: m.AdminPolls })));
const AdminSeasons = React.lazy(() => import('./pages/admin/AdminSeasons').then(m => ({ default: m.AdminSeasons })));
const AdminFeedback = React.lazy(() => import('./pages/admin/AdminFeedback').then(m => ({ default: m.AdminFeedback })));
const PlaceholderPage = React.lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));

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
                  
                  <Route path="my-feed" element={<Navigate to="/tips" replace />} />
                                    <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
            </NotificationProvider>
      </AuthProvider>
    
  );
}
