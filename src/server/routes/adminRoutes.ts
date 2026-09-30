import { Router } from 'express';
import { getInsforgeAdmin } from '../insforgeAdmin.js';

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
    res.json(data?.[0] || { success: true });
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
    const admin = getInsforgeAdmin();
    const [fbRes, usersRes] = await Promise.all([
      admin.database.from('feedback').select('*').order('created_at', { ascending: false }),
      admin.database.from('users').select('*')
    ]);

    if (fbRes.error) throw fbRes.error;
    const feedbacks = fbRes.data || [];
    const users = usersRes.data || [];
    const userMap = new Map<string, { displayName: string; email: string; avatarUrl: string }>();

    users.forEach((u: any) => {
      userMap.set(u.id, { 
        displayName: u.display_name || u.displayName || u.email?.split('@')[0] || 'User', 
        email: u.email || '',
        avatarUrl: u.avatar_url || u.avatarUrl || ''
      });
    });

    // Also attempt to get auth users for any missing user details
    try {
      const baseUrl = process.env.INSFORGE_BASE_URL || 'https://gci83gu5.us-east.insforge.app';
      const apiKey = process.env.INSFORGE_API_KEY || '';
      const authRes = await fetch(`${baseUrl}/api/auth/users`, {
        headers: { 'x-api-key': apiKey, 'apikey': apiKey }
      });
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
    } catch (e) {
      // Non-blocking fallback
    }

    const enriched = feedbacks.map((f: any) => {
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
    res.status(500).json({ error: err.message });
  }
});

router.put('/feedback/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const admin = getInsforgeAdmin();
    const { error } = await admin.database.from('feedback').update({ status: 'resolved' }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, status: 'resolved' });
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

// -------------------------------------------------------------
// 8. ARTICLES (NEWS) MANAGEMENT
// -------------------------------------------------------------
router.get('/articles', async (req, res) => {
  try {
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) throw error;

    const normalized = (data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      summary: a.summary || (a.content ? a.content.slice(0, 180) + '...' : ''),
      imageUrl: a.image_url || a.imageUrl,
      authorId: a.author_id,
      authorName: a.author_name || 'Maestro Editor',
      status: a.status,
      category: a.category || 'general',
      publishedAt: Number(a.published_at || Date.now())
    }));
    res.json(normalized);
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
      author_name: authorName || author_name || 'Maestro Editor',
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

    const { error } = await admin.database.from('articles').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating article in InsForge:', error);
      return res.status(500).json({ error: error.message || 'Failed to update article' });
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

export default router;
