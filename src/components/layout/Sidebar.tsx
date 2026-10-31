import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Newspaper, Trophy, Settings, HelpCircle, Edit3, Shield, LogOut, Star, Award, Target, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../ui/UserAvatar';

const navItems = [
  { 
    icon: Home, 
    label: 'Home', 
    path: '/', 
    activeClass: 'bg-rose-50/90 text-rose-700 font-bold shadow-2xs border-l-4 border-rose-600 pl-3',
    hoverClass: 'hover:text-rose-600 hover:bg-rose-50/40',
    iconActiveColor: 'text-rose-600',
    dotColor: 'bg-rose-500'
  },
  { 
    icon: Target, 
    label: 'Tips', 
    path: '/tips', 
    activeClass: 'bg-emerald-50/90 text-emerald-800 font-bold shadow-2xs border-l-4 border-emerald-600 pl-3',
    hoverClass: 'hover:text-emerald-700 hover:bg-emerald-50/40',
    iconActiveColor: 'text-emerald-600',
    dotColor: 'bg-emerald-500'
  },
  { 
    icon: Calendar, 
    label: 'Live Scores', 
    path: '/livescore', 
    activeClass: 'bg-blue-50/90 text-blue-800 font-bold shadow-2xs border-l-4 border-blue-600 pl-3',
    hoverClass: 'hover:text-blue-700 hover:bg-blue-50/40',
    iconActiveColor: 'text-blue-600',
    dotColor: 'bg-blue-500'
  },
  { 
    icon: Newspaper, 
    label: 'News', 
    path: '/news', 
    activeClass: 'bg-indigo-50/90 text-indigo-800 font-bold shadow-2xs border-l-4 border-indigo-600 pl-3',
    hoverClass: 'hover:text-indigo-700 hover:bg-indigo-50/40',
    iconActiveColor: 'text-indigo-600',
    dotColor: 'bg-indigo-500'
  },
  { 
    icon: HelpCircle, 
    label: 'Quiz', 
    path: '/quiz', 
    activeClass: 'bg-amber-50/90 text-amber-800 font-bold shadow-2xs border-l-4 border-amber-500 pl-3',
    hoverClass: 'hover:text-amber-800 hover:bg-amber-50/40',
    iconActiveColor: 'text-amber-600',
    dotColor: 'bg-amber-500'
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    path: '/settings', 
    activeClass: 'bg-slate-100 text-slate-800 font-bold shadow-2xs border-l-4 border-slate-600 pl-3',
    hoverClass: 'hover:text-slate-800 hover:bg-slate-50',
    iconActiveColor: 'text-slate-700',
    dotColor: 'bg-slate-600'
  },
];

export function Sidebar() {
  const location = useLocation();
  const { userData, logout } = useAuth();
  
  const isEditor = userData?.role === 'admin' || userData?.role === 'editor';
  const isAdmin = userData?.role === 'admin';
  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white absolute top-0 bottom-0 left-0 z-30 pb-4 overflow-y-auto">
      <div className="p-4 border-b border-slate-100 flex items-center justify-center mb-2">
        <img src="/logo.png" alt="Maestro Arena Logo" className="h-16 w-auto object-contain" />
      </div>
      {userData && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 mb-2">
          <div className="flex items-center gap-3">
            <UserAvatar 
              name={userData.displayName}
              email={userData.email}
              size="md"
              className="rounded-2xl shadow-sm"
            />
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
                  ? item.activeClass
                  : cn('text-slate-600', item.hoverClass)
              );
            }}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5 transition-colors", isActive ? item.iconActiveColor : "text-slate-500 group-hover:text-slate-700")} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className={cn("w-1.5 h-1.5 rounded-full shadow-2xs", item.dotColor)} />
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
      
      {/* Official Technology Partner Sponsor Card */}
      <div className="px-3 pt-2 pb-1">
        <a
          href="https://jirvinho-software-ug.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-2.5 rounded-2xl bg-gradient-to-br from-white via-rose-50/50 to-slate-50 text-slate-900 border border-rose-200/90 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-black text-rose-600 uppercase tracking-wider bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">Tech Partner</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </div>
          <div className="text-xs font-black text-slate-900 truncate">
            Jirvinho Software World
          </div>
          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
            Turning Ideas Into Digital Solutions
          </p>
        </a>
      </div>

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
