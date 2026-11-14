import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { logActivity } from '../services/activityLogger';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service to create an account.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await insforge.auth.signUp({ 
        email, 
        password,
        name
      });
      
      if (authError) throw authError;

      if (authData.user) {
        // Create user profile in InsForge database matching existing public.users schema (id, email, display_name, role, created_at)
        const normalizedEmail = email.trim().toLowerCase();
        const { error: dbError } = await insforge.database.from('users').insert([{
          id: authData.user.id,
          email: normalizedEmail,
          display_name: name.trim(),
          role: normalizedEmail === 'kisakyearon72@gmail.com' ? 'admin' : 'user',
          created_at: Date.now()
        }]);
        
        if (dbError) {
          console.error("Failed to insert user profile:", dbError);
        }

        logActivity({
          action: 'AUTH_REGISTER',
          category: 'auth',
          description: `New member registered: ${name} (${normalizedEmail})`,
          userId: authData.user.id,
          userEmail: normalizedEmail,
          userName: name.trim()
        });
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full relative flex items-center justify-center p-0 sm:p-4 md:p-6 bg-[#EAF7ED] sm:bg-slate-950 font-sans overflow-x-hidden">
      
      {/* Background: Santiago Bernabéu Stadium in HD */}
      <div className="hidden sm:block fixed inset-0 overflow-hidden pointer-events-none z-0">
        <img 
          src="/assets/images/santiago_bernabeu_stadium.jpg" 
          alt="Santiago Bernabéu Stadium in HD" 
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
        />
        {/* Soft atmospheric overlay for readability and cinematic ambiance */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1.5px]"></div>
      </div>

      {/* Phone/Tablet Form Container matching Login Screen */}
      <div className="z-10 w-full min-h-[100dvh] sm:min-h-0 sm:max-w-[460px] bg-[#EAF7ED] rounded-none sm:rounded-[40px] sm:shadow-[0_25px_70px_rgba(0,0,0,0.65)] sm:border sm:border-emerald-200/80 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-500">
        
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
              Create <span className="text-red-600">Account</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Join Maestro Arena for live scores, tips & trivia
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs sm:text-sm text-rose-700 border border-rose-200 animate-in fade-in">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-rose-600" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900 block" htmlFor="name">
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-red-600">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl border border-emerald-200/90 bg-white px-4 py-3.5 pl-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-2xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Field */}
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
                  className="w-full rounded-2xl border border-emerald-200/90 bg-white px-4 py-3.5 pl-12 text-sm text-slate-900 outline-none transition-all placeholder:text-transparent focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-2xs"
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
                  autoComplete="new-password"
                  placeholder="Create your password"
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

            {/* Terms Agreement Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only"
                />
                <span className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 mt-0.5",
                  agreedToTerms ? "bg-red-600 text-white shadow-xs" : "border-2 border-emerald-300 bg-white"
                )}>
                  {agreedToTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </span>
                <span className="text-xs text-slate-700 leading-tight">
                  I agree to the{' '}
                  <Link to="/terms" className="text-red-600 font-bold hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-red-600 font-bold hover:underline">Privacy Policy</Link>.
                </span>
              </label>
            </div>

            {/* Bold Red Pill Create Account Button with Right Arrow and Watermark Football */}
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
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </div>

            {/* Sign In Redirect */}
            <div className="text-center text-xs sm:text-sm font-medium text-slate-700 pt-2">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-red-600 hover:text-red-700 hover:underline transition-colors">
                Sign in
              </Link>
            </div>

            {/* Soccer Ball Divider over Light Green */}
            <div className="relative flex items-center justify-center pt-3 pb-1">
              <div className="w-full border-t border-emerald-300/80"></div>
              <div className="absolute px-3 bg-[#EAF7ED]">
                <span className="text-base select-none">⚽</span>
              </div>
            </div>

            {/* Legal Footnote & Developer Copyright */}
            <div className="space-y-1 text-center pt-1">
              <p className="text-[11px] text-slate-500">
                Official membership with synchronized sports live scores & trivia rankings.
              </p>
              <p className="text-[11px] font-bold text-slate-600">
                &copy; {new Date().getFullYear()} Maestro Arena · Developed by{' '}
                <a
                  href="https://eng-aaron-portifolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 underline underline-offset-2 font-extrabold transition-colors"
                >
                  Eng Kisakye Aaron
                </a>
              </p>
            </div>
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

export default Register;
