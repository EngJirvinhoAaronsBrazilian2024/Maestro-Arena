import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error: resetError } = await insforge.auth.sendResetPasswordEmail({ email });
      if (resetError) throw resetError;
      
      setMessage('Check your inbox for further instructions');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 bg-slate-950 font-sans overflow-x-hidden">
      {/* Background: Santiago Bernabéu Stadium in HD */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img 
          src="/assets/images/santiago_bernabeu_stadium.jpg" 
          alt="Santiago Bernabéu Stadium in HD" 
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1.5px]"></div>
      </div>

      <div className="z-10 w-full max-w-md bg-[#EAF7ED] rounded-[32px] p-8 shadow-[0_25px_70px_rgba(0,0,0,0.65)] border border-emerald-200/80">
        <div className="mb-6 flex justify-center w-full">
          <img src="/logo.png" alt="Maestro Arena Logo" className="h-16 w-auto object-contain drop-shadow-xs" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Password <span className="text-red-600">Reset</span></h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Enter your email to receive a password reset link
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl bg-rose-50 p-3.5 text-xs sm:text-sm font-semibold text-rose-700 border border-rose-200">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-2xl bg-emerald-50 p-3.5 text-xs sm:text-sm font-semibold text-emerald-700 border border-emerald-200">
              {message}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-900 block" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-2xl border border-emerald-200/90 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-2xs"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 py-3.5 px-6 text-sm font-black tracking-wider text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-60" 
              disabled={loading}
            >
              {loading ? 'Sending link...' : 'RESET PASSWORD'}
            </button>
          </div>
          <div className="text-center text-xs sm:text-sm text-slate-600 pt-2 font-medium">
            <Link to="/login" className="font-bold text-red-600 hover:text-red-700 hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
