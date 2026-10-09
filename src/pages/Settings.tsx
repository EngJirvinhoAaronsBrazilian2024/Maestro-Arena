import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Monitor, Bell, Shield, MessageSquare, Send, Smartphone, Scale, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { toast } from 'sonner';
import { UserAvatar } from '../components/ui/UserAvatar';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function Settings() {
    const { user, userData } = useAuth();
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // PWA Install state
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallApp = async () => {
      if (!deferredPrompt) {
        toast.error("Installation is not supported or already installed.");
        return;
      }
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return toast.error('Please login to send feedback');
      if (!feedback.trim()) return toast.error('Please enter a feedback message');
      setSubmitting(true);
      try {
        const senderName = userData?.displayName || user.profile?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'SportsHub User';
        const senderEmail = user.email || '';
        const senderAvatar = user.profile?.avatar_url || user.user_metadata?.avatar_url || '';

        let submitted = false;
        try {
          const apiRes = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              user_name: senderName,
              user_email: senderEmail,
              user_avatar: senderAvatar,
              message: feedback.trim()
            })
          });
          if (apiRes.ok) {
            submitted = true;
          }
        } catch (apiErr) {
          console.warn('API feedback submit fallback:', apiErr);
        }

        if (!submitted) {
          // Direct client fallback
          const { error } = await insforge.database.from('feedback').insert([{ 
            user_id: user.id, 
            user_name: senderName,
            user_email: senderEmail,
            user_avatar: senderAvatar,
            message: feedback.trim() 
          }]);

          if (error) {
            // Base schema fallback
            await insforge.database.from('feedback').insert([{ 
              user_id: user.id, 
              message: feedback.trim() 
            }]);
          }
        }

        toast.success('Feedback sent successfully! Thank you.');
        setFeedback('');
      } catch (err) {
        toast.error('Failed to send feedback');
      }
      setSubmitting(false);
    };

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your app preferences and settings.
        </p>
      </div>

        {!isStandalone && deferredPrompt && (
        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Install App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-blue-800">
                Install Maestro Arena on your device for a faster, full-screen mobile experience.
              </p>
              <button 
                onClick={handleInstallApp}
                className="whitespace-nowrap flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold"
              >
                Install Now
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            Send Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">Notice a bug or have a suggestion? Let our team know.</p>
            <textarea 
              required
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="What's on your mind?" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
            />
            <button 
              disabled={submitting}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition font-bold disabled:opacity-50"
            >
              {submitting ? 'Sending...' : <><Send size={16} /> Submit Feedback</>}
            </button>
          </form>
        </CardContent>
      </Card>

        {!isStandalone && deferredPrompt && (
        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Install App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-blue-800">
                Install Maestro Arena on your device for a faster, full-screen mobile experience.
              </p>
              <button 
                onClick={handleInstallApp}
                className="whitespace-nowrap flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold"
              >
                Install Now
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-slate-500">Receive alerts for live matches and breaking news. (Coming soon)</p>
            </div>
            <button disabled className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
              <span className="inline-block h-4 w-4 transform translate-x-1 rounded-full bg-white" />
            </button>
          </div>
        </CardContent>
      </Card>

        {!isStandalone && deferredPrompt && (
        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Install App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-blue-800">
                Install Maestro Arena on your device for a faster, full-screen mobile experience.
              </p>
              <button 
                onClick={handleInstallApp}
                className="whitespace-nowrap flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold"
              >
                Install Now
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3.5">
            <UserAvatar 
              name={userData?.displayName || user?.profile?.name || user?.email?.split('@')[0]}
              email={user?.email}
              avatarUrl={user?.profile?.avatar_url || user?.user_metadata?.avatar_url}
              size="md"
            />
            <div>
              <p className="font-bold text-slate-900">{userData?.displayName || user?.profile?.name || 'Your Account'}</p>
              <p className="text-xs text-slate-500 font-mono">{user?.email || 'Not logged in'}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <button className="text-sm font-medium text-blue-600 hover:underline">
              Change Password
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Legal & Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="h-5 w-5 text-rose-600" />
            Legal & Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500 mb-2">
            Review the terms governing the use of Maestro Arena, livescore feeds, video replays, and betting disclaimers.
          </p>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <Link 
              to="/terms" 
              className="flex items-center justify-between p-3.5 hover:bg-white transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                    Terms of Service
                  </h4>
                  <p className="text-xs text-slate-500">
                    Betting tips disclaimer, video highlight embed rights, fair play
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              to="/privacy" 
              className="flex items-center justify-between p-3.5 hover:bg-white transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Privacy Policy
                  </h4>
                  <p className="text-xs text-slate-500">
                    GDPR rights, data protection, storage, and account deletion
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              Football predictions and betting tips are strictly for entertainment & informational purposes. 18+ only. Gamble responsibly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
