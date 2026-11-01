import fs from 'fs';
import path from 'path';
import { getInsforgeAdmin } from '../insforgeAdmin.js';

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  category: 'auth' | 'quiz' | 'tips' | 'matches' | 'news' | 'admin' | 'engagement';
  description: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'src/server/data');
const DATA_FILE = path.join(DATA_DIR, 'activity_logs.json');

let isDiskWritable = true;
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  isDiskWritable = false;
  console.warn('Read-only filesystem detected (serverless mode); using in-memory activity logs cache.');
}

// Live real-time event cache
let realTimeLogs: ActivityLog[] = [];
let lastSyncTimestamp = 0;
const SYNC_INTERVAL_MS = 15000; // Sync from InsForge database every 15s

// Load saved live real-time logs from disk (ignoring any legacy fake seed logs)
function loadRealTimeLogsFromDisk(): ActivityLog[] {
  if (!isDiskWritable && !fs.existsSync(DATA_FILE)) return [];
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        // Filter out any old legacy mock logs (e.g. log_seed_*)
        return parsed.filter(l => !String(l.id).startsWith('log_seed_') && !l.userEmail?.includes('@example.com'));
      }
    }
  } catch (err) {
    console.warn('Notice loading activity_logs.json:', err);
  }
  return [];
}

function saveRealTimeLogsToDisk(logs: ActivityLog[]) {
  if (!isDiskWritable) return;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    isDiskWritable = false;
    console.warn('Notice saving activity logs to disk (retaining in-memory):', err);
  }
}

realTimeLogs = loadRealTimeLogsFromDisk();


/**
 * Fetch and merge genuine user activities directly from InsForge database
 */
let cachedDatabaseLogs: ActivityLog[] = [];

