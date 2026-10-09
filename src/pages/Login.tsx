import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { Button } from '../components/ui/Button';
import ronaldoBg from '../assets/images/ronaldo_background_1788621952580.jpg';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden animate-in fade-in duration-700 bg-slate-950">
      {/* Background Image with Cinematic Contrast */}
      <div className="absolute inset-0 z-0">
        <img 
          src={ronaldoBg} 
          alt="Cristiano Ronaldo" 
          className="h-full w-full object-cover object-center opacity-85" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/70 backdrop-blur-[1px]"></div>
      </div>
      
      {/* Floating Redesigned Login Card */}
      <div className="relative z-10 w-full max-w-[430px] animate-in zoom-in-95 slide-in-from-bottom-6 duration-700 fill-mode-both">
        <div className="rounded-[28px] border border-white/80 bg-white/95 p-7 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {/* Header & Logo */}
          <div className="mb-7 flex flex-col items-center justify-center text-center w-full">
            <img 
              src="/logo.png" 
              alt="Maestro Arena Logo" 
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm mb-3" 
            />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Enter your credentials to access Maestro Arena
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs sm:text-sm text-red-600 border border-red-200/80 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 sm:py-3.5 pl-10 sm:pl-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 sm:py-3.5 pl-10 sm:pl-11 pr-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
            </div>
            
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-rose-600 transition-colors cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm font-medium text-slate-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <Link 
                to="/reset-password" 
                className="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            
            {/* Redesigned Premier Red Login Button */}
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 py-6 sm:py-6.5 text-base font-black tracking-wide text-white shadow-lg shadow-rose-600/30 hover:shadow-rose-600/45 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none group cursor-pointer" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2 font-bold">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>LOG IN</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </div>
            
            {/* Sign Up Redirect */}
            <div className="text-center text-xs sm:text-sm font-medium text-slate-600 pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors">
                Sign up
              </Link>
            </div>

            {/* Legal Footnote */}
            <p className="text-center text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              By continuing, you accept our{' '}
              <Link to="/terms" className="text-slate-600 hover:text-rose-600 font-semibold hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-slate-600 hover:text-rose-600 font-semibold hover:underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
