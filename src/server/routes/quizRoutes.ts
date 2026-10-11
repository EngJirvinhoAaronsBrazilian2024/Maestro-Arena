import { Router } from 'express';
import { getInsforgeAdmin } from '../insforgeAdmin.js';
import { generateQuizQuestions } from '../services/aiQuizService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { 
      category, 
      competition, 
      season, 
      difficulty, 
      count, 
      type, 
      dataSource, 
      language,
      adminId
    } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized: adminId required' });
    }

    const result = await generateQuizQuestions(
      category,
      competition,
      season,
      difficulty,
      Number(count) || 5,
      type,
      dataSource,
      language || 'English',
      adminId
    );

    res.json(result);
  } catch (error: any) {
    console.error('Quiz Generation Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Review Endpoints
router.get('/leaderboard', async (req, res) => {
  try {
    const mode = (req.query.mode as string) || 'solo';
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));

    const db = getInsforgeAdmin().database;
    const [{ data: results }, { data: usersData }, { data: statsData }] = await Promise.all([
      db.from('quiz_results').select('*').order('score', { ascending: false }),
      db.from('users').select('id, display_name, email'),
      db.from('quiz_stats').select('*').order('total_score', { ascending: false })
    ]);

    const userMap = new Map<string, string>();
    (usersData || []).forEach((u: any) => {
      if (u.id) {
        userMap.set(u.id, u.display_name || u.email?.split('@')[0] || 'Player');
      }
    });

    const isTest = (uid?: string, email?: string) => {
      if (!uid) return true;
      if (uid.startsWith('test_user_') || uid.startsWith('testuser_')) return true;
      if (email && email.includes('testuser_')) return true;
      return false;
    };

    const validResults = (results || []).filter((r: any) => !isTest(r.user_id));

    if (mode === 'h2h') {
      // Rivalry tab: cumulative total points across all quiz play
      const userTotals = new Map<string, any>();
      validResults.forEach((r: any) => {
        const username = userMap.get(r.user_id) || r.username || 'Player';
        const score = Number(r.score) || 0;
        const existing = userTotals.get(r.user_id) || {
          userId: r.user_id,
          username,
          score: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          timeTaken: 45,
          category: r.category || 'All Themes',
          difficulty: r.difficulty || 'Expert',
          date: r.completed_at || Date.now()
        };
        existing.score += score;
        existing.totalQuestions += Number(r.total) || 10;
        existing.correctAnswers += Math.round(score / 10);
        userTotals.set(r.user_id, existing);
      });

      (statsData || []).forEach((s: any) => {
        if (!s.user_id || isTest(s.user_id)) return;
        const username = userMap.get(s.user_id) || 'Player';
        const statScore = Number(s.total_score) || 0;
        const statCorrect = Number(s.correct_answers) || Math.round(statScore / 10);
        if (userTotals.has(s.user_id)) {
          const item = userTotals.get(s.user_id)!;
          item.score = Math.max(item.score, statScore);
          item.correctAnswers = Math.max(item.correctAnswers, statCorrect);
        } else {
          userTotals.set(s.user_id, {
            userId: s.user_id,
            username,
            score: statScore,
            totalQuestions: (Number(s.quizzes_taken) || 1) * 10,
            correctAnswers: statCorrect,
            incorrectAnswers: Math.max(0, ((Number(s.quizzes_taken) || 1) * 10) - statCorrect),
            timeTaken: 45,
            category: 'All Themes',
            difficulty: 'Expert',
            date: s.last_played_at || Date.now()
          });
        }
      });

      const list = Array.from(userTotals.values()).filter((u: any) => (Number(u.score) || 0) > 0);
      list.sort((a: any, b: any) => {
        const diff = (Number(b.score) || 0) - (Number(a.score) || 0);
        if (diff !== 0) return diff;
        return (Number(b.correctAnswers) || 0) - (Number(a.correctAnswers) || 0);
      });

      return res.json({ success: true, mode, leaders: list.slice(0, limit), timestamp: Date.now() });
    } else {
      // Solo tab: best single match score
      const userBest = new Map<string, any>();
      validResults.forEach((r: any) => {
        const username = userMap.get(r.user_id) || r.username || 'Player';
        const score = Number(r.score) || 0;
        if (!userBest.has(r.user_id) || score > userBest.get(r.user_id)!.score) {
          userBest.set(r.user_id, {
            userId: r.user_id,
            username,
            score,
            totalQuestions: Number(r.total) || 10,
            correctAnswers: Math.round(score / 10),
            incorrectAnswers: Math.max(0, (Number(r.total) || 10) - Math.round(score / 10)),
            timeTaken: r.time_taken || 40,
            category: r.category || 'Premier League',
            difficulty: r.difficulty || 'Medium',
            date: r.completed_at || Date.now()
          });
        }
      });

      (statsData || []).forEach((s: any) => {
        if (!s.user_id || isTest(s.user_id)) return;
        const username = userMap.get(s.user_id) || 'Player';
        const statScore = Number(s.total_score) || 0;
        if (!userBest.has(s.user_id)) {
          userBest.set(s.user_id, {
            userId: s.user_id,
            username,
            score: statScore,
            totalQuestions: 10,
            correctAnswers: Math.min(10, Math.round(statScore / 10)),
            incorrectAnswers: 0,
            timeTaken: 40,
            category: 'All Themes',
            difficulty: 'Medium',
            date: s.last_played_at || Date.now()
          });
        }
      });

      const list = Array.from(userBest.values()).filter((u: any) => (Number(u.score) || 0) > 0);
      list.sort((a: any, b: any) => {
        const diff = (Number(b.score) || 0) - (Number(a.score) || 0);
        if (diff !== 0) return diff;
        return (Number(b.correctAnswers) || 0) - (Number(a.correctAnswers) || 0);
      });

      return res.json({ success: true, mode, leaders: list.slice(0, limit), timestamp: Date.now() });
    }
  } catch (error: any) {
    console.error('Quiz Leaderboard Route Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Review Endpoints
router.post('/:id/published', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getInsforgeAdmin().database.from('quiz_questions').update({
      status: 'PUBLISHED',
      updated_at: Date.now()
    }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, status: 'PUBLISHED' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/rejected', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getInsforgeAdmin().database.from('quiz_questions').update({
      status: 'REJECTED',
      updated_at: Date.now()
    }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, status: 'REJECTED' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updated_at = Date.now();
    const { error } = await getInsforgeAdmin().database.from('quiz_questions').update(updateData).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getInsforgeAdmin().database.from('quiz_questions').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
