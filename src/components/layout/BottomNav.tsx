import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Newspaper, Trophy, HelpCircle, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'Live', path: '/livescore' },
  { icon: Target, label: 'Tips', path: '/tips' },
  { icon: HelpCircle, label: 'Quiz', path: '/quiz' },
  { icon: Newspaper, label: 'News', path: '/news' },
];

export function BottomNav() {
  const location = useLocation();
  return (
    <div className="w-full border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-6px_25px_rgba(15,23,42,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                  ? 'bg-gradient-to-br from-rose-600 via-rose-600 to-red-700 text-white shadow-md shadow-rose-600/30 scale-105'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 bg-transparent'
              );
            }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-xs" />
                )}
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
