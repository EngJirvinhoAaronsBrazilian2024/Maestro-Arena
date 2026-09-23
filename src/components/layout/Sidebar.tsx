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
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-red-700 text-white font-black shadow-sm shadow-rose-600/25">
              {(userData?.displayName || userData?.email || 'Fan').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Welcome,</p>
              <p className="truncate text-sm font-bold text-slate-900">{userData.displayName || (userData.email ? userData.email.split('@')[0] : 'Fan')}</p>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return cn(
                'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 group',
                isActive
                  ? 'bg-rose-50/90 text-rose-700 font-bold shadow-2xs border-l-4 border-rose-600 pl-3'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/40'
              );
            }}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-rose-600" : "text-slate-500 group-hover:text-rose-600")} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-2xs" />
                )}
              </>
            )}
          </NavLink>
        ))}
        {isEditor && (
          <NavLink
            to="/editor"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-rose-50 text-rose-700 font-bold border-l-4 border-rose-600 pl-3'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/40'
              )
            }
          >
            <Edit3 className="h-5 w-5 text-rose-600" />
            Editor Dashboard
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                isActive || location.pathname.startsWith('/admin')
                  ? 'bg-rose-50 text-rose-700 font-bold border-l-4 border-rose-600 pl-3'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/40'
              )
            }
          >
            <Shield className="h-5 w-5 text-rose-600" />
            Admin Dashboard
          </NavLink>
        )}
      </nav>
      
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/30 transition-colors shadow-xs cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
