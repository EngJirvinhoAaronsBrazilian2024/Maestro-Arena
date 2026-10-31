import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { logActivity } from '../services/activityLogger';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      
      logActivity({
        action: 'AUTH_LOGIN',
        category: 'auth',
        description: `${email} signed in to Maestro Arena`,
        userEmail: email,
        details: { method: 'password', rememberMe }
      });

      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950 font-sans overflow-x-hidden">
      
      {/* Background: Santiago Bernabéu Stadium in HD */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img 
          src="/assets/images/santiago_bernabeu_stadium.jpg" 
          alt="Santiago Bernabéu Stadium in HD" 
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
        />
        {/* Soft atmospheric overlay for readability and cinematic ambiance */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1.5px]"></div>
      </div>

      {/* Phone/Tablet Form Container with Light Green Theme */}
      <div className="z-10 w-full max-w-[440px] sm:max-w-[460px] min-h-screen sm:min-h-0 bg-[#EAF7ED] sm:rounded-[40px] shadow-[0_25px_70px_rgba(0,0,0,0.65)] border border-emerald-200/80 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-500">
        
        {/* Top Hero Section: Superstars Header with Authentic Logo Shield */}
        <div className="relative w-full aspect-[949/560] shrink-0 overflow-hidden bg-[#EAF7ED]">
          <img 
            src="/assets/aistudio/login_superstars_hero_clean.png" 
            alt="Football Superstars - Football Unites Us" 
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Form Body Container in Light Green */}
        <div className="px-6 sm:px-9 pb-8 pt-3 flex-1 flex flex-col justify-between bg-[#EAF7ED]">
          
          {/* Title Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              Welcome <span className="text-red-600">Back</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Sign in to access scores, predictions & trivia
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs sm:text-sm text-rose-700 border border-rose-200 animate-in fade-in">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-rose-600" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Email Field - No Placeholder as Requested */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900 block" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-red-600">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-emerald-200/90 bg-white px-4 py-3.5 pl-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-2xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900 block" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-red-600">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-emerald-200/90 bg-white px-4 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-2xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <span className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                  rememberMe ? "bg-red-600 text-white shadow-xs" : "border-2 border-emerald-300 bg-white"
                )}>
                  {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800">Remember me</span>
              </label>
              <Link 
                to="/reset-password" 
                className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Bold Red Pill Sign In Button with Right Arrow and Watermark Football */}
            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full relative overflow-hidden rounded-full bg-gradient-to-r from-red-600 via-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 py-4 px-6 text-base font-black tracking-wider text-white shadow-[0_12px_28px_rgba(220,38,38,0.38)] hover:shadow-[0_16px_34px_rgba(220,38,38,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none group cursor-pointer border-0" 
                disabled={loading}
              >
                {/* Football watermark pattern on right edge */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                  <span className="text-4xl">⚽</span>
                </div>

                {loading ? (
                  <span className="flex items-center justify-center gap-2 font-bold">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>SIGN IN</span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </div>

            {/* Sign Up Redirect */}
            <div className="text-center text-xs sm:text-sm font-medium text-slate-700 pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-red-600 hover:text-red-700 hover:underline transition-colors">
                Sign up
              </Link>
            </div>

            {/* Soccer Ball Divider over Light Green */}
            <div className="relative flex items-center justify-center pt-3 pb-1">
              <div className="w-full border-t border-emerald-300/80"></div>
              <div className="absolute px-3 bg-[#EAF7ED]">
                <span className="text-base select-none">⚽</span>
              </div>
            </div>

            {/* Legal Footnote */}
            <p className="text-center text-[11px] text-slate-500 pt-1">
              By continuing, you accept our{' '}
              <Link to="/terms" className="text-red-600 font-semibold hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-red-600 font-semibold hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          {/* Bottom Dynamic Red Brush Stroke Graphics */}
          <div className="mt-4 -mx-6 sm:-mx-9 -mb-8 overflow-hidden pointer-events-none h-14 sm:h-16 relative">
            <img 
              src="/assets/aistudio/login_bottom_brush.png" 
              alt="Stadium Crowd Graphic" 
              className="w-full h-full object-cover object-bottom"
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
