import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Newspaper, Trophy, Settings, HelpCircle, Edit3, Shield, LogOut, Star, Award, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Target, label: 'Tips', path: '/tips' },
  { icon: Calendar, label: 'Live Scores', path: '/livescore' },
  { icon: Newspaper, label: 'News', path: '/news' },
  { icon: HelpCircle, label: 'Quiz', path: '/quiz' },

  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { userData, logout } = useAuth();
  
  const isEditor = userData?.role === 'admin' || userData?.role === 'editor';
  const isAdmin = userData?.role === 'admin';
  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white fixed h-[calc(100vh-4rem)] top-16 pb-4">
      <div className="p-4 border-b border-slate-100 flex items-center justify-center mb-2">
        <img src="/logo.png" alt="Maestro Arena Logo" className="h-16 w-auto object-contain" />
      </div>
      {userData && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-bold shadow-sm">
              {userData.displayName?.charAt(0).toUpperCase() || (userData.email ? userData.email.charAt(0).toUpperCase() : 'F')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Welcome,</p>
              <p className="truncate text-sm font-bold text-slate-900">{userData.displayName || (userData.email ? userData.email.split('@')[0] : 'Fan')}</p>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-green-50 text-green-700  '
                  : 'text-slate-600 hover:bg-slate-100'
              )
            }}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        {isEditor && (
          <NavLink
            to="/editor"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-50 text-purple-700  '
                  : 'text-slate-600 hover:bg-slate-100'
              )
            }
          >
            <Edit3 className="h-5 w-5 text-purple-500" />
            Editor Dashboard
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive || location.pathname.startsWith('/admin')
                  ? 'bg-red-50 text-red-700  '
                  : 'text-slate-600 hover:bg-slate-100'
              )
            }
          >
            <Shield className="h-5 w-5 text-red-500" />
            Admin Dashboard
          </NavLink>
        )}
      </nav>
      
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
