import React, { useState, useEffect, useMemo } from 'react';
import { insforge } from '../../lib/insforge';
import { 
  HelpCircle, 
  CheckCircle, 
  MessageSquare, 
  Clock, 
  User, 
  Mail, 
  Search, 
  RotateCw, 
  Copy, 
  Check, 
  BadgeAlert,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { UserAvatar } from '../../components/ui/UserAvatar';

export function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedData: any[] | null = null;

      // 1. Try primary admin endpoint: /api/admin/feedback
      try {
        const res = await fetch('/api/admin/feedback', {
          headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            fetchedData = json;
          }
        }
      } catch (err) {
        console.warn('Primary /api/admin/feedback notice:', err);
      }

      // 2. Try alias endpoint: /api/feedback
      if (!fetchedData) {
        try {
          const res = await fetch('/api/feedback', {
            headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
          });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) {
              fetchedData = json;
            }
          }
        } catch (err) {
          console.warn('Alternate /api/feedback notice:', err);
        }
      }

      // If server routes succeeded with array
      if (fetchedData && Array.isArray(fetchedData)) {
        setFeedbacks(fetchedData);
        setLoading(false);
        return;
      }

      // 3. Fallback: Direct database client query
      try {
        const [fbRes, usersRes] = await Promise.all([
          insforge.database.from('feedback').select('*').order('created_at', { ascending: false }),
          insforge.database.from('users').select('*')
        ]);
        
        const userMap = new Map<string, any>();
        (usersRes.data || []).forEach((u: any) => {
          userMap.set(u.id, u);
        });

        if (!fbRes.error && Array.isArray(fbRes.data)) {
          const enriched = fbRes.data.map((f: any) => {
            const u = f.user_id ? userMap.get(f.user_id) : null;
            const fallbackName = u?.display_name || u?.name || (u?.email ? u.email.split('@')[0] : 'User');
            return {
              ...f,
              user_name: f.user_name || fallbackName,
              user_email: f.user_email || u?.email || '',
              user_avatar: f.user_avatar || u?.avatar_url || ''
            };
          });
          setFeedbacks(enriched);
          setLoading(false);
          return;
        } else if (fbRes.error) {
          throw fbRes.error;
        }
      } catch (dbErr: any) {
        console.error('Direct database fallback notice:', dbErr);
      }

      // If we still have no data and no successful response:
      throw new Error('Could not connect to the feedback service. Please refresh or check database status.');
    } catch (e: any) {
      console.error('Feedback loading failed:', e);
      setError(e.message || 'Unable to retrieve feedback messages');
      toast.error('Failed to load feedback: ' + (e.message || 'Network issue'));
    } finally {
      setLoading(false);
    }
  };

  const resolveFeedback = async (id: string, newStatus: 'resolved' | 'open' = 'resolved') => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}/resolve`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Feedback marked as ${newStatus}`);
        loadFeedback();
        return;
      }
    } catch (e) {
      // fallback
    }

    try {
      await insforge.database.from('feedback').update({ status: newStatus }).eq('id', id);
      toast.success(`Feedback marked as ${newStatus}`);
      loadFeedback();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safely filtered and searched feedbacks (guaranteed array)
  const safeFeedbacks = useMemo(() => {
    return Array.isArray(feedbacks) ? feedbacks : [];
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return safeFeedbacks.filter((f) => {
      const matchesStatus = 
        statusFilter === 'all' ? true : (f.status || 'open') === statusFilter;
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (f.user_name && String(f.user_name).toLowerCase().includes(q)) ||
        (f.user_email && String(f.user_email).toLowerCase().includes(q)) ||
        (f.message && String(f.message).toLowerCase().includes(q)) ||
        (f.user_id && String(f.user_id).toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [safeFeedbacks, statusFilter, searchQuery]);

  const openCount = safeFeedbacks.filter(f => (f.status || 'open') === 'open').length;
  const resolvedCount = safeFeedbacks.filter(f => f.status === 'resolved').length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Community Signals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-1">
            User Feedback Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Read bug reports, feature suggestions, and reviews directly with verified user identities.
          </p>
        </div>

        <button
          onClick={loadFeedback}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200/80 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 text-rose-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh Inbox
        </button>
      </div>

      {/* Error Banner with Retry Button */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-red-950">Error Loading Feedback</h4>
              <p className="text-2xs sm:text-xs text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={loadFeedback}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Search input for User Name, Email, or Message */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user name, email, or message keyword..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({safeFeedbacks.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'open'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center text-slate-500 text-sm font-medium shadow-xs">
            <div className="flex justify-center mb-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-rose-600 border-t-transparent" />
            </div>
            Loading user feedback messages with sender profiles...
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-12 text-center shadow-xs">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h4 className="text-base font-black text-slate-900 mb-1">
              {searchQuery ? 'No matching feedback found' : 'Inbox is empty'}
            </h4>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              {searchQuery 
                ? `No submissions matched "${searchQuery}". Try a different name or keyword.`
                : 'No customer or user feedback messages received yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredFeedbacks.map((f) => {
                const displayName = f.user_name || (f.user_email ? f.user_email.split('@')[0] : 'SportsHub User');
                const isResolved = f.status === 'resolved';

                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-3xl border p-5 sm:p-6 transition-all shadow-xs hover:shadow-md ${
                      isResolved
                        ? 'bg-slate-50/80 border-slate-200/90 opacity-80'
                        : 'bg-white border-rose-200/80 hover:border-rose-300'
                    }`}
                  >
                    {/* Top Identity Bar: User Name, Avatar, and Badges (PROMINENT AT TOP) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <UserAvatar 
                          name={displayName} 
                          email={f.user_email} 
                          avatarUrl={f.user_avatar}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* USER NAME IN LARGE, BOLD HIGH-VISIBILITY FONT */}
                            <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
                              {displayName}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80">
                              <User className="w-3 h-3" />
                              User
                            </span>
                          </div>

                          {/* Email badge with copy button */}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {f.user_email ? (
                              <button
                                onClick={() => copyEmail(f.user_email, f.id)}
                                title="Click to copy email address"
                                className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              >
                                <Mail className="w-3 h-3 text-slate-400" />
                                {f.user_email}
                                {copiedId === f.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                            ) : (
                              <span className="text-2xs text-slate-400 font-mono">
                                No email recorded
                              </span>
                            )}

                            {f.user_id && (
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 hidden md:inline">
                                ID: {f.user_id.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status and Time badges */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                          isResolved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isResolved ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <BadgeAlert className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          {f.status || 'open'}
                        </span>

                        <div className="flex items-center gap-1 text-2xs text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                          <Clock className="h-3 w-3" />
                          <span>{f.created_at ? new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="my-4 bg-slate-50/60 rounded-2xl p-4 border border-slate-100">
                      <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        "{f.message}"
                      </p>
                    </div>

                    {/* Action Bar: Direct Reply & Resolve Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        {f.user_email && (
                          <a
                            href={`mailto:${f.user_email}?subject=Regarding your Maestro Arena feedback&body=Hi ${displayName},%0D%0A%0D%0AThank you for reaching out to us regarding:%0D%0A"${encodeURIComponent(f.message)}"%0D%0A%0D%0A`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200/90 shadow-2xs transition-all cursor-pointer hover:border-rose-300"
                          >
                            <Mail className="w-3.5 h-3.5 text-rose-600" />
                            Reply to {displayName}
                            <ArrowUpRight className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isResolved ? (
                          <button
                            onClick={() => resolveFeedback(f.id, 'open')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Reopen Feedback
                          </button>
                        ) : (
                          <button
                            onClick={() => resolveFeedback(f.id, 'resolved')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black text-white transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
                          >
                            <CheckCircle size={14} /> Mark as Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminFeedback;
