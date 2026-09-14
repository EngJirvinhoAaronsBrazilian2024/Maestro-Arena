import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { Button } from '../components/ui/Button';
import ronaldoBg from '../assets/images/ronaldo_background_1788621952580.jpg';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await insforge.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 md:p-12 lg:p-24 overflow-hidden animate-in fade-in duration-1000 bg-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img src={ronaldoBg} alt="Cristiano Ronaldo" className="h-full w-full object-cover object-center" />
      </div>
      

      
      {/* Floating Login Card */}
      <div className="relative z-10 w-full max-w-[420px] animate-in slide-in-from-right-8 duration-700 delay-150 fill-mode-both">
        <div className="rounded-[20px] border border-white/20 bg-white/95 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex justify-center w-full">
            <img src="/logo.png" alt="Maestro Arena Logo" className="h-24 sm:h-28 w-auto object-contain" />
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pl-11 text-sm text-slate-900 outline-none transition-all focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition-all focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-600 transition-colors cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-600 cursor-pointer">
                  Remember me
                </label>
              </div>
              <Link to="/reset-password" className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>
            
            <Button 
              type="submit" 
              className="w-full rounded-xl bg-green-600 py-6 text-base font-semibold text-white hover:bg-green-700 focus:ring-green-500 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Authenticating...
                </span>
              ) : (
                'Log In'
              )}
            </Button>
            
            <div className="text-center text-sm font-medium text-slate-600 pt-3">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
