import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import premiumBg from '../../assets/images/premium_football_texture_1789303121778.jpg';

interface FootballEmptyStateProps {
  title: string;
  message: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function FootballEmptyState({ title, message, icon: Icon, action, className }: FootballEmptyStateProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 md:p-12 text-center shadow-sm", className)}>
      <div 
        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center" 
        style={{ backgroundImage: `url(${premiumBg})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/60 to-white/95 backdrop-blur-[2px]" />
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 border border-slate-100 shadow-[0_8px_16px_rgba(0,0,0,0.04)]">
          <Icon className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">{title}</h3>
        <p className="mb-8 max-w-md text-sm md:text-base font-medium text-slate-500">{message}</p>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