export async function syncActivitiesFromInsforge(): Promise<ActivityLog[]> {
  try {
    const admin = getInsforgeAdmin();
    const dbLogs: ActivityLog[] = [];

    // 1. Try querying the dedicated activity_logs table if it exists
    try {
      const { data: dedicatedLogs, error: dedicatedErr } = await admin.database
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!dedicatedErr && Array.isArray(dedicatedLogs)) {
        dedicatedLogs.forEach((row: any) => {
          dbLogs.push({
            id: row.id || `act_db_${row.created_at}_${Math.random().toString(36).substring(2, 6)}`,
            userId: row.user_id || 'anonymous',
            userEmail: row.user_email || 'user@maestroarena.com',
            userName: row.user_name || row.user_email?.split('@')[0] || 'Active User',
            action: row.action || 'USER_ACTION',
            category: row.category || 'engagement',
            description: row.description || 'App interaction recorded',
            details: row.details || {},
            ip: row.ip || '127.0.0.1',
            userAgent: row.user_agent || 'Maestro Mobile/Web',
            timestamp: Number(row.created_at) || Date.now()
          });
        });
      }
    } catch {
      // Table may not yet be created in postgres; fallback to querying user tables below
    }

    // 2. Fetch real users from InsForge users table
    const { data: users } = await admin.database
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    const userMap = new Map<string, any>();
    if (Array.isArray(users)) {
      users.forEach((u: any) => {
        userMap.set(u.id, u);
        const isSpecialAdmin = u.email?.toLowerCase() === 'kisakyearon72@gmail.com';
        
        dbLogs.push({
          id: `usr_${u.id}`,
          userId: u.id,
          userEmail: u.email,
          userName: u.display_name || u.email.split('@')[0],
          action: isSpecialAdmin ? 'ADMIN_REGISTER' : 'AUTH_REGISTER',
          category: isSpecialAdmin ? 'admin' : 'auth',
          description: isSpecialAdmin
            ? `Platform Administrator account active: ${u.display_name} (${u.email})`
            : `User account created: ${u.display_name} (${u.email})`,
          details: { role: u.role, favoriteTeams: u.favorite_teams },
          ip: 'App Client',
          userAgent: 'Maestro Arena Verified Account',
          timestamp: Number(u.created_at) || Date.now()
        });
      });
    }

    // 3. Fetch real quiz completions from InsForge quiz_results table
    const { data: quizResults } = await admin.database
      .from('quiz_results')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(200);

    if (Array.isArray(quizResults)) {
      quizResults.forEach((q: any) => {
        const user = userMap.get(q.user_id);
        const email = user?.email || 'user@maestroarena.com';
        const name = user?.display_name || email.split('@')[0];

        dbLogs.push({
          id: `quiz_${q.id}`,
          userId: q.user_id,
          userEmail: email,
          userName: name,
          action: 'QUIZ_PLAYED',
          category: 'quiz',
          description: `Completed ${q.category || 'General'} Quiz (${q.difficulty || 'Medium'}) — Score: ${q.score}/${q.total}`,
          details: {
            score: q.score,
            total: q.total,
            category: q.category,
            difficulty: q.difficulty
          },
          ip: 'App Client',
          userAgent: 'Football Trivia Engine',
          timestamp: Number(q.completed_at) || Date.now()
        });
      });
    }

    // 4. Fetch real feedback submitted by users from InsForge feedback table
    const { data: feedbacks } = await admin.database
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (Array.isArray(feedbacks)) {
      feedbacks.forEach((f: any) => {
        const user = userMap.get(f.user_id);
        const email = user?.email || 'user@maestroarena.com';
        const name = user?.display_name || email.split('@')[0];
        const ts = new Date(f.created_at).getTime() || Date.now();

        dbLogs.push({
          id: `fb_${f.id}`,
          userId: f.user_id || 'anonymous',
          userEmail: email,
          userName: name,
          action: 'FEEDBACK_SUBMITTED',
          category: 'engagement',
          description: `Submitted app feedback: "${f.message?.slice(0, 80)}${f.message?.length > 80 ? '...' : ''}"`,
          details: { status: f.status, fullMessage: f.message },
          ip: 'App Client',
          userAgent: 'Feedback Module',
          timestamp: ts
        });
      });
    }

    // 5. Fetch real poll votes from InsForge poll_votes table
    const { data: pollVotes } = await admin.database
      .from('poll_votes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (Array.isArray(pollVotes)) {
      pollVotes.forEach((pv: any) => {
        const user = userMap.get(pv.user_id);
        const email = user?.email || 'user@maestroarena.com';
        const name = user?.display_name || email.split('@')[0];
        const ts = new Date(pv.created_at).getTime() || Date.now();

        dbLogs.push({
          id: `poll_${pv.id}`,
          userId: pv.user_id,
          userEmail: email,
          userName: name,
          action: 'POLL_VOTED',
          category: 'engagement',
          description: `Voted in community poll (Option #${pv.option_index + 1})`,
          details: { pollId: pv.poll_id, optionIndex: pv.option_index },
          ip: 'App Client',
          userAgent: 'Live Poll System',
          timestamp: ts
        });
      });
    }

    // 6. Fetch tips from InsForge tips table
    const { data: tips } = await admin.database
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (Array.isArray(tips)) {
      tips.forEach((t: any) => {
        const matchesSummary = Array.isArray(t.matches) && t.matches.length > 0
          ? `${t.matches[0].homeTeam} vs ${t.matches[0].awayTeam}`
          : 'Match Analysis';

        dbLogs.push({
          id: `tip_${t.id}`,
          userId: 'admin_team',
          userEmail: 'kisakyearon72@gmail.com',
          userName: 'Maestro Admin',
          action: 'TIP_POSTED',
          category: 'tips',
          description: `Football Prediction added: ${matchesSummary} (Odds: ${t.odds || 'N/A'}, Status: ${t.status || 'pending'})`,
          details: {
            category: t.category,
            odds: t.odds,
            status: t.status,
            bookingCode: t.booking_code
          },
          ip: 'Admin Portal',
          userAgent: 'Maestro Prediction Center',
          timestamp: Number(t.created_at || t.publish_date) || Date.now()
        });
      });
    }

    // 7. Fetch notifications broadcasted from InsForge app_notifications table
    const { data: notifs } = await admin.database
      .from('app_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (Array.isArray(notifs)) {
      notifs.forEach((n: any) => {
        const ts = new Date(n.created_at).getTime() || Date.now();
        dbLogs.push({
          id: `notif_${n.id}`,
          userId: 'admin_team',
          userEmail: 'kisakyearon72@gmail.com',
          userName: 'Platform Admin',
          action: 'NOTIFICATION_BROADCAST',
          category: 'admin',
          description: `Broadcasted platform alert: "${n.title}"`,
          details: { type: n.type, message: n.message },
          ip: 'Admin Console',
          userAgent: 'Broadcast Engine',
          timestamp: ts
        });
      });
    }

    cachedDatabaseLogs = dbLogs;
    lastSyncTimestamp = Date.now();
    return dbLogs;
  } catch (err) {
    console.error('Error syncing activities from InsForge database:', err);
    return cachedDatabaseLogs;
  }
}

