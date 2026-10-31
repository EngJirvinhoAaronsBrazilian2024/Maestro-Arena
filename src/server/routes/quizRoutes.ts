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

// Quiz Leaderboard Route - Cumulative points collected across all quizzes
router.get('/leaderboard', async (req, res) => {
  try {
    const mode = (req.query.mode as string) || 'solo';
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));

    const db = getInsforgeAdmin().database;
    const [{ data: results }, { data: usersData }, { data: statsData }] = await Promise.all([
      db.from('quiz_results').select('*').order('completed_at', { ascending: false }),
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

    // Aggregate and add every single point collected by each player across all games played
    const userTotals = new Map<string, any>();

    validResults.forEach((r: any) => {
      const username = userMap.get(r.user_id) || r.username || 'Player';
      const score = Number(r.score) || 0;
      const total = Number(r.total) || 10;
      const correct = Math.round(score / 10);

      const existing = userTotals.get(r.user_id) || {
        userId: r.user_id,
        username,
        score: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        quizzesTaken: 0,
        timeTaken: 45,
        category: r.category || 'All Themes',
        difficulty: r.difficulty || 'Expert',
        date: r.completed_at || Date.now()
      };

      // Add EVERY point collected to the cumulative score
      existing.score += score;
      existing.totalQuestions += total;
      existing.correctAnswers += correct;
      existing.incorrectAnswers += Math.max(0, total - correct);
      existing.quizzesTaken = (existing.quizzesTaken || 0) + 1;
      existing.date = Math.max(existing.date || 0, r.completed_at || 0);
      userTotals.set(r.user_id, existing);
    });

    // Merge cumulative totals recorded in quiz_stats table (if total_score is higher)
    (statsData || []).forEach((s: any) => {
      if (!s.user_id || isTest(s.user_id)) return;
      const username = userMap.get(s.user_id) || 'Player';
      const statScore = Number(s.total_score) || 0;
      const statCorrect = Number(s.correct_answers) || Math.round(statScore / 10);
      const statQuizzes = Number(s.quizzes_taken) || 1;

      if (userTotals.has(s.user_id)) {
        const item = userTotals.get(s.user_id)!;
        item.score = Math.max(item.score, statScore);
        item.correctAnswers = Math.max(item.correctAnswers, statCorrect);
        item.quizzesTaken = Math.max(item.quizzesTaken || 1, statQuizzes);
        item.totalQuestions = Math.max(item.totalQuestions, item.quizzesTaken * 10);
      } else if (statScore > 0) {
        userTotals.set(s.user_id, {
          userId: s.user_id,
          username,
          score: statScore,
          totalQuestions: statQuizzes * 10,
          correctAnswers: statCorrect,
          incorrectAnswers: Math.max(0, (statQuizzes * 10) - statCorrect),
          quizzesTaken: statQuizzes,
          timeTaken: 45,
          category: 'All Themes',
          difficulty: 'Expert',
          date: s.last_played_at || Date.now()
        });
      }
    });

    const list = Array.from(userTotals.values()).filter((u: any) => (Number(u.score) || 0) > 0);

    // Strictly sort by total cumulative points descending
    list.sort((a: any, b: any) => {
      const diff = (Number(b.score) || 0) - (Number(a.score) || 0);
      if (diff !== 0) return diff;
      return (Number(b.correctAnswers) || 0) - (Number(a.correctAnswers) || 0);
    });

    return res.json({ success: true, mode, leaders: list.slice(0, limit), timestamp: Date.now() });
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
