import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Brain, FileText, LogOut, LayoutDashboard, ChevronLeft, Menu, X, ShieldCheck, Target, Bell, Star, Award, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../ui/UserAvatar';

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
      <div className="md:hidden fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2.5 font-bold text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-sm shadow-rose-600/25">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-slate-950 block leading-tight">Admin Portal</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Maestro Arena</span>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
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
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:flex shadow-xs",
        mobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full hidden"
      )}>
        <div className="flex h-20 items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Maestro Arena Logo" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-950 leading-tight">Admin Portal</h1>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Control Center</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="rounded-2xl bg-slate-50/70 p-3.5 border border-slate-200/80 flex items-center gap-3">
            <UserAvatar 
              name={userData?.displayName}
              email={userData?.email}
              size="md"
              className="rounded-2xl shadow-sm"
            />
            <div className="overflow-hidden">
              <p className="truncate text-xs font-black text-slate-900">{userData?.displayName || 'Administrator'}</p>
              <p className="truncate text-[11px] text-slate-500 font-medium">{userData?.email || ''}</p>
            </div>
          </div>
        </div>
        
        <div className="px-5 pb-2">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Navigation</h2>
        </div>

        <nav className="flex-1 space-y-1.5 px-3.5 overflow-y-auto">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 group',
                  isActive
                    ? 'bg-rose-50/90 text-rose-700 shadow-2xs border-l-4 border-rose-600 pl-3'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/40'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-rose-600" : "text-slate-400 group-hover:text-rose-600")} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-2xs" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-100 space-y-2 bg-slate-50/50">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/30 transition-colors shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Exit to App
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200/60 px-4 py-2 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-100/80 transition-colors cursor-pointer"
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
