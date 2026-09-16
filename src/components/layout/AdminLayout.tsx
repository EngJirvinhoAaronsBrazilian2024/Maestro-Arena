import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Brain, FileText, LogOut, LayoutDashboard, ChevronLeft, Menu, X, ShieldCheck, Target, Bell, Star, Award, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: FileText, label: 'News Manager', path: '/admin/news' },
  { icon: Brain, label: 'Quiz Manager', path: '/admin/quiz' },
  { icon: Target, label: 'Tips Manager', path: '/admin/tips' },
  { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
  { icon: Star, label: 'Live Polls', path: '/admin/polls' },
  { icon: Award, label: 'Seasons', path: '/admin/seasons' },
  { icon: HelpCircle, label: 'Feedback', path: '/admin/feedback' },
];

export function AdminLayout() {
  const location = useLocation();
  const { logout, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (!loading && (!userData || userData.role !== 'admin')) {
      navigate('/', { replace: true });
    }
  }, [userData?.role, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading || !userData) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#E6F0FA] via-[#D1E0F0] to-[#B8CCE4] font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 z-50 w-full border-b border-slate-200 bg-white px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg tracking-tight">Admin Portal</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2 text-slate-600 hover:text-slate-900">
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:flex",
        mobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full hidden"
      )}>
        <div className="flex h-16 items-center px-6 border-b border-slate-200 md:h-20">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Maestro Arena Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Admin Portal</h1>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              {userData.displayName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-900">{userData.displayName || 'Administrator'}</p>
              <p className="truncate text-xs text-slate-500">{userData.email}</p>
            </div>
          </div>
        </div>
        
        <div className="px-4 pb-2">
          <h2 className="px-2 text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Menu</h2>
        </div>

        <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <item.icon className={cn("h-5 w-5", location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin') ? "text-white" : "text-slate-400")} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-200 space-y-2 bg-slate-50">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Exit to App
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col min-w-0 pt-16 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
