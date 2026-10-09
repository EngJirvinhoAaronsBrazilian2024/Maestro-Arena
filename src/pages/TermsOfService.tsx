import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Tv, 
  Trophy, 
  FileText, 
  Scale, 
  UserCheck, 
  ChevronLeft, 
  Mail, 
  ExternalLink 
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function TermsOfService() {
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
              <Scale className="w-7 h-7 text-rose-600" />
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Effective Date: October 9, 2026 • Maestro Arena / SportsHub
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/privacy">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
              View Privacy Policy
            </Button>
          </Link>
        </div>
      </div>

      {/* Important Highlights Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3.5 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
              Betting Tips & Predictions Disclaimer
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              All football predictions and betting tips are strictly for informational and entertainment purposes. We do not provide financial advice or guarantee winnings. 18+ only.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-start gap-3.5 shadow-2xs">
          <Tv className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">
              Third-Party Feeds & Broadcast Content
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              Live scores and official video highlights are embedded via ScoreBat and FotMob. All logos, club badges, and video clips belong to their respective rightsholders.
            </p>
          </div>
        </div>
      </div>

      {/* Main Legal Clauses */}
      <Card className="border-slate-200/90 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-5 sm:p-8 space-y-8 text-slate-700 leading-relaxed text-sm">
          {/* Section 1 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">1</span>
              <h2>Acceptance of Terms</h2>
            </div>
            <p>
              By accessing, browsing, registering for, or using <strong>Maestro Arena (SportsHub)</strong> (the "Application", "Service", or "Platform"), you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to all terms and conditions outlined herein, you must immediately discontinue using the Application.
            </p>
            <p>
              We reserve the right to modify or update these Terms at any time. Continued use of the platform after updates constitutes your explicit acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">2</span>
              <h2>User Eligibility & Account Security</h2>
            </div>
            <p>
              You must be at least 13 years old to use the platform for general football trivia and match feeds. To access any sports betting tips, odds analysis, or predictions sections, you must be at least <strong>18 years of age</strong> (or the legal age for sports betting in your local jurisdiction).
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>You are responsible for safeguarding your login credentials (email and password).</li>
              <li>You must provide accurate information when creating an account and updating profile names.</li>
              <li>You agree not to share your account or use another member's account without authorization.</li>
              <li>We reserve the right to suspend or terminate accounts that violate community safety or security standards.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">3</span>
              <h2>Sports Betting & Predictions Disclaimer (Strict Non-Liability)</h2>
            </div>
            <p>
              The football betting tips, accumulator suggestions, odds analysis, and AI predictions provided on Maestro Arena are strictly for <strong>entertainment, educational, and statistical analysis purposes only</strong>.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <p className="font-bold text-slate-900">Please note:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>We do not operate a bookmaker, sportsbook, or betting service. We do not accept or process financial wagers.</li>
                <li>Sports outcomes are inherently unpredictable. Past performance, tip streaks, or prediction models do not guarantee future results.</li>
                <li><strong>Maestro Arena accepts zero liability</strong> for any financial loss, damages, or consequences arising from bets placed with external sportsbooks or third parties based on content found on this app.</li>
                <li>Please gamble responsibly. If you or someone you know is struggling with gambling, please seek assistance from recognized organizations such as BeGambleAware (begambleaware.org).</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">4</span>
              <h2>Third-Party Data, Livescores & Video Highlights</h2>
            </div>
            <p>
              Maestro Arena embeds and aggregates sports statistics, livescores, tables, and video highlight replays through third-party services including FotMob and ScoreBat.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>All club crests, league logos, player likenesses, and match broadcast videos remain the intellectual property and copyright of their respective rights holders, clubs, leagues, and broadcast partners.</li>
              <li>We do not host or upload video highlight files on our own servers; videos are loaded via authorized embed streams provided by third parties.</li>
              <li>We do not warrant that match data, live clock minutes, or video streams will be 100% uninterrupted, error-free, or real-time under all network conditions.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">5</span>
              <h2>Football Quiz Arena & Fair Play Policy</h2>
            </div>
            <p>
              The Football Quiz Arena features solo challenges, Daily Blitz trivia, and real-time multiplayer Head-to-Head (H2H) showdowns. To maintain an authentic, competitive community:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Users must not use automated bots, scripts, browser extensions, or exploits to manipulate timer countdowns or scores.</li>
              <li>Scores obtained through cheating or unauthorized tampering will be removed from global and season leaderboards.</li>
              <li>Display names and avatars on public leaderboards must remain respectful and free of hate speech, defamation, or offensive content.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">6</span>
              <h2>Intellectual Property & User Content</h2>
            </div>
            <p>
              All original design, application branding, trivia question databases, software architecture, and interface elements of Maestro Arena are the intellectual property of the service operators.
            </p>
            <p>
              By uploading an avatar or submitting feedback through the app, you grant Maestro Arena a non-exclusive, worldwide, royalty-free license to display that content within the application for operational purposes.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">7</span>
              <h2>Limitation of Liability & Warranty Disclaimer</h2>
            </div>
            <p>
              THE APPLICATION AND ALL ASSOCIATED CONTENT ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, MAESTRO ARENA DISCLAIMS ALL WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              IN NO EVENT SHALL MAESTRO ARENA OR ITS OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES RESULTING FROM YOUR ACCESS TO OR INABILITY TO ACCESS THE SERVICE, INCLUDING RELIANCE ON MATCH DATA OR SPORTS BETTING OUTCOMES.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-2.5 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 text-slate-950 font-black text-base sm:text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">8</span>
              <h2>Contact & Legal Inquiries</h2>
            </div>
            <p>
              If you have any questions, concerns, or legal notices regarding these Terms of Service, please reach out to our team:
            </p>
            <div className="flex items-center gap-2 text-rose-600 font-bold mt-2">
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

export default TermsOfService;
