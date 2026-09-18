import { QuizQuestion, QuizCategory, QuizDifficulty, QuizResult, QuizUserStats } from '../types/quiz';
import { insforge } from '../lib/insforge';
import { MOCK_QUESTIONS } from './mockQuestions';

export async function getQuizQuestions(category: QuizCategory | 'All', difficulty: QuizDifficulty, limitCount: number = 10): Promise<QuizQuestion[]> {
  try {
    let exactSnapshot: any[] = [];
    if (category !== 'All') {
      const { data } = await insforge.database
        .from('quiz_questions')
        .select('*')
        .eq('status', 'PUBLISHED')
        .eq('category', category)
        .eq('difficulty', difficulty);
      exactSnapshot = data || [];
    } else {
      const { data } = await insforge.database
        .from('quiz_questions')
        .select('*')
        .eq('status', 'PUBLISHED')
        .eq('difficulty', difficulty);
      exactSnapshot = data || [];
    }
    
    let questions = exactSnapshot.map(doc => ({
      id: doc.id,
      ...doc,
      correctAnswer: doc.correctanswer || doc.correctAnswer || doc.correct_answer
    } as QuizQuestion));

    // 2. Add from MOCK_QUESTIONS (Exact Match)
    let mockExact = MOCK_QUESTIONS.filter(q => q.difficulty === difficulty && (category === 'All' || q.category === category));
    
    // Merge unique by question text to avoid duplication
    let merged = [...questions];
    const seen = new Set(merged.map(q => q.question));
    for (const mq of mockExact) {
      if (!seen.has(mq.question)) {
        merged.push(mq);
        seen.add(mq.question);
      }
    }

    // 3. Pad with ANY difficulty for the SAME category if we don't have enough
    if (merged.length < limitCount) {
      // From database
      let catSnapshot: any[] = [];
      if (category !== 'All') {
        const { data } = await insforge.database
          .from('quiz_questions')
          .select('*')
          .eq('status', 'PUBLISHED')
          .eq('category', category);
        catSnapshot = data || [];
      } else {
        const { data } = await insforge.database
          .from('quiz_questions')
          .select('*')
          .eq('status', 'PUBLISHED');
        catSnapshot = data || [];
      }
      const catQuestions = catSnapshot.map(doc => ({
        id: doc.id,
        ...doc,
        correctAnswer: doc.correctanswer || doc.correctAnswer || doc.correct_answer
      } as QuizQuestion));
      for (const q of catQuestions) {
        if (!seen.has(q.question)) {
          merged.push(q);
          seen.add(q.question);
        }
      }
      
      // From Mock
      const mockCat = category !== 'All' ? MOCK_QUESTIONS.filter(q => q.category === category) : MOCK_QUESTIONS;
      for (const mq of mockCat) {
        if (!seen.has(mq.question)) {
          merged.push(mq);
          seen.add(mq.question);
        }
      }
    }

    // Randomize questions
    const randomized = [...merged].sort(() => 0.5 - Math.random());
    
    // Process options to ensure they are shuffled
    return randomized.slice(0, Math.min(limitCount, randomized.length)).map(q => ({
      ...q,
      options: [...q.options].sort(() => 0.5 - Math.random())
    }));
  } catch (err) {
    console.error('Error fetching questions:', err);
    // Ultimate Fallback: Just grab mock questions of this difficulty
    const mockDiff = MOCK_QUESTIONS.filter(q => q.difficulty === difficulty);
    const randomized = [...mockDiff].sort(() => 0.5 - Math.random());
    return randomized.slice(0, Math.min(limitCount, randomized.length)).map(q => ({
      ...q,
      options: [...q.options].sort(() => 0.5 - Math.random())
    }));
  }
}

export async function saveQuizResult(result: QuizResult): Promise<void> {
  if (!result.userId) {
    // Handle local storage if not logged in
    const localResultsStr = localStorage.getItem('quizResults');
    const localResults = localResultsStr ? JSON.parse(localResultsStr) : [];
    localResults.push(result);
    localStorage.setItem('quizResults', JSON.stringify(localResults));
    
    // Update local stats
    updateLocalStats(result);
    return;
  }

  try {
    // Save Result
    await insforge.database
      .from('quiz_results')
      .insert([{
        user_id: result.userId,
        score: result.score,
        total: result.totalQuestions,
        category: result.category,
        difficulty: result.difficulty,
        completed_at: Date.now()
      }]);

    // Update user stats
    const { data: statsDoc } = await insforge.database
      .from('quiz_stats')
      .select('*')
      .eq('user_id', result.userId)
      .single();

    if (statsDoc) {
      await insforge.database
        .from('quiz_stats')
        .update({
          quizzes_taken: statsDoc.quizzes_taken + 1,
          total_score: statsDoc.total_score + result.score,
          correct_answers: statsDoc.correct_answers + result.correctAnswers,
          last_played_at: Date.now()
        })
        .eq('user_id', result.userId);
    } else {
      await insforge.database
        .from('quiz_stats')
        .insert([{
          user_id: result.userId,
          quizzes_taken: 1,
          total_score: result.score,
          correct_answers: result.correctAnswers,
          last_played_at: Date.now()
        }]);
    }
  } catch (err) {
    console.error('Error saving quiz result to DB:', err);
    // Fallback to local
    updateLocalStats(result);
  }
}

