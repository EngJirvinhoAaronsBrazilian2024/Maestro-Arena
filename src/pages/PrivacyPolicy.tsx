import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Database, 
  Eye, 
  UserCheck, 
  Trash2, 
  ChevronLeft, 
  Mail, 
  FileCheck,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Top Header / Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white shadow-2xs hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1 text-slate-700" />
            <span className="text-xs font-bold text-slate-700">Back</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
              <Shield className="w-7 h-7 text-emerald-600" />
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Effective Date: October 9, 2026 • Maestro Arena / SportsHub
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/terms">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
              View Terms of Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Privacy Commitments Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Secure Storage</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">
            Your login passwords and profile credentials are encrypted using industry-standard cryptographic algorithms.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wider">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>No Data Selling</span>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            We never sell, rent, or trade your personal information or contact details to third-party data brokers.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-900 font-black text-xs uppercase tracking-wider">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Right to Erasure</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed font-medium">
            You retain the right to inspect, export, or permanently delete your account, scores, and profile records at any time.
          </p>
        </div>
      </div>

      {/* Main Privacy Policy Sections */}
      <Card className="border-slate-200/90 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-5 sm:p-8 space-y-8 text-slate-700 leading-relaxed text-sm">
          {/* Section 1 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">1</span>
              <h2>Introduction & Scope</h2>
            </div>
            <p>
              At <strong>Maestro Arena (SportsHub)</strong>, we are committed to respecting and protecting your privacy. This Privacy Policy details how we collect, store, process, and safeguard your personal information when you use our mobile and web applications, quiz arenas, and live sports centers.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">2</span>
              <h2>Information We Collect</h2>
            </div>
            <p>We only collect data necessary to provide you with a fast, personalized sports experience:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> Account Details
                </span>
                <p className="text-xs text-slate-600">
                  Email address, chosen display name, encrypted password hash, and optional profile avatar pictures.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" /> Quiz & Gameplay Activity
                </span>
                <p className="text-xs text-slate-600">
                  Points, trivia scores, streak counts, Head-to-Head win/loss records, and category achievements.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-500" /> Support & Feedback Messages
                </span>
                <p className="text-xs text-slate-600">
                  Text, suggestions, or bug reports submitted via the in-app feedback tool in Settings.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-purple-500" /> Technical & Session Logs
                </span>
                <p className="text-xs text-slate-600">
                  Device viewport preferences, network status, and local storage tokens for session persistence.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">3</span>
              <h2>How We Use Your Data</h2>
            </div>
            <p>Your information is used strictly to power core app features:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Authenticating your account and keeping you safely signed in across devices.</li>
              <li>Calculating accurate leaderboard rankings, streak counters, and player rankings.</li>
              <li>Pairing and synchronizing multiplayer trivia sessions via real-time WebSockets.</li>
              <li>Delivering match announcements, notifications, and customer support responses.</li>
              <li>Monitoring platform stability, eliminating software bugs, and preventing cheating.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">4</span>
              <h2>Cookies & Local Storage</h2>
            </div>
            <p>
              We use <strong>Local Storage</strong> and essential session cookies to remember your login session, preferred leagues, dark/light theme options, and offline cache. We do not use intrusive third-party cross-site ad trackers.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">5</span>
              <h2>Third-Party Services & Integrations</h2>
            </div>
            <p>
              To provide live sports scores and video replays, our app integrates with trusted third-party providers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>FotMob:</strong> Powers league tables, match statistics, and team schedules.</li>
              <li><strong>ScoreBat:</strong> Delivers official video highlights and live football scores.</li>
              <li><strong>Cloud Storage:</strong> Securely hosts user-uploaded profile avatars.</li>
            </ul>
            <p className="text-xs text-slate-500">
              These external content networks may receive standard HTTP network logs (such as IP addresses and user agents) to transmit live media streams to your device.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">6</span>
              <h2>Your Rights & Data Deletion (GDPR / CCPA)</h2>
            </div>
            <p>
              Regardless of your location, we believe you should have complete control over your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Right to Access:</strong> You can review your profile information and quiz statistics at any time in the Profile tab.</li>
              <li><strong>Right to Rectification:</strong> You can update your display name and avatar instantly in Account Settings.</li>
              <li><strong>Right to Erasure (Account Deletion):</strong> You may request the permanent deletion of your account and all associated scores by emailing us at <a href="mailto:kisakyearon72@gmail.com" className="text-emerald-700 font-semibold hover:underline">kisakyearon72@gmail.com</a>.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-2.5 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">7</span>
              <h2>Contact the Data Controller</h2>
            </div>
            <p>
              If you have any questions or requests regarding your data protection and privacy rights on Maestro Arena, please contact:
            </p>
            <div className="flex items-center gap-2 text-emerald-700 font-bold mt-2">
              <Mail className="w-4 h-4" />
              <a href="mailto:kisakyearon72@gmail.com" className="hover:underline">
                kisakyearon72@gmail.com
              </a>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

export default PrivacyPolicy;
