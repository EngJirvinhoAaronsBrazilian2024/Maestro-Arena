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
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-full border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] safe-area-bottom">
      <nav className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return cn(
                'relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              )
            }}
          >
            <item.icon className="h-5 w-5 mb-0.5" />
            <span className="text-[9px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