function updateLocalStats(result: QuizResult) {
  const localStatsStr = localStorage.getItem('quizStats');
  let stats = localStatsStr ? JSON.parse(localStatsStr) : {
    totalQuizzes: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    bestScore: 0,
    categoriesPlayed: []
  };

  stats.totalQuizzes += 1;
  stats.totalQuestions += result.totalQuestions;
  stats.correctAnswers += result.correctAnswers;
  stats.bestScore = Math.max(stats.bestScore, result.score);
  if (!stats.categoriesPlayed.includes(result.category)) {
    stats.categoriesPlayed.push(result.category);
  }

  localStorage.setItem('quizStats', JSON.stringify(stats));
}

export async function getUserQuizStats(userId?: string): Promise<QuizUserStats | null> {
  if (!userId) {
    const localStatsStr = localStorage.getItem('quizStats');
    return localStatsStr ? JSON.parse(localStatsStr) : null;
  }

  try {
    const { data: statsDoc } = await insforge.database
      .from('quiz_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (statsDoc) {
      return {
        userId: statsDoc.user_id,
        totalQuizzes: statsDoc.quizzes_taken,
        totalQuestions: statsDoc.total_score, // simplified mapping
        correctAnswers: statsDoc.correct_answers,
        bestScore: statsDoc.total_score,
        categoriesPlayed: []
      } as QuizUserStats;
    }
  } catch (err) {
    console.error("Error fetching user stats", err);
  }
  
  // Fallback local
  const localStatsStr = localStorage.getItem('quizStats');
  return localStatsStr ? JSON.parse(localStatsStr) : null;
}

export async function getLeaderboard(limitCount: number = 10): Promise<QuizResult[]> {
  try {
    const { data } = await insforge.database
      .from('quiz_results')
      .select('*, users(display_name)')
      .order('score', { ascending: false })
      .limit(limitCount);
      
    if (data) {
      return data.map((doc: any) => ({
        userId: doc.user_id,
        score: doc.score,
        totalQuestions: doc.total,
        correctAnswers: doc.score, // Simple mapping
        incorrectAnswers: doc.total - doc.score,
        timeTaken: 0,
        category: doc.category,
        difficulty: doc.difficulty,
        date: doc.completed_at || Date.now()
      } as QuizResult));
    }
    return [];
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    // Fallback local
    const localResultsStr = localStorage.getItem('quizResults');
    if (localResultsStr) {
      const results: QuizResult[] = JSON.parse(localResultsStr);
      return results.sort((a, b) => b.score - a.score).slice(0, limitCount);
    }
    return [];
  }
}

export async function getAllQuizQuestions(): Promise<QuizQuestion[]> {
  try {
    const res = await fetch('/api/admin/quiz');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback below
  }

  try {
    const { data, error } = await insforge.database.from('quiz_questions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(doc => ({
      id: doc.id,
      ...doc,
      correctAnswer: doc.correctanswer || doc.correctAnswer || doc.correct_answer
    } as QuizQuestion));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createQuizQuestion(adminId: string, question: Omit<QuizQuestion, 'id'>): Promise<QuizQuestion> {
  try {
    const res = await fetch('/api/admin/quiz/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // fallback below
  }

  const newId = 'q_' + Date.now() + Math.random().toString(36).substring(2, 9);
  const now = Date.now();
  const dbPayload: any = {
    id: newId,
    question: question.question,
    category: question.category,
    difficulty: question.difficulty,
    options: question.options,
    correctanswer: question.correctAnswer || (question as any).correctanswer,
    explanation: question.explanation || '',
    hint: question.hint || null,
    image: question.image || null,
    source: question.source || null,
    status: 'PUBLISHED',
    created_at: now
  };

  const { data, error } = await insforge.database.from('quiz_questions').insert([dbPayload]).select('*');
  if (error) throw error;
  return {
    ...data[0],
    correctAnswer: data[0].correctanswer || data[0].correctAnswer
  } as QuizQuestion;
}

export async function updateQuizQuestion(adminId: string, id: string, updates: Partial<QuizQuestion>): Promise<void> {
  try {
    const res = await fetch(`/api/admin/quiz/question/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) return;
  } catch (e) {
    // fallback below
  }

  const dbUpdates: any = { ...updates };
  if (updates.correctAnswer !== undefined) {
    dbUpdates.correctanswer = updates.correctAnswer;
    delete dbUpdates.correctAnswer;
  }
  if ((updates as any).status) {
    dbUpdates.status = (updates as any).status.toUpperCase();
  }

  const { error } = await insforge.database.from('quiz_questions').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function deleteQuizQuestion(adminId: string, id: string): Promise<void> {
  try {
    const res = await fetch(`/api/admin/quiz/question/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) return;
  } catch (e) {
    // fallback below
  }

  const { error } = await insforge.database.from('quiz_questions').delete().eq('id', id);
  if (error) throw error;
}