// Initial sync on startup
syncActivitiesFromInsforge().catch(() => {});

/**
 * Record a new real-time activity event from an active user
 */
export async function recordActivity(entry: Omit<ActivityLog, 'id' | 'timestamp'> & { timestamp?: number }): Promise<ActivityLog> {
  const newLog: ActivityLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: entry.userId || 'anonymous',
    userEmail: entry.userEmail || 'active_user@maestroarena.com',
    userName: entry.userName || entry.userEmail?.split('@')[0] || 'Active Fan',
    action: entry.action,
    category: entry.category,
    description: entry.description,
    details: entry.details || {},
    ip: entry.ip || '127.0.0.1',
    userAgent: entry.userAgent || 'Maestro Client',
    timestamp: entry.timestamp || Date.now()
  };

  // Add to live real-time cache (newest first, max 10,000 entries)
  realTimeLogs.unshift(newLog);
  if (realTimeLogs.length > 10000) {
    realTimeLogs = realTimeLogs.slice(0, 10000);
  }

  // Persist to disk asynchronously
  saveRealTimeLogsToDisk(realTimeLogs);

  // Replicate to InsForge database activity_logs table
  try {
    const admin = getInsforgeAdmin();
    Promise.resolve(
      admin.database.from('activity_logs').insert([{
        id: newLog.id,
        user_id: newLog.userId === 'anonymous' ? null : newLog.userId,
        user_email: newLog.userEmail,
        user_name: newLog.userName,
        action: newLog.action,
        category: newLog.category,
        description: newLog.description,
        details: newLog.details,
        ip: newLog.ip,
        user_agent: newLog.userAgent,
        created_at: newLog.timestamp
      }])
    ).then((res: any) => {
      if (res?.error) {
        // Table might not exist yet; silent fallback
      }
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  return newLog;
}

/**
 * Combine real-time incoming events with InsForge database records
 */
function getAllRealLogs(): ActivityLog[] {
  // Deduplicate by ID
  const map = new Map<string, ActivityLog>();

  // Add real-time user events first
  realTimeLogs.forEach(l => map.set(l.id, l));

  // Add database records
  cachedDatabaseLogs.forEach(l => {
    if (!map.has(l.id)) {
      map.set(l.id, l);
    }
  });

  const merged = Array.from(map.values());
  // Sort strictly newest first
  merged.sort((a, b) => b.timestamp - a.timestamp);
  return merged;
}

/**
 * Get filtered & paginated activity logs directly from InsForge database and live user actions
 */
export async function getActivityLogs(options: {
  category?: string;
  search?: string;
  action?: string;
  limit?: number;
  offset?: number;
  forceSync?: boolean;
}) {
  // Refresh from InsForge if interval elapsed or forced
  if (options.forceSync || Date.now() - lastSyncTimestamp > SYNC_INTERVAL_MS) {
    await syncActivitiesFromInsforge();
  }

  let filtered = getAllRealLogs();

  if (options.category && options.category !== 'all') {
    filtered = filtered.filter(l => l.category === options.category);
  }

  if (options.action && options.action !== 'all') {
    filtered = filtered.filter(l => l.action.toLowerCase() === options.action?.toLowerCase());
  }

  if (options.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(l =>
      l.userEmail.toLowerCase().includes(q) ||
      l.userName.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const logs = filtered.slice(offset, offset + limit);

  return {
    logs,
    total,
    limit,
    offset,
    source: 'InsForge Database (Live Connected)'
  };
}

/**
 * Compute real analytics and statistics from real users
 */
export async function getActivityStats() {
  if (Date.now() - lastSyncTimestamp > SYNC_INTERVAL_MS) {
    await syncActivitiesFromInsforge();
  }

  const allLogs = getAllRealLogs();
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const recentLogs = allLogs.filter(l => l.timestamp >= dayAgo);

  // Compute unique active users in past 24 hours (or all time if low recent activity)
  const activeEmails24h = new Set(
    recentLogs
      .map(l => l.userEmail)
      .filter(e => e && !e.includes('visitor@') && !e.includes('active_user@'))
  );

  const allActiveEmails = new Set(
    allLogs
      .map(l => l.userEmail)
      .filter(e => e && !e.includes('visitor@') && !e.includes('active_user@'))
  );

  const categoryCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};

  allLogs.forEach(l => {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
  });

  let topAction = 'QUIZ_PLAYED';
  let topActionCount = 0;
  Object.entries(actionCounts).forEach(([action, count]) => {
    if (count > topActionCount) {
      topActionCount = count;
      topAction = action;
    }
  });

  return {
    totalEvents24h: recentLogs.length,
    totalEventsAllTime: allLogs.length,
    activeUsersToday: activeEmails24h.size > 0 ? activeEmails24h.size : Math.max(1, allActiveEmails.size),
    totalRegisteredUsers: allActiveEmails.size,
    categoryCounts,
    topAction,
    topActionCount,
    source: 'InsForge Database (Real Data)'
  };
}

/**
 * Purge or clear activity logs with multiple scopes
 */
export async function clearActivityLogs(options?: {
  scope?: 'all' | 'older_24h' | 'older_7d' | 'keep_50';
  category?: string;
}) {
  const scope = options?.scope || 'all';
  const now = Date.now();
  const admin = getInsforgeAdmin();

  try {
    if (scope === 'all') {
      // 1. Delete all rows from InsForge activity_logs table
      try {
        await admin.database.from('activity_logs').delete().neq('id', '___none___');
      } catch (err) {
        console.warn('InsForge delete activity_logs notice:', err);
      }
      realTimeLogs = [];
      cachedDatabaseLogs = [];
      saveRealTimeLogsToDisk([]);
    } else if (scope === 'older_24h') {
      const cutoff = now - 24 * 60 * 60 * 1000;
      try {
        await admin.database.from('activity_logs').delete().lt('created_at', cutoff);
      } catch (err) {
        console.warn('InsForge delete older_24h notice:', err);
      }
      realTimeLogs = realTimeLogs.filter(l => l.timestamp >= cutoff);
      cachedDatabaseLogs = cachedDatabaseLogs.filter(l => l.timestamp >= cutoff);
      saveRealTimeLogsToDisk(realTimeLogs);
    } else if (scope === 'older_7d') {
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      try {
        await admin.database.from('activity_logs').delete().lt('created_at', cutoff);
      } catch (err) {
        console.warn('InsForge delete older_7d notice:', err);
      }
      realTimeLogs = realTimeLogs.filter(l => l.timestamp >= cutoff);
      cachedDatabaseLogs = cachedDatabaseLogs.filter(l => l.timestamp >= cutoff);
      saveRealTimeLogsToDisk(realTimeLogs);
    } else if (scope === 'keep_50') {
      const allCurrent = getAllRealLogs();
      if (allCurrent.length > 50) {
        const keepIds = new Set(allCurrent.slice(0, 50).map(l => l.id));
        const deleteIds = allCurrent.slice(50).map(l => l.id);
        
        try {
          // Batch delete in chunks of 50
          for (let i = 0; i < deleteIds.length; i += 50) {
            const chunk = deleteIds.slice(i, i + 50);
            await admin.database.from('activity_logs').delete().in('id', chunk);
          }
        } catch (err) {
          console.warn('InsForge batch delete notice:', err);
        }

        realTimeLogs = realTimeLogs.filter(l => keepIds.has(l.id));
        cachedDatabaseLogs = cachedDatabaseLogs.filter(l => keepIds.has(l.id));
        saveRealTimeLogsToDisk(realTimeLogs);
      }
    }
  } catch (err) {
    console.error('Error during clearActivityLogs:', err);
  }

  const remaining = getAllRealLogs().length;
  return { success: true, remaining };
}

/**
 * Delete specific activity logs by their IDs
 */
export async function deleteActivityLogsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return { success: true, deleted: 0 };
  const idSet = new Set(ids);
  const admin = getInsforgeAdmin();

  try {
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      try {
        await admin.database.from('activity_logs').delete().in('id', chunk);
      } catch (err) {
        console.warn('Error deleting specific logs from InsForge:', err);
      }
    }
  } catch (err) {
    console.error('deleteActivityLogsByIds error:', err);
  }

  realTimeLogs = realTimeLogs.filter(l => !idSet.has(l.id));
  cachedDatabaseLogs = cachedDatabaseLogs.filter(l => !idSet.has(l.id));
  saveRealTimeLogsToDisk(realTimeLogs);

  return { success: true, deleted: ids.length, remaining: getAllRealLogs().length };
}

