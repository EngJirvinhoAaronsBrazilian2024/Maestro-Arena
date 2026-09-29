import { QuizQuestion, QuizCategory, QuizDifficulty, QuizResult, QuizUserStats } from '../types/quiz';
import { insforge } from '../lib/insforge';
import { MOCK_QUESTIONS } from './mockQuestions';

// In-memory set to track recently played questions in the current session so players don't get repetitive questions
const sessionPlayedQuestionKeys = new Set<string>();

const normalizeQKey = (text: string) => (text || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export function clearQuizSessionHistory(): void {
  sessionPlayedQuestionKeys.clear();
  try {
    sessionStorage.removeItem('sportshub_played_quiz_keys');
  } catch (e) {}
}

function loadSessionPlayedKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem('sportshub_played_quiz_keys');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach(k => sessionPlayedQuestionKeys.add(k));
      }
    }
  } catch (e) {}
  return sessionPlayedQuestionKeys;
}

function markQuestionsPlayedInSession(questions: QuizQuestion[]): void {
  for (const q of questions) {
    sessionPlayedQuestionKeys.add(normalizeQKey(q.question));
  }
  try {
    sessionStorage.setItem('sportshub_played_quiz_keys', JSON.stringify(Array.from(sessionPlayedQuestionKeys)));
  } catch (e) {}
}

export async function getQuizQuestions(
  category: QuizCategory | 'All',
  difficulty: QuizDifficulty,
  limitCount: number = 10
): Promise<QuizQuestion[]> {
  loadSessionPlayedKeys();

  try {
    // 1. Fetch from InsForge database (primary source of truth)
    let dbExactQuestions: QuizQuestion[] = [];
    let dbSameCategoryQuestions: QuizQuestion[] = [];
    let dbGeneralQuestions: QuizQuestion[] = [];

    try {
      let query = insforge.database
        .from('quiz_questions')
        .select('*')
        .eq('status', 'PUBLISHED');

      if (category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (!error && data) {
        const mapped = data.map((doc: any) => ({
          id: doc.id,
          ...doc,
          correctAnswer: doc.correctanswer || doc.correctAnswer || doc.correct_answer
        } as QuizQuestion));

        mapped.forEach((q: QuizQuestion) => {
          if (q.difficulty === difficulty) {
            dbExactQuestions.push(q);
          } else {
            dbSameCategoryQuestions.push(q);
          }
        });
      }

      // If we need more questions, also fetch general DB questions
      if (dbExactQuestions.length + dbSameCategoryQuestions.length < limitCount) {
        const { data: generalData } = await insforge.database
          .from('quiz_questions')
          .select('*')
          .eq('status', 'PUBLISHED')
          .limit(50);
        if (generalData) {
          dbGeneralQuestions = generalData.map((doc: any) => ({
            id: doc.id,
            ...doc,
            correctAnswer: doc.correctanswer || doc.correctAnswer || doc.correct_answer
          } as QuizQuestion));
        }
      }
    } catch (dbErr) {
      console.warn('InsForge database query warning:', dbErr);
    }

    // 2. Filter Mock Questions by Category & Difficulty
    const mockExact = MOCK_QUESTIONS.filter(q => {
      const catMatch = category === 'All' || q.category === category;
      const diffMatch = q.difficulty === difficulty;
      return catMatch && diffMatch;
    });

    // 3. Assemble pool with strict deduplication
    const seenTexts = new Set<string>();
    const seenIds = new Set<string>();
    const uniqueCandidates: QuizQuestion[] = [];

    const addCandidate = (q: QuizQuestion) => {
      if (!q || !q.question || !q.correctAnswer || !q.options || q.options.length < 2) return;
      const key = normalizeQKey(q.question);
      if (!seenTexts.has(key) && !seenIds.has(q.id)) {
        seenTexts.add(key);
        seenIds.add(q.id);
        uniqueCandidates.push(q);
      }
    };

    // Priority 1: Exact matches from InsForge DB
    dbExactQuestions.forEach(addCandidate);

    // Priority 2: Same category other difficulty from InsForge DB
    dbSameCategoryQuestions.forEach(addCandidate);

    // Priority 3: Exact matches from static fallbacks
    mockExact.forEach(addCandidate);

    // Priority 4: Other database questions from InsForge
    dbGeneralQuestions.forEach(addCandidate);

    // Priority 5: Fallback mock questions
    if (uniqueCandidates.length < limitCount) {
      const mockSameCatOtherDiff = MOCK_QUESTIONS.filter(q => {
        const catMatch = category === 'All' || q.category === category;
        return catMatch;
      });
      mockSameCatOtherDiff.forEach(addCandidate);
    }

    // 5. If STILL fewer than requested, pad from general pool across related categories
    if (uniqueCandidates.length < limitCount) {
      const mockOther = MOCK_QUESTIONS.filter(q => q.difficulty === difficulty);
      mockOther.forEach(addCandidate);
    }

    // 6. Final safety net: all available mock questions
    if (uniqueCandidates.length < limitCount) {
      MOCK_QUESTIONS.forEach(addCandidate);
    }

    // 7. Separate candidates into UNSEEN vs PREVIOUSLY SEEN in this session
    const unseenList: QuizQuestion[] = [];
    const seenList: QuizQuestion[] = [];

    for (const q of uniqueCandidates) {
      const key = normalizeQKey(q.question);
      if (sessionPlayedQuestionKeys.has(key)) {
        seenList.push(q);
      } else {
        unseenList.push(q);
      }
    }

    // Shuffle both subsets
    const shuffleArray = <T>(arr: T[]): T[] => [...arr].sort(() => 0.5 - Math.random());
    const shuffledUnseen = shuffleArray(unseenList);
    const shuffledSeen = shuffleArray(seenList);

    // Prioritize unseen questions; if needed, pull from seen questions to meet limitCount
    const prioritizedSelection = [...shuffledUnseen, ...shuffledSeen];

    // Guarantee absolute non-repetition in the current game:
    const gameSelectedQuestions: QuizQuestion[] = [];
    const inGameSeen = new Set<string>();

    for (const q of prioritizedSelection) {
      const key = normalizeQKey(q.question);
      if (!inGameSeen.has(key)) {
        inGameSeen.add(key);

        // Ensure options contain the correct answer and are shuffled
        const rawOptions = Array.from(new Set(q.options || []));
        if (!rawOptions.includes(q.correctAnswer)) {
          rawOptions.push(q.correctAnswer);
        }

        gameSelectedQuestions.push({
          ...q,
          options: shuffleArray(rawOptions)
        });
      }

      if (gameSelectedQuestions.length >= limitCount) {
        break;
      }
    }

    // Mark selected questions as played in this session
    markQuestionsPlayedInSession(gameSelectedQuestions);

    return gameSelectedQuestions;
  } catch (err) {
    console.error('Error fetching questions:', err);
    // Safe ultimate fallback: strictly unique slice from MOCK_QUESTIONS
    const seen = new Set<string>();
    const safeResult: QuizQuestion[] = [];
    const shuffled = [...MOCK_QUESTIONS].sort(() => 0.5 - Math.random());

    for (const q of shuffled) {
      const key = normalizeQKey(q.question);
      if (!seen.has(key)) {
        seen.add(key);
        safeResult.push({
          ...q,
          options: [...q.options].sort(() => 0.5 - Math.random())
        });
      }
      if (safeResult.length >= limitCount) break;
    }

    return safeResult;
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
