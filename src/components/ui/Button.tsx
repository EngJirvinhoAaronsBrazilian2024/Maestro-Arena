import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'aqua' | 'gold' | 'live' | 'premium';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
    
    const variants = {
      primary: "bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 shadow-sm shadow-rose-600/20 active:translate-y-0.5",
      secondary: "bg-white/90 border border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 shadow-2xs",
      outline: "border-2 border-rose-200 text-rose-700 bg-white/80 hover:bg-rose-50/80 hover:border-rose-300 shadow-2xs",
      ghost: "bg-transparent text-slate-700 hover:text-rose-600 hover:bg-rose-50/60",
      aqua: "bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 shadow-sm shadow-cyan-600/25 active:translate-y-0.5",
      live: "bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 shadow-sm shadow-cyan-600/25 active:translate-y-0.5",
      gold: "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-500 shadow-sm shadow-amber-500/25 active:translate-y-0.5",
      premium: "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black hover:from-amber-400 hover:to-yellow-500 shadow-sm shadow-amber-500/25 active:translate-y-0.5",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg",
      md: "h-10 px-4 py-2 text-sm rounded-xl",
      lg: "h-12 px-7 text-base rounded-2xl",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
