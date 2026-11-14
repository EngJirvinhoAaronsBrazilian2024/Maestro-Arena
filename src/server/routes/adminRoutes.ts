import { Router } from 'express';
import { getInsforgeAdmin } from '../insforgeAdmin.js';
import { recordActivity, getActivityLogs, getActivityStats, clearActivityLogs, deleteActivityLogsByIds } from '../services/activityService.js';
import { autoIngestFootballNews, cleanPlainEnglishText, DEPRECATED_STALE_SOURCES, isFreshNewsTimestamp, normalizeNewsHeadline, resolveAndEnrichArticleContent } from '../services/autoNewsService.js';
import { broadcastPushNotification } from '../services/pushService.js';


const router = Router();

// Helper: check if caller or admin ID is valid
const SPECIAL_ADMIN_EMAIL = 'kisakyearon72@gmail.com';
const SPECIAL_ADMIN_ID = '2886ae6d-b563-44a3-b4b8-ae932cc188ad';

// -------------------------------------------------------------
// 1. OVERVIEW STATS
// -------------------------------------------------------------
router.get('/overview', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const [
      usersRes,
      tipsRes,
      quizRes,
      articlesRes,
      feedbackRes,
      pollsRes,
      notifsRes,
      seasonsRes
    ] = await Promise.all([
      admin.database.from('users').select('id, role'),
      admin.database.from('tips').select('id, status, category'),
      admin.database.from('quiz_questions').select('*', { count: 'exact', head: true }),
      admin.database.from('articles').select('id, status'),
      admin.database.from('feedback').select('id, status'),
      admin.database.from('polls').select('id, status'),
      admin.database.from('app_notifications').select('id'),
      admin.database.from('quiz_seasons').select('id, is_active')
    ]);

    const users = usersRes.data || [];
    const adminsCount = users.filter((u: any) => u.role === 'admin').length;
    const tips = tipsRes.data || [];
    const wonTipsCount = tips.filter((t: any) => t.status === 'won').length;
    const lostTipsCount = tips.filter((t: any) => t.status === 'lost').length;
    const pendingTipsCount = tips.filter((t: any) => t.status === 'pending').length;
    const articles = articlesRes.data || [];
    const publishedArticlesCount = articles.filter((a: any) => a.status === 'published').length;
    const draftArticlesCount = articles.filter((a: any) => a.status === 'draft').length;
    const feedbacks = feedbackRes.data || [];
    const openFeedbackCount = feedbacks.filter((f: any) => f.status === 'open').length;
    const resolvedFeedbackCount = feedbacks.filter((f: any) => f.status === 'resolved').length;
    const polls = pollsRes.data || [];
    const activePollsCount = polls.filter((p: any) => p.status === 'active').length;
    const seasons = seasonsRes.data || [];
    const activeSeasonsCount = seasons.filter((s: any) => s.is_active).length;

    res.json({
      totalUsers: users.length,
      totalAdmins: adminsCount,
      totalTips: tips.length,
      wonTipsCount,
      lostTipsCount,
      pendingTipsCount,
      totalQuestions: typeof quizRes.count === 'number' ? quizRes.count : ((quizRes as any).data || []).length,
      totalArticles: articles.length,
      publishedArticlesCount,
      draftArticlesCount,
      totalFeedback: feedbacks.length,
      openFeedbackCount,
      resolvedFeedbackCount,
      totalPolls: polls.length,
      activePollsCount,
      totalNotifications: (notifsRes.data || []).length,
      totalSeasons: seasons.length,
      activeSeasonsCount
    });
  } catch (err: any) {
    console.error('Error fetching admin overview:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. USERS MANAGEMENT
// -------------------------------------------------------------
router.get('/users', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    
    // Auto-sync missing users from auth into public.users
    try {
      const baseUrl = process.env.INSFORGE_BASE_URL || 'https://gci83gu5.us-east.insforge.app';
      const apiKey = process.env.INSFORGE_API_KEY || '';
      const authRes = await fetch(`${baseUrl}/api/auth/users`, {
        headers: { 'x-api-key': apiKey, 'apikey': apiKey }
      });
      const authData = authRes.ok ? await authRes.json() : [];
      const authUsers = Array.isArray(authData) ? authData : (authData?.data || []);
      for (const au of authUsers) {
        const isSpecialAdmin = au.email?.toLowerCase() === SPECIAL_ADMIN_EMAIL;
        const role = isSpecialAdmin ? 'admin' : 'user';
        const displayName = au.profile?.name || au.email?.split('@')[0] || 'User';
        const createdAt = new Date(au.createdAt).getTime();

        const { data: existing } = await admin.database.from('users').select('id, role').eq('id', au.id).single();
        if (!existing) {
          await admin.database.from('users').insert([{
            id: au.id,
            email: au.email,
            display_name: displayName,
            role,
            created_at: createdAt
          }]);
        } else if (isSpecialAdmin && existing.role !== 'admin') {
          await admin.database.from('users').update({ role: 'admin' }).eq('id', au.id);
        }
      }
    } catch (syncErr) {
      console.warn('Auth users background sync notice:', syncErr);
    }

    const { data, error } = await admin.database
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error('Error in /api/admin/users:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/sync', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const baseUrl = process.env.INSFORGE_BASE_URL || 'https://gci83gu5.us-east.insforge.app';
    const apiKey = process.env.INSFORGE_API_KEY || '';
    const authRes = await fetch(`${baseUrl}/api/auth/users`, {
      headers: { 'x-api-key': apiKey, 'apikey': apiKey }
    });
    const authData = authRes.ok ? await authRes.json() : [];
    const authUsers = Array.isArray(authData) ? authData : (authData?.data || []);
    let synced = 0;

    for (const au of authUsers) {
      const isSpecialAdmin = au.email?.toLowerCase() === SPECIAL_ADMIN_EMAIL;
      const role = isSpecialAdmin ? 'admin' : 'user';
      const displayName = au.profile?.name || au.email?.split('@')[0] || 'User';
      const createdAt = new Date(au.createdAt).getTime();

      const { data: existing } = await admin.database.from('users').select('id, role').eq('id', au.id).single();
      if (!existing) {
        await admin.database.from('users').insert([{
          id: au.id,
          email: au.email,
          display_name: displayName,
          role,
          created_at: createdAt
        }]);
        synced++;
      } else if (isSpecialAdmin && existing.role !== 'admin') {
        await admin.database.from('users').update({ role: 'admin' }).eq('id', au.id);
      }
    }

    const { data: allUsers } = await admin.database.from('users').select('*').order('created_at', { ascending: false });
    res.json({ success: true, synced, users: allUsers || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. NOTIFICATIONS
// -------------------------------------------------------------
router.get('/notifications', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('app_notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('app_notifications')
      .insert([{
        title,
        message,
        type: type || 'info'
      }])
      .select('*');
    if (error) throw error;
    const createdNotif = data?.[0];
    const broadcastId = createdNotif?.id || Date.now();
    void broadcastPushNotification({
      title: String(title).trim(),
      body: String(message).trim(),
      url: '/',
      tag: `broadcast_${broadcastId}`,
    });
    res.json(createdNotif || { success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    const { error } = await admin.database.from('app_notifications').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. POLLS & VOTES
// -------------------------------------------------------------
router.get('/polls', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const [pollsRes, votesRes] = await Promise.all([
      admin.database.from('polls').select('*').order('created_at', { ascending: false }),
      admin.database.from('poll_votes').select('poll_id, option_index')
    ]);

    if (pollsRes.error) throw pollsRes.error;

    const polls = pollsRes.data || [];
    const votes = votesRes.data || [];

    // Calculate aggregated votes per option
    const enhancedPolls = polls.map((poll: any) => {
      const pollVotes = votes.filter((v: any) => v.poll_id === poll.id);
      const totalVotes = pollVotes.length;
      const optionCounts: number[] = (poll.options || []).map((_: any, idx: number) => {
        return pollVotes.filter((v: any) => v.option_index === idx).length;
      });

      return {
        ...poll,
        totalVotes,
        optionCounts
      };
    });

    res.json(enhancedPolls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/polls', async (req, res) => {
  try {
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('polls')
      .insert([{
        question,
        options,
        status: 'active'
      }])
      .select('*');
    if (error) throw error;
    res.json(data?.[0] || { success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/polls/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    const { error } = await admin.database.from('polls').update({ status: 'closed' }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, status: 'closed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/polls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    // Delete votes first then poll
    await admin.database.from('poll_votes').delete().eq('poll_id', id);
    const { error } = await admin.database.from('polls').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. QUIZ SEASONS
// -------------------------------------------------------------
router.get('/seasons', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('quiz_seasons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/seasons', async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;
    if (!name) return res.status(400).json({ error: 'Season name is required' });
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('quiz_seasons')
      .insert([{
        name,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active: false
      }])
      .select('*');
    if (error) throw error;
    res.json(data?.[0] || { success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/seasons/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStatus } = req.body;
    const admin = getInsforgeAdmin();
    const newStatus = !currentStatus;

    if (newStatus) {
      // Deactivate all others first
      await admin.database.from('quiz_seasons').update({ is_active: false }).neq('id', id);
    }

    const { error } = await admin.database.from('quiz_seasons').update({ is_active: newStatus }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, is_active: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/seasons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    const { error } = await admin.database.from('quiz_seasons').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. FEEDBACK
// -------------------------------------------------------------
router.get('/feedback', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const admin = getInsforgeAdmin();
    let feedbacks: any[] = [];
    
    // Resilient query for feedback
    try {
      const fbRes = await admin.database.from('feedback').select('*').order('created_at', { ascending: false });
      if (fbRes.error) {
        console.warn('Feedback order query error, retrying without order:', fbRes.error);
        const fallbackRes = await admin.database.from('feedback').select('*');
        feedbacks = fallbackRes.data || [];
      } else {
        feedbacks = fbRes.data || [];
      }
    } catch (fbErr: any) {
      console.warn('Feedback query error, attempting base select:', fbErr.message);
      const fallbackRes = await admin.database.from('feedback').select('*');
      feedbacks = fallbackRes.data || [];
    }

    // Safe user profiles lookup
    const userMap = new Map<string, { displayName: string; email: string; avatarUrl: string }>();
    try {
      const usersRes = await admin.database.from('users').select('*');
      const users = usersRes.data || [];
      users.forEach((u: any) => {
        userMap.set(u.id, { 
          displayName: u.display_name || u.displayName || u.email?.split('@')[0] || 'User', 
          email: u.email || '',
          avatarUrl: u.avatar_url || u.avatarUrl || ''
        });
      });
    } catch (usersErr: any) {
      console.warn('Users lookup non-blocking notice:', usersErr.message);
    }

    // Attempt auth users lookup with 3s timeout
    try {
      const baseUrl = process.env.INSFORGE_BASE_URL || process.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app';
      const apiKey = process.env.INSFORGE_API_KEY || '';
      if (apiKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const authRes = await fetch(`${baseUrl}/api/auth/users`, {
          headers: { 'x-api-key': apiKey, 'apikey': apiKey },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (authRes.ok) {
          const raw = await authRes.json();
          const authUsers = Array.isArray(raw) ? raw : (raw?.data || []);
          authUsers.forEach((au: any) => {
            const existing = userMap.get(au.id);
            const name = au.profile?.name || au.user_metadata?.display_name || au.displayName || au.name || au.email?.split('@')[0] || 'User';
            const avatar = au.profile?.avatar_url || au.user_metadata?.avatar_url || au.avatar_url || '';
            if (!existing) {
              userMap.set(au.id, { displayName: name, email: au.email || '', avatarUrl: avatar });
            } else {
              if (!existing.displayName || existing.displayName === 'User') existing.displayName = name;
              if (!existing.avatarUrl && avatar) existing.avatarUrl = avatar;
            }
          });
        }
      }
    } catch (e) {
      // Non-blocking fallback
    }

    const enriched = (feedbacks || []).map((f: any) => {
      const u = f.user_id ? userMap.get(f.user_id) : null;
      const userName = f.user_name || u?.displayName || (f.user_email ? f.user_email.split('@')[0] : 'SportsHub Fan');
      const userEmail = f.user_email || u?.email || '';
      const userAvatar = f.user_avatar || u?.avatarUrl || '';
      return {
        ...f,
        user_name: userName,
        user_email: userEmail,
        user_avatar: userAvatar
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error('Feedback route error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch feedback' });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { user_id, user_name, user_email, user_avatar, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const admin = getInsforgeAdmin();
    
    // Attempt rich insert first
    const { data, error } = await admin.database.from('feedback').insert([{
      user_id: user_id || null,
      user_name: user_name || 'Fan',
      user_email: user_email || '',
      user_avatar: user_avatar || '',
      message: message.trim(),
      status: 'open'
    }]).select();

    if (error) {
      // Base schema fallback
      const fallback = await admin.database.from('feedback').insert([{
        user_id: user_id || null,
        message: message.trim(),
        status: 'open'
      }]).select();
      if (fallback.error) throw fallback.error;
      return res.json({ success: true, data: fallback.data });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/feedback/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const newStatus = req.body?.status || 'resolved';
    const admin = getInsforgeAdmin();
    const { error } = await admin.database.from('feedback').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, status: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. QUIZ QUESTIONS CRUD & BULK & SEED
// -------------------------------------------------------------
router.get('/quiz', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const category = req.query.category as string | undefined;

    // Fetch all chunks of questions to bypass PostgREST's 1000-row limit
    let allQuestions: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = admin.database
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query.range(from, from + pageSize - 1);
      if (error) throw error;

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allQuestions.push(...data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      }
    }

    // Normalize correctanswer to correctAnswer
    const normalized = allQuestions.map((q: any) => ({
      ...q,
      correctAnswer: q.correctanswer || q.correctAnswer || q.correct_answer
    }));

    res.setHeader('X-Total-Count', allQuestions.length.toString());
    res.json(normalized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quiz/question', async (req, res) => {
  try {
    const { question, category, difficulty, options, correctAnswer, explanation, hint, image, source } = req.body;
    if (!question || !correctAnswer || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question, options, and correctAnswer are required.' });
    }
    const admin = getInsforgeAdmin();
    const newId = 'q_' + Date.now() + Math.random().toString(36).substring(2, 9);
    const payload = {
      id: newId,
      question,
      category: category || 'World Football',
      difficulty: difficulty || 'Medium',
      options,
      correctanswer: correctAnswer,
      explanation: explanation || '',
      hint: hint || null,
      image: image || null,
      source: source || null,
      status: 'PUBLISHED',
      created_at: Date.now()
    };

    const { data, error } = await admin.database.from('quiz_questions').insert([payload]).select('*');
    if (error) throw error;
    const saved = data?.[0] || payload;
    res.json({ ...saved, correctAnswer: saved.correctanswer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/quiz/question/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, category, difficulty, options, correctAnswer, explanation, hint, image, source, status } = req.body;
    const admin = getInsforgeAdmin();
    const updates: any = {};
    if (question !== undefined) updates.question = question;
    if (category !== undefined) updates.category = category;
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (options !== undefined) updates.options = options;
    if (correctAnswer !== undefined) updates.correctanswer = correctAnswer;
    if (explanation !== undefined) updates.explanation = explanation;
    if (hint !== undefined) updates.hint = hint;
    if (image !== undefined) updates.image = image;
    if (source !== undefined) updates.source = source;
    if (status !== undefined) updates.status = status.toUpperCase();

    const { error } = await admin.database.from('quiz_questions').update(updates).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/quiz/question/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    const { error } = await admin.database.from('quiz_questions').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quiz/bulk', async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'An array of questions is required.' });
    }
    const admin = getInsforgeAdmin();
    const now = Date.now();
    const payloads = questions.map((q: any, i: number) => ({
      id: 'q_' + (now + i) + '_' + Math.random().toString(36).substring(2, 7),
      question: q.question,
      category: q.category || 'World Football',
      difficulty: q.difficulty || 'Medium',
      options: q.options,
      correctanswer: q.correctAnswer || q.correct_answer || q.correctanswer,
      explanation: q.explanation || '',
      hint: q.hint || null,
      image: q.image || null,
      source: q.source || null,
      status: 'PUBLISHED',
      created_at: now + i
    }));

    const { data, error } = await admin.database.from('quiz_questions').insert(payloads).select('*');
    if (error) throw error;
    res.json({ success: true, count: payloads.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quiz/seed', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const { data: existing } = await admin.database.from('quiz_questions').select('id').limit(1);
    if (existing && existing.length > 0 && !req.query.force) {
      return res.json({ message: 'Quiz questions already exist in database.', count: existing.length });
    }

    const STARTER_QUESTIONS = [
      {
        question: "Which country won the 2022 FIFA World Cup in Qatar?",
        category: "World Football",
        difficulty: "Easy",
        options: ["France", "Argentina", "Brazil", "Croatia"],
        correctAnswer: "Argentina",
        explanation: "Argentina defeated France in an epic penalty shootout following a 3-3 draw."
      },
      {
        question: "Who holds the record for the most Premier League goals in a single 38-game season?",
        category: "Premier League",
        difficulty: "Easy",
        options: ["Mohamed Salah", "Erling Haaland", "Alan Shearer", "Cristiano Ronaldo"],
        correctAnswer: "Erling Haaland",
        explanation: "Erling Haaland scored 36 Premier League goals for Manchester City in the 2022-23 season."
      },
      {
        question: "Which club has won the most UEFA Champions League titles in history?",
        category: "UEFA Champions League",
        difficulty: "Easy",
        options: ["AC Milan", "Bayern Munich", "Liverpool", "Real Madrid"],
        correctAnswer: "Real Madrid",
        explanation: "Real Madrid has won a record 15 European Cup / UEFA Champions League trophies."
      },
      {
        question: "Which nation won the UEFA Euro 2024 tournament held in Germany?",
        category: "World Football",
        difficulty: "Medium",
        options: ["England", "Spain", "France", "Netherlands"],
        correctAnswer: "Spain",
        explanation: "Spain won Euro 2024 after defeating England 2-1 in Berlin."
      },
      {
        question: "Who won the men's Ballon d'Or in 2024?",
        category: "World Football",
        difficulty: "Medium",
        options: ["Vinicius Junior", "Rodri", "Jude Bellingham", "Kylian Mbappé"],
        correctAnswer: "Rodri",
        explanation: "Manchester City and Spain midfielder Rodri won the 2024 Ballon d'Or."
      },
      {
        question: "Which Italian club is nicknamed 'The Old Lady' (La Vecchia Signora)?",
        category: "Serie A",
        difficulty: "Easy",
        options: ["Inter Milan", "AS Roma", "Juventus", "Napoli"],
        correctAnswer: "Juventus",
        explanation: "Juventus FC, founded in 1897 in Turin, is famously nicknamed La Vecchia Signora."
      },
      {
        question: "In what year did Arsenal complete their famous unbeaten Premier League 'Invincibles' season?",
        category: "Premier League",
        difficulty: "Medium",
        options: ["2001-02", "2003-04", "2005-06", "1998-99"],
        correctAnswer: "2003-04",
        explanation: "Arsène Wenger's Arsenal went all 38 matches undefeated in the 2003-04 season."
      },
      {
        question: "Which African player was the first to win the FIFA World Player of the Year award?",
        category: "World Football",
        difficulty: "Hard",
        options: ["Samuel Eto'o", "Didier Drogba", "George Weah", "Roger Milla"],
        correctAnswer: "George Weah",
        explanation: "Liberia's George Weah won both the Ballon d'Or and FIFA World Player of the Year in 1995."
      },
      {
        question: "Who is the all-time top goalscorer in the history of the UEFA Champions League?",
        category: "UEFA Champions League",
        difficulty: "Medium",
        options: ["Lionel Messi", "Cristiano Ronaldo", "Robert Lewandowski", "Karim Benzema"],
        correctAnswer: "Cristiano Ronaldo",
        explanation: "Cristiano Ronaldo is the all-time top scorer with 140 UEFA Champions League goals."
      },
      {
        question: "Which team won the 2023-24 Spanish La Liga title?",
        category: "La Liga",
        difficulty: "Easy",
        options: ["Barcelona", "Atletico Madrid", "Real Madrid", "Girona"],
        correctAnswer: "Real Madrid",
        explanation: "Real Madrid secured their 36th La Liga title in May 2024."
      }
    ];

    const now = Date.now();
    const payloads = STARTER_QUESTIONS.map((q, i) => ({
      id: 'q_seed_' + (now + i) + '_' + Math.random().toString(36).substring(2, 6),
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      options: q.options,
      correctanswer: q.correctAnswer,
      explanation: q.explanation,
      status: 'PUBLISHED',
      created_at: now + i
    }));

    const { error } = await admin.database.from('quiz_questions').insert(payloads);
    if (error) throw error;
    res.json({ success: true, seeded: payloads.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-sync endpoint triggered on news page load or 1-click sync
router.all('/news/auto-sync', async (req, res) => {
  try {
    const force = req.query.force === 'true' || req.body?.force === true;
    const result = await autoIngestFootballNews({ force, maxItems: 12 });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/articles', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(400);

    if (error) throw error;

    const rows = data || [];
    const MAX_DISPLAY_AGE_MS = 14 * 24 * 60 * 60 * 1000;
    const seenHeadlines = new Set<string>();
    let foundStaleOrDeprecated = false;

    const normalized: any[] = [];
    for (const a of rows) {
      const author = String(a.author_name || a.authorName || '');
      const pubTime = Number(a.published_at || a.publishedAt || 0);
      const normTitle = normalizeNewsHeadline(a.title || '');

      if (DEPRECATED_STALE_SOURCES.includes(author)) {
        foundStaleOrDeprecated = true;
        continue;
      }

      if (a.status === 'published' && !isFreshNewsTimestamp(pubTime, MAX_DISPLAY_AGE_MS)) {
        foundStaleOrDeprecated = true;
        continue;
      }

      if (normTitle && seenHeadlines.has(normTitle)) {
        continue;
      }
      if (normTitle) {
        seenHeadlines.add(normTitle);
      }

      const cleanTitle = cleanPlainEnglishText(a.title || '', false);
      const cleanContent = cleanPlainEnglishText(a.content || '', true);
      const rawSummary = a.summary ? cleanPlainEnglishText(a.summary, false) : '';
      const cleanSummary =
        rawSummary && rawSummary.length >= 20
          ? rawSummary
          : cleanContent
          ? (cleanContent.length > 180 ? cleanContent.slice(0, 177).trimEnd() + '...' : cleanContent)
          : '';

      normalized.push({
        id: a.id,
        title: cleanTitle,
        content: cleanContent,
        summary: cleanSummary,
        imageUrl: a.image_url || a.imageUrl,
        authorId: a.author_id,
        authorName: author || 'Jirvinho Brazilian sports maestro',
        status: a.status,
        category: a.category || 'general',
        publishedAt: pubTime || Date.now()
      });
    }

    const latestPub = normalized.length > 0 ? Number(normalized[0].publishedAt || 0) : 0;
    const isOld = Date.now() - latestPub > 60 * 60 * 1000;
    if (foundStaleOrDeprecated || normalized.length < 10 || isOld) {
      autoIngestFootballNews({ maxItems: 20 }).catch((e) => console.warn('[AutoNews] Background check:', e));
    }

    res.json(normalized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const a = data;
    const cleanTitle = cleanPlainEnglishText(a.title || '', false);
    const cleanContent = cleanPlainEnglishText(a.content || '', true);
    const rawSummary = a.summary ? cleanPlainEnglishText(a.summary, false) : '';
    const cleanSummary =
      rawSummary && rawSummary.length >= 20
        ? rawSummary
        : cleanContent
        ? (cleanContent.length > 180 ? cleanContent.slice(0, 177).trimEnd() + '...' : cleanContent)
        : '';

    res.json({
      id: a.id,
      title: cleanTitle,
      content: cleanContent,
      summary: cleanSummary,
      imageUrl: a.image_url || a.imageUrl,
      authorId: a.author_id,
      authorName: a.author_name || 'Jirvinho Brazilian sports maestro',
      status: a.status,
      category: a.category || 'general',
      publishedAt: Number(a.published_at || Date.now())
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/articles/:id/full', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const fullContent = cleanPlainEnglishText(await resolveAndEnrichArticleContent(data), true);
    const cleanTitle = cleanPlainEnglishText(data.title || '', false);
    const rawSummary = data.summary ? cleanPlainEnglishText(data.summary, false) : '';
    const cleanSummary =
      rawSummary && rawSummary.length >= 20
        ? rawSummary
        : fullContent
        ? (fullContent.length > 180 ? fullContent.slice(0, 177).trimEnd() + '...' : fullContent)
        : '';

    res.json({
      id: data.id,
      title: cleanTitle,
      content: fullContent,
      summary: cleanSummary,
      imageUrl: data.image_url || data.imageUrl,
      authorId: data.author_id,
      authorName: data.author_name || 'Jirvinho Brazilian sports maestro',
      status: data.status,
      category: data.category || 'general',
      publishedAt: Number(data.published_at || Date.now()),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/articles', async (req, res) => {
  try {
    const { title, content, summary, category, imageUrl, image_url, authorId, author_id, authorName, author_name, status, publishedAt, published_at } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Headline is required' });
    }
    const finalContent = (content || summary || '').trim();
    if (!finalContent) {
      return res.status(400).json({ error: 'Article content or summary is required' });
    }
    const admin = getInsforgeAdmin();
    
    // Resolve author
    let validAuthorId = authorId || author_id;
    if (validAuthorId) {
      const { data: author } = await admin.database.from('users').select('id').eq('id', validAuthorId).single();
      if (!author) validAuthorId = null;
    }
    if (!validAuthorId) {
      const { data: anyAdmin } = await admin.database.from('users').select('id').eq('role', 'admin').limit(1);
      validAuthorId = anyAdmin?.[0]?.id || SPECIAL_ADMIN_ID;
    }

    const finalImageUrl = imageUrl || image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2';
    const finalSummary = summary || (finalContent ? finalContent.slice(0, 180) + '...' : '');
    const finalPublishedAt = Number(publishedAt || published_at || Date.now());

    const newArticle = {
      title: title.trim(),
      content: finalContent,
      summary: finalSummary,
      image_url: finalImageUrl,
      author_id: validAuthorId,
      author_name: authorName || author_name || 'Jirvinho Brazilian sports maestro',
      status: status || 'published',
      category: category || 'General',
      published_at: finalPublishedAt
    };

    const { data, error } = await admin.database.from('articles').insert([newArticle]).select('*');
    if (error) {
      console.error('Error inserting article in InsForge:', error);
      return res.status(500).json({ error: error.message || 'Failed to save article to database' });
    }

    const created = data?.[0] ? {
      id: data[0].id,
      title: data[0].title,
      content: data[0].content,
      summary: data[0].summary,
      imageUrl: data[0].image_url,
      authorId: data[0].author_id,
      authorName: data[0].author_name,
      status: data[0].status,
      category: data[0].category,
      publishedAt: Number(data[0].published_at)
    } : { ...newArticle, id: 'art_' + Date.now() };

    if (created.status === 'published') {
      void broadcastPushNotification({
        title: 'Breaking Football News',
        body: created.title,
        url: `/news/${created.id}`,
        tag: `news_${created.id}`,
      });
    }

    res.json(created);
  } catch (err: any) {
    console.error('Error in POST /api/admin/articles:', err);
    res.status(500).json({ error: err.message || 'Failed to create article' });
  }
});

router.put('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, category, imageUrl, image_url, authorName, author_name, status, publishedAt, published_at } = req.body;
    const admin = getInsforgeAdmin();
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (summary !== undefined) updates.summary = summary;
    if (imageUrl !== undefined || image_url !== undefined) {
      updates.image_url = imageUrl !== undefined ? imageUrl : image_url;
    }
    if (authorName !== undefined || author_name !== undefined) {
      updates.author_name = authorName !== undefined ? authorName : author_name;
    }
    if (status !== undefined) updates.status = status;
    if (category !== undefined) updates.category = category;
    if (publishedAt !== undefined || published_at !== undefined) {
      updates.published_at = Number(publishedAt !== undefined ? publishedAt : published_at);
    }

    const { data: updatedRows, error } = await admin.database
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select('id, title, status');
    if (error) {
      console.error('Error updating article in InsForge:', error);
      return res.status(500).json({ error: error.message || 'Failed to update article' });
    }
    const updatedRow = updatedRows?.[0];
    if (status === 'published') {
      const headline = updatedRow?.title || title || 'New Football Story';
      void broadcastPushNotification({
        title: 'Breaking Football News',
        body: String(headline),
        url: `/news/${id}`,
        tag: `news_${id}`,
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error in PUT /api/admin/articles:', err);
    res.status(500).json({ error: err.message || 'Failed to update article' });
  }
});

router.delete('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    // Delete bookmarks referencing this article first to avoid foreign key errors
    try {
      await admin.database.from('bookmarks').delete().eq('article_id', id);
    } catch (bkErr) {
      console.warn('Bookmarks cleanup notice:', bkErr);
    }
    const { error } = await admin.database.from('articles').delete().eq('id', id);
    if (error) {
      console.error('Error deleting article in InsForge:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete article' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/admin/articles:', err);
    res.status(500).json({ error: err.message || 'Failed to delete article' });
  }
});

// -------------------------------------------------------------
// 9. ACTIVITY LOGS & APP USAGE MONITORING
// -------------------------------------------------------------
router.get('/activity-logs', async (req, res) => {
  try {
    const { category, search, action, limit, offset, sync } = req.query;
    const result = await getActivityLogs({
      category: category as string,
      search: search as string,
      action: action as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
      forceSync: sync === 'true'
    });
    const stats = await getActivityStats();
    res.json({ ...result, stats });
  } catch (err: any) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/activity-stats', async (req, res) => {
  try {
    const stats = await getActivityStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/activity-logs', async (req, res) => {
  try {
    const { userId, userEmail, userName, action, category, description, details } = req.body;
    if (!action || !description) {
      return res.status(400).json({ error: 'Action and description are required' });
    }
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    const log = await recordActivity({
      userId: userId || 'anonymous',
      userEmail: userEmail || 'visitor@maestroarena.com',
      userName: userName || userEmail?.split('@')[0] || 'App User',
      action,
      category: category || 'engagement',
      description,
      details,
      ip,
      userAgent
    });

    res.json({ success: true, log });
  } catch (err: any) {
    console.error('Error recording activity log:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/activity-logs', async (req, res) => {
  try {
    const { scope, ids } = req.body || {};
    
    // If specific log IDs are provided, delete them
    if (Array.isArray(ids) && ids.length > 0) {
      const result = await deleteActivityLogsByIds(ids);
      return res.json(result);
    }

    // Otherwise clear by scope ('all' | 'older_24h' | 'older_7d' | 'keep_50')
    const clearScope = (scope || req.query.scope || 'all') as 'all' | 'older_24h' | 'older_7d' | 'keep_50';
    const result = await clearActivityLogs({ scope: clearScope });
    res.json(result);
  } catch (err: any) {
    console.error('Error in DELETE /activity-logs:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/activity-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Log ID is required' });
    const result = await deleteActivityLogsByIds([id]);
    res.json(result);
  } catch (err: any) {
    console.error('Error in DELETE /activity-logs/:id:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/activity-logs/export', async (req, res) => {
  try {
    const { category, search, action } = req.query;
    const { logs } = await getActivityLogs({
      category: category as string,
      search: search as string,
      action: action as string,
      limit: 5000,
      offset: 0
    });

    // Generate CSV
    const headers = ['Timestamp', 'Date & Time', 'User Name', 'User Email', 'Category', 'Action', 'Description', 'IP Address', 'User Agent'];
    const rows = logs.map(l => [
      l.timestamp,
      new Date(l.timestamp).toISOString(),
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      `"${(l.userEmail || '').replace(/"/g, '""')}"`,
      l.category,
      l.action,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.ip || '',
      `"${(l.userAgent || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="maestro_activity_logs_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
