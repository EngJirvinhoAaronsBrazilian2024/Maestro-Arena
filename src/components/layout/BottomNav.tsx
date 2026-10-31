import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Newspaper, Trophy, HelpCircle, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/', activeGradient: 'bg-gradient-to-br from-rose-600 via-rose-600 to-red-700 shadow-rose-600/30' },
  { icon: Calendar, label: 'Live', path: '/livescore', activeGradient: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 shadow-blue-600/30' },
  { icon: Target, label: 'Tips', path: '/tips', activeGradient: 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-600/30' },
  { icon: HelpCircle, label: 'Quiz', path: '/quiz', activeGradient: 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 shadow-amber-500/30 text-white' },
  { icon: Newspaper, label: 'News', path: '/news', activeGradient: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 shadow-indigo-600/30' },
];

export function BottomNav() {
  const location = useLocation();
  return (
    <div className="w-full border-t border-emerald-200/70 bg-[#EAF7ED]/95 backdrop-blur-xl shadow-[0_-6px_25px_rgba(15,23,42,0.06)] rounded-b-[16px] sm:rounded-b-[20px] pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <nav className="flex h-16 items-center justify-around px-2 sm:px-4 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return cn(
                'relative flex flex-col items-center justify-center w-13 h-12 rounded-xl transition-all duration-200',
                isActive
                  ? cn(item.activeGradient, 'text-white shadow-md scale-105')
                  : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-100/60 bg-transparent'
              );
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-bold leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default BottomNav;
