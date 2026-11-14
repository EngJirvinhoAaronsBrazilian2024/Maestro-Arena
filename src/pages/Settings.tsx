import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useFavorites } from '../hooks/useFavorites';
import {
  Bell,
  Shield,
  MessageSquare,
  Send,
  Smartphone,
  Scale,
  FileText,
  ChevronRight,
  AlertTriangle,
  Code2,
  ExternalLink,
  CheckCircle2,
  KeyRound,
  Star,
  Trash2,
  CheckCheck,
  LogIn,
  User as UserIcon,
  Camera,
  Loader2,
  Save,
  X,
  BellRing,
} from 'lucide-react';
import { insforge } from '../lib/insforge';
import { uploadImage } from '../services/storageService';
import {
  isWebPushSupported,
  getActivePushSubscription,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  syncPushPreferences,
  sendTestWebPush,
} from '../lib/pushClient';
import { toast } from 'sonner';
import { UserAvatar } from '../components/ui/UserAvatar';
import { cn } from '../lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MATCH_TOASTS_KEY = 'sportshub_match_toasts_enabled';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const TEXT_INPUT_CLASS =
  'w-full px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs transition-all';

export function Settings() {
  const { user, userData, logout, updateUserData } = useAuth();
  const {
    followedMatches,
    notifications,
    unreadCount,
    markAllRead,
    clearAllNotifications,
  } = useNotifications();
  const { favorites } = useFavorites();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolvedAvatar =
    userData?.avatarUrl ||
    user?.profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    '';
  const resolvedDisplayName =
    userData?.displayName ||
    user?.profile?.name ||
    user?.email?.split('@')[0] ||
    '';

  const [displayNameInput, setDisplayNameInput] = useState(resolvedDisplayName);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [matchAlertsEnabled, setMatchAlertsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(MATCH_TOASTS_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Web Push (Closed-app background notifications) state
  const pushSupported = isWebPushSupported();
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setDisplayNameInput(resolvedDisplayName);
  }, [resolvedDisplayName]);

  useEffect(() => {
    let active = true;
    if (!pushSupported) {
      setPushPermission('unsupported');
      return;
    }
    setPushPermission(Notification.permission);
    getActivePushSubscription().then((sub) => {
      if (!active) return;
      setPushSubscribed(Boolean(sub));
      if (sub && Notification.permission === 'granted') {
        void syncPushPreferences({
          userId: user?.id,
          followedMatches,
          favorites: favorites.map((f) => ({ id: f.id, type: f.type, name: f.name })),
          matchAlertsEnabled,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [pushSupported, user?.id]);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
    );

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleToggleMatchAlerts = () => {
    const next = !matchAlertsEnabled;
    setMatchAlertsEnabled(next);
    try {
      localStorage.setItem(MATCH_TOASTS_KEY, String(next));
    } catch {
      // ignore storage failure
    }
    void syncPushPreferences({
      userId: user?.id,
      followedMatches,
      favorites: favorites.map((f) => ({ id: f.id, type: f.type, name: f.name })),
      matchAlertsEnabled: next,
    });
    toast.success(next ? 'Live match alert popups enabled.' : 'Live match alert popups paused.');
  };

  const handleToggleBackgroundPush = async () => {
    if (!pushSupported) {
      toast.error('Background push notifications are not supported by this browser.');
      return;
    }

    setPushLoading(true);
    try {
      if (pushSubscribed) {
        const ok = await unsubscribeFromWebPush();
        if (ok) {
          setPushSubscribed(false);
          toast.info('Background push notifications turned off for this device.');
        } else {
          toast.error('Could not unsubscribe push notifications.');
        }
      } else {
        const result = await subscribeToWebPush(
          {
            userId: user?.id,
            followedMatches,
            favorites: favorites.map((f) => ({ id: f.id, type: f.type, name: f.name })),
            matchAlertsEnabled,
          },
          true
        );
        setPushPermission(result.permission);
        setPushSubscribed(result.subscribed);
        if (result.subscribed) {
          toast.success('Background push enabled! You will receive goals, breaking news, and tips even when Maestro Arena is closed.');
        } else {
          toast.error(result.reason || 'Could not enable background push notifications.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed updating background push settings.';
      toast.error(msg);
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await sendTestWebPush();
      if (res.ok) {
        toast.success('Test push notification sent! Check your system notifications.');
      } else {
        toast.error(res.error || 'Could not send test push notification.');
      }
    } finally {
      setTestingPush(false);
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      toast.error('Installation prompt is not available right now.');
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      toast.success('Maestro Arena installed on your device!');
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!user) {
      toast.error('Please sign in first to upload a profile picture.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WebP, or GIF).');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploaded = await uploadImage(file);
      await updateUserData({
        avatarUrl: uploaded.url,
        displayName: displayNameInput.trim() || resolvedDisplayName || 'SportsHub Fan',
      });
      toast.success('Profile picture uploaded and saved.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload profile picture.';
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateUserData({ avatarUrl: '' });
      toast.success('Profile picture removed.');
    } catch {
      toast.error('Could not remove profile picture.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to update your profile.');
      return;
    }

    const trimmedName = displayNameInput.trim();
    if (!trimmedName) {
      toast.error('Display name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserData({ displayName: trimmedName });
      toast.success('Display name updated successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      toast.error('Please sign in first to reset your password.');
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await insforge.auth.sendResetPasswordEmail({ email: user.email });
      if (error) throw error;
      setResetSent(true);
      toast.success(`Password reset instructions sent to ${user.email}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send reset email.';
      toast.error(message);
    } finally {
      setSendingReset(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in to send feedback');
    if (!feedback.trim()) return toast.error('Please enter a feedback message');
    setSubmittingFeedback(true);
    try {
      const senderName =
        userData?.displayName ||
        user.profile?.name ||
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'SportsHub User';
      const senderEmail = user.email || '';
      const senderAvatar =
        userData?.avatarUrl || user.profile?.avatar_url || user.user_metadata?.avatar_url || '';

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
            message: feedback.trim(),
          }),
        });
        if (apiRes.ok) {
          submitted = true;
        }
      } catch (apiErr) {
        console.warn('API feedback submit fallback:', apiErr);
      }

      if (!submitted) {
        const { error } = await insforge.database.from('feedback').insert([
          {
            user_id: user.id,
            user_name: senderName,
            user_email: senderEmail,
            user_avatar: senderAvatar,
            message: feedback.trim(),
          },
        ]);

        if (error) {
          await insforge.database.from('feedback').insert([
            {
              user_id: user.id,
              message: feedback.trim(),
            },
          ]);
        }
      }

      toast.success('Feedback sent successfully! Thank you.');
      setFeedback('');
    } catch {
      toast.error('Failed to send feedback');
    }
    setSubmittingFeedback(false);
  };

  const displayName = resolvedDisplayName || 'Guest Fan';

  return (
    <div className="mx-auto max-w-5xl pb-16 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Executive Page Header */}
      <div className="bg-white rounded-[24px] border border-slate-200/90 p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
            Preferences &amp; Account
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Manage your Maestro Arena profile picture, account security, match alert inbox, feedback, and legal policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-xs font-bold text-slate-700 transition-colors whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5 text-rose-600" />
              View Profile
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors shadow-2xs whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Responsive Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Left Navigation Index (Desktop Sticky) */}
        <aside className="hidden lg:block sticky top-20 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-1">
          <a
            href="#account-security"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 transition-colors"
          >
            <Shield className="w-4 h-4 text-rose-600" />
            <span>Profile &amp; Security</span>
          </a>
          <a
            href="#notifications-alerts"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 transition-colors"
          >
            <Bell className="w-4 h-4 text-rose-600" />
            <span>Alerts &amp; Pinned Feed</span>
          </a>
          <a
            href="#feedback-support"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-rose-600" />
            <span>Send Feedback</span>
          </a>
          <a
            href="#legal-about"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 transition-colors"
          >
            <Scale className="w-4 h-4 text-rose-600" />
            <span>Legal &amp; Developer</span>
          </a>
        </aside>

        {/* Right Main Settings Stack */}
        <div className="space-y-6">
          {/* App Installation Banner (Shown at most once if installable) */}
          {!isStandalone && deferredPrompt && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Install Maestro Arena App</h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Add Maestro Arena to your home screen for full-screen mobile speed and instant kickoff access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallApp}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
              >
                Install App
              </button>
            </section>
          )}

          {/* 1. Profile, Avatar & Account Security */}
          <section
            id="account-security"
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-rose-600" />
                <h2 className="text-base font-black text-slate-900">Profile &amp; Account Security</h2>
              </div>
              {user && (
                <span className="text-[11px] font-bold text-emerald-700">
                  Signed In
                </span>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Picture Upload + Identity Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <UserAvatar
                      name={displayNameInput || displayName}
                      email={user?.email}
                      avatarUrl={resolvedAvatar}
                      size="xl"
                      className="h-20 w-20 text-xl border-2 border-slate-200"
                    />
                    {user && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        aria-label="Upload profile picture"
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white border-2 border-white shadow-sm flex items-center justify-center transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-base sm:text-lg text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                      {user?.email || 'Not signed in — guest browsing mode'}
                    </p>

                    {user && (
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {uploadingAvatar ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-3.5 h-3.5" />
                              <span>{resolvedAvatar ? 'Change Photo' : 'Add Profile Photo'}</span>
                            </>
                          )}
                        </button>

                        {resolvedAvatar && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={savingProfile || uploadingAvatar}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50 text-xs font-bold text-slate-600 hover:text-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold text-slate-700 hover:text-rose-700 transition-colors cursor-pointer self-start sm:self-center whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors self-start sm:self-center whitespace-nowrap shadow-2xs"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>

              {/* Display Name Text Field (Signed-in users) */}
              {user ? (
                <form
                  onSubmit={handleSaveProfile}
                  className="pt-5 border-t border-slate-100 space-y-3"
                >
                  <div>
                    <label
                      htmlFor="settings-display-name"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Display Name
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        id="settings-display-name"
                        type="text"
                        required
                        maxLength={50}
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="Enter your display name"
                        className={cn(TEXT_INPUT_CLASS, 'flex-1')}
                      />
                      <button
                        type="submit"
                        disabled={savingProfile || uploadingAvatar}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Name</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Upload a PNG, JPG, WebP, or GIF image up to 5 MB to update your profile picture across the app.
                  </p>
                </form>
              ) : (
                <div className="pt-4 border-t border-slate-100 rounded-xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-slate-600">
                    Sign in to upload a profile picture and customize your display name.
                  </p>
                  <Link
                    to="/login"
                    className="text-xs font-bold text-rose-600 hover:underline whitespace-nowrap shrink-0"
                  >
                    Sign In Now
                  </Link>
                </div>
              )}

              {/* Password & Recovery */}
              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    Password &amp; Recovery
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user?.email
                      ? 'Send a secure password reset link directly to your registered email address.'
                      : 'Reset your Maestro Arena account password via email verification.'}
                  </p>
                </div>

                {user?.email ? (
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={sendingReset}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0',
                      resetSent
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                    )}
                  >
                    {sendingReset
                      ? 'Sending...'
                      : resetSent
                      ? 'Reset Link Sent'
                      : 'Send Reset Link'}
                  </button>
                ) : (
                  <Link
                    to="/reset-password"
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    Reset Password
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* 2. Alerts & Pinned Preferences */}
          <section
            id="notifications-alerts"
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-rose-600" />
                <h2 className="text-base font-black text-slate-900">Alerts &amp; Pinned Feed</h2>
              </div>
              {isStandalone && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Installed App
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {/* Closed-App Background Web Push */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-rose-600 shrink-0" />
                    <p className="text-sm font-bold text-slate-800">
                      Background Push Notifications
                    </p>
                    <span
                      className={cn(
                        'text-[11px] font-bold',
                        pushSubscribed
                          ? 'text-emerald-700'
                          : pushPermission === 'denied'
                          ? 'text-rose-600'
                          : 'text-slate-400'
                      )}
                    >
                      {!pushSupported
                        ? 'Not Supported'
                        : pushSubscribed
                        ? 'Active even when closed'
                        : pushPermission === 'denied'
                        ? 'Blocked in Browser'
                        : 'Off'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Receive real-time goals, 15-minute kickoff reminders, breaking football news, and new betting tips directly on your device even when the app is completely closed.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {pushSubscribed && (
                    <button
                      type="button"
                      onClick={handleSendTestPush}
                      disabled={testingPush || pushLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      {testingPush ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Test Push</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!pushSupported || pushLoading}
                    onClick={handleToggleBackgroundPush}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-2xs',
                      pushSubscribed
                        ? 'border border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    )}
                  >
                    {pushLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{pushSubscribed ? 'Disable Push' : 'Enable Background Push'}</span>
                  </button>
                </div>
              </div>

              {/* Live Match Alert Popups Toggle */}
              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">Live Match Alert Popups</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Show real-time toast and push alerts for kick-offs, goals, halftime, and full-time on followed matches.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={matchAlertsEnabled}
                  aria-label="Toggle live match alert popups"
                  onClick={handleToggleMatchAlerts}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500',
                    matchAlertsEnabled ? 'bg-rose-600' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform',
                      matchAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Active Subscriptions Summary */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/80">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Followed Match Alerts</p>
                    <p className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
                      {followedMatches.length}
                    </p>
                  </div>
                  <Link
                    to="/livescore"
                    className="text-xs font-bold text-rose-600 hover:underline whitespace-nowrap"
                  >
                    Browse Matches
                  </Link>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/80">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Pinned Clubs &amp; Leagues</p>
                    <p className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
                      {favorites.length}
                    </p>
                  </div>
                  <Link
                    to="/my-feed"
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline whitespace-nowrap"
                  >
                    <Star className="w-3.5 h-3.5" />
                    My Feed
                  </Link>
                </div>
              </div>

              {/* Notification Inbox Maintenance */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">Notification Inbox</p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {notifications.length} stored alerts · {unreadCount} unread
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={unreadCount === 0}
                    onClick={() => {
                      markAllRead();
                      toast.success('All notifications marked as read.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark All Read
                  </button>

                  <button
                    type="button"
                    disabled={notifications.length === 0}
                    onClick={() => {
                      clearAllNotifications();
                      toast.success('Notification inbox cleared.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50 text-xs font-bold text-slate-700 hover:text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Inbox
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Feedback & Support */}
          <section
            id="feedback-support"
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-rose-600" />
              <h2 className="text-base font-black text-slate-900">Send Feedback</h2>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="settings-feedback-message"
                  className="text-xs sm:text-sm text-slate-600"
                >
                  Spot an issue or want a new league or quiz feature? Send a message directly to the Maestro Arena team.
                </label>
                <span className="text-[11px] font-semibold text-slate-400 tabular-nums shrink-0">
                  {feedback.length}/500
                </span>
              </div>

              <textarea
                id="settings-feedback-message"
                required
                maxLength={500}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  user
                    ? 'Share a suggestion, match data correction, or bug report...'
                    : 'Sign in above to send direct feedback to our team...'
                }
                className={cn(TEXT_INPUT_CLASS, 'min-h-[120px] resize-y leading-relaxed')}
              />

              <div className="flex items-center justify-between gap-3">
                {!user ? (
                  <Link
                    to="/login"
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Sign in to submit feedback
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500">
                    Submitting as <strong className="font-bold text-slate-700">{displayName}</strong>
                  </span>
                )}

                <button
                  type="submit"
                  disabled={submittingFeedback || !feedback.trim()}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2.5 rounded-xl transition-colors font-bold text-xs cursor-pointer disabled:cursor-not-allowed shadow-2xs whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingFeedback ? 'Sending...' : 'Submit Feedback'}</span>
                </button>
              </div>
            </form>
          </section>

          {/* 4. Legal, Policies & Developer Copyright */}
          <section
            id="legal-about"
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-rose-600" />
              <h2 className="text-base font-black text-slate-900">Legal &amp; Policies</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="divide-y divide-slate-100 border border-slate-200/90 rounded-xl overflow-hidden bg-slate-50/40">
                <Link
                  to="/terms"
                  className="flex items-center justify-between p-4 hover:bg-white transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                        Terms of Service
                      </h3>
                      <p className="text-xs text-slate-500">
                        Match feed usage, betting tips disclaimer, video replay embed rights &amp; fair play
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                <Link
                  to="/privacy"
                  className="flex items-center justify-between p-4 hover:bg-white transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                        Privacy Policy
                      </h3>
                      <p className="text-xs text-slate-500">
                        Data protection, authentication storage, user rights &amp; account deletion
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Football predictions and betting tips are strictly for entertainment and informational purposes. 18+ only. Play responsibly.
                </p>
              </div>

              {/* Developer Copyright & Clickable Portfolio Link */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      &copy; {new Date().getFullYear()} Maestro Arena · All Rights Reserved
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Developed by{' '}
                      <a
                        href="https://eng-aaron-portifolio.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-extrabold text-rose-600 hover:text-rose-700 underline underline-offset-2 transition-colors"
                      >
                        <span>Eng Kisakye Aaron</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </p>
                  </div>
                </div>

                <a
                  href="https://eng-aaron-portifolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 text-xs font-bold text-slate-700 hover:text-rose-700 transition-colors whitespace-nowrap self-start sm:self-center"
                >
                  <span>Visit Developer Portfolio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
export default Settings;
