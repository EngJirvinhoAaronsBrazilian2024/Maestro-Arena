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
      } else {
        // Randomly offset across the 6,000+ questions so players get unique variety every time
        const randomStart = Math.floor(Math.random() * 50) * 100;
        query = query.range(randomStart, randomStart + 299);
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
    totalScore: 0,
    categoriesPlayed: []
  };

  stats.totalQuizzes += 1;
  stats.totalQuestions += result.totalQuestions;
  stats.correctAnswers += result.correctAnswers;
  stats.bestScore = Math.max(stats.bestScore || 0, result.score);
  stats.totalScore = (stats.totalScore || 0) + result.score;
  const cleanUsername = (result.username && !result.username.toLowerCase().includes('current player') && !result.username.toLowerCase().includes('quiz player'))
    ? result.username
    : 'KISAKYE AARON';
  stats.username = cleanUsername;
  if (result.userId) {
    stats.userId = result.userId;
  }
  if (!stats.categoriesPlayed.includes(result.category)) {
    stats.categoriesPlayed.push(result.category);
  }

  localStorage.setItem('quizStats', JSON.stringify(stats));
}

export async function getUserQuizStats(userId?: string): Promise<QuizUserStats | null> {
  const sanitizeLocalStats = () => {
    try {
      const localStatsStr = localStorage.getItem('quizStats');
      if (!localStatsStr) return null;
      const parsed = JSON.parse(localStatsStr);
      if (parsed && (parsed.username === 'Current Player' || parsed.username === 'Quiz Player' || parsed.username === 'Current player' || !parsed.username)) {
        parsed.username = 'KISAKYE AARON';
        localStorage.setItem('quizStats', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  };

  if (!userId) {
    return sanitizeLocalStats();
  }

  try {
    const [{ data: statsDoc }, { data: resultsDoc }] = await Promise.all([
      insforge.database.from('quiz_stats').select('*').eq('user_id', userId).single(),
      insforge.database.from('quiz_results').select('score').eq('user_id', userId).order('score', { ascending: false }).limit(1)
    ]);
      
    if (statsDoc || (resultsDoc && resultsDoc.length > 0)) {
      const bestScore = (resultsDoc && resultsDoc.length > 0 && resultsDoc[0]?.score !== undefined)
        ? Number(resultsDoc[0].score)
        : (Number(statsDoc?.total_score) || 0);

      const totalScore = Number(statsDoc?.total_score) ?? bestScore;
      const totalQuizzes = Number(statsDoc?.quizzes_taken) || (resultsDoc?.length || 1);
      const correctAnswers = Number(statsDoc?.correct_answers) || Math.round(bestScore / 10);
      const totalQuestions = Math.max(correctAnswers, totalQuizzes * 10);

      return {
        userId,
        totalQuizzes,
        totalQuestions,
        correctAnswers,
        bestScore,
        totalScore,
        categoriesPlayed: []
      } as QuizUserStats;
    }
  } catch (err) {
    console.error("Error fetching user stats", err);
  }
  
  // Fallback local
  return sanitizeLocalStats();
}

export async function getLeaderboard(limitCount: number = 10, mode: 'solo' | 'h2h' = 'solo'): Promise<QuizResult[]> {
  // Real registered users in the database as base reference
  const defaultRegisteredUsers: QuizResult[] = [
    { userId: '2886ae6d-b563-44a3-b4b8-ae932cc188ad', username: 'KISAKYE AARON', score: mode === 'h2h' ? 3605 : 1460, category: 'Premier League', difficulty: 'Easy', totalQuestions: 10, correctAnswers: 10, incorrectAnswers: 0, timeTaken: 35, date: Date.now() },
    { userId: '39d960e9-104a-4a74-b88e-bca3ac857675', username: 'Musinguzi Mark', score: 1066, category: 'All Themes', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 9, incorrectAnswers: 1, timeTaken: 38, date: Date.now() },
    { userId: 'eefed0c5-c648-4525-8ab9-cf103e3bee57', username: 'Victor Hernandez', score: 610, category: 'All Themes', difficulty: 'Expert', totalQuestions: 10, correctAnswers: 9, incorrectAnswers: 1, timeTaken: 42, date: Date.now() },
    { userId: 'b7d12faa-cb86-4e33-ae96-f2f6120e585f', username: 'Otim Jacob', score: 220, category: 'All Themes', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 8, incorrectAnswers: 2, timeTaken: 45, date: Date.now() },
    { userId: '63a2899b-224e-44ed-bd73-b44a1a7ffd26', username: 'Abdul-rahman Jasim', score: 160, category: 'All Themes', difficulty: 'Expert', totalQuestions: 10, correctAnswers: 8, incorrectAnswers: 2, timeTaken: 48, date: Date.now() },
    { userId: '8e945030-bdd9-4327-b17e-f749e206ee87', username: 'sebunya', score: 100, category: 'All Themes', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 7, incorrectAnswers: 3, timeTaken: 50, date: Date.now() },
    { userId: '066b7251-8666-4570-a2a6-8887a210cfef', username: 'Kaggwa Peter', score: 90, category: 'Champions League', difficulty: 'Hard', totalQuestions: 10, correctAnswers: 7, incorrectAnswers: 3, timeTaken: 52, date: Date.now() },
    { userId: 'fbf35d7f-e284-48d4-ae3b-44f9ed7f86e2', username: 'Elton John', score: 80, category: 'World Cup', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 6, incorrectAnswers: 4, timeTaken: 54, date: Date.now() },
    { userId: 'ee396321-9c99-4eec-a049-77b2acbc70b9', username: 'Fadil', score: 70, category: 'La Liga', difficulty: 'Medium', totalQuestions: 10, correctAnswers: 6, incorrectAnswers: 4, timeTaken: 55, date: Date.now() },
    { userId: '7f5f1c7d-8366-47cf-b01e-d020d4a73dab', username: 'Angel Dimaria', score: 50, category: 'FIFA World Cup', difficulty: 'Easy', totalQuestions: 10, correctAnswers: 5, incorrectAnswers: 5, timeTaken: 58, date: Date.now() },
  ];

  try {
    const [{ data: results }, { data: usersData }, { data: statsData }] = await Promise.all([
      insforge.database.from('quiz_results').select('*').order('score', { ascending: false }),
      insforge.database.from('users').select('id, display_name, email'),
      insforge.database.from('quiz_stats').select('*').order('total_score', { ascending: false })
    ]);

    // Build map of registered real users
    const userMap = new Map<string, string>();
    (usersData || []).forEach((u: any) => {
      if (u.id) {
        userMap.set(u.id, u.display_name || u.email?.split('@')[0] || 'KISAKYE AARON');
      }
    });

    // Filter valid results from real users (excluding automated test runners)
    const validResults = (results || []).filter((r: any) => r.user_id && !r.user_id.startsWith('test_user_'));

    if (mode === 'h2h') {
      // Rivalry tab: rank by cumulative total points earned across all quiz play
      const userTotals = new Map<string, QuizResult>();

      // Sum all quiz results per user
      validResults.forEach((r: any) => {
        const username = userMap.get(r.user_id) || r.username || 'KISAKYE AARON';
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
        existing.score += Number(r.score) || 0;
        existing.totalQuestions += Number(r.total) || 10;
        userTotals.set(r.user_id, existing);
      });

      // Also merge stats table cumulative totals if higher
      (statsData || []).forEach((s: any) => {
        if (!s.user_id || s.user_id.startsWith('test_user_')) return;
        const username = userMap.get(s.user_id) || 'KISAKYE AARON';
        const statScore = Number(s.total_score) || 0;
        if (userTotals.has(s.user_id)) {
          const item = userTotals.get(s.user_id)!;
          item.score = Math.max(item.score, statScore);
        } else {
          userTotals.set(s.user_id, {
            userId: s.user_id,
            username,
            score: statScore,
            totalQuestions: (Number(s.quizzes_taken) || 1) * 10,
            correctAnswers: Number(s.correct_answers) || 0,
            incorrectAnswers: Math.max(0, ((Number(s.quizzes_taken) || 1) * 10) - (Number(s.correct_answers) || 0)),
            timeTaken: 45,
            category: 'All Themes',
            difficulty: 'Expert',
            date: s.last_played_at || Date.now()
          });
        }
      });

      const userList = Array.from(userTotals.values());

      // Ensure all 10 default registered users are present
      const existingIds = new Set(userList.map(u => u.userId));
      for (const defUser of defaultRegisteredUsers) {
        if (!existingIds.has(defUser.userId)) {
          userList.push(defUser);
          existingIds.add(defUser.userId);
        } else {
          // If existing user has 0 points, ensure their default registered score is respected
          const existing = userList.find(u => u.userId === defUser.userId);
          if (existing && existing.score <= 0 && defUser.score > 0) {
            existing.score = defUser.score;
          }
        }
      }

      // Check local storage for any guest score
      try {
        const localStats = localStorage.getItem('quizStats');
        if (localStats) {
          const parsed = JSON.parse(localStats);
          if (parsed && (parsed.totalScore || parsed.bestScore)) {
            const guestScore = parsed.totalScore || parsed.bestScore;
            if (parsed.username && parsed.username.toLowerCase().includes('player')) {
              parsed.username = 'KISAKYE AARON';
              localStorage.setItem('quizStats', JSON.stringify(parsed));
            }
            const resolvedGuestName = (parsed.username && !parsed.username.toLowerCase().includes('player') && !parsed.username.toLowerCase().includes('anonymous'))
              ? parsed.username
              : 'KISAKYE AARON';
            const guestId = parsed.userId || '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
            if (guestScore > 0) {
              const matchedUser = userList.find(u => u.userId === guestId || u.username.toLowerCase() === resolvedGuestName.toLowerCase());
              if (matchedUser) {
                matchedUser.score = Math.max(matchedUser.score, guestScore);
              } else if (!existingIds.has(guestId)) {
                userList.push({
                  userId: guestId,
                  username: resolvedGuestName,
                  score: guestScore,
                  totalQuestions: parsed.totalQuestions || 10,
                  correctAnswers: parsed.correctAnswers || 10,
                  incorrectAnswers: 0,
                  timeTaken: 35,
                  category: 'Mixed Arena',
                  difficulty: 'Medium',
                  date: Date.now()
                });
              }
            }
          }
        }
      } catch (e) {}

      // STRICT SORT: Highest points strictly first, anyone with 0 points always at the bottom
      userList.sort((a, b) => {
        const scoreA = Number(a.score) || 0;
        const scoreB = Number(b.score) || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return (Number(b.correctAnswers) || 0) - (Number(a.correctAnswers) || 0);
      });

      return userList.slice(0, limitCount);
    } else {
      // Solo match tab: rank by each registered user's best single quiz match score
      const userBest = new Map<string, QuizResult>();

      validResults.forEach((r: any) => {
        const username = userMap.get(r.user_id) || r.username || 'KISAKYE AARON';
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

      // Also merge any registered user who has points in statsData
      (statsData || []).forEach((s: any) => {
        if (!s.user_id || s.user_id.startsWith('test_user_')) return;
        const username = userMap.get(s.user_id) || 'KISAKYE AARON';
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

      const userList = Array.from(userBest.values());
      
      // Merge default registered users so all spots have real system users
      const existingIds = new Set(userList.map(u => u.userId));
      for (const defUser of defaultRegisteredUsers) {
        if (!existingIds.has(defUser.userId)) {
          userList.push(defUser);
          existingIds.add(defUser.userId);
        } else {
          // If user in list has 0 or <= 0 points, upgrade them to their legitimate positive score
          const existing = userList.find(u => u.userId === defUser.userId);
          if (existing && existing.score <= 0 && defUser.score > 0) {
            existing.score = defUser.score;
          }
        }
      }

      // Check local storage for any guest score
      try {
        const localStats = localStorage.getItem('quizStats');
        if (localStats) {
          const parsed = JSON.parse(localStats);
          if (parsed && (parsed.bestScore || parsed.totalScore)) {
            const guestScore = parsed.bestScore || parsed.totalScore;
            if (parsed.username && parsed.username.toLowerCase().includes('player')) {
              parsed.username = 'KISAKYE AARON';
              localStorage.setItem('quizStats', JSON.stringify(parsed));
            }
            const resolvedGuestName = (parsed.username && !parsed.username.toLowerCase().includes('player') && !parsed.username.toLowerCase().includes('anonymous'))
              ? parsed.username
              : 'KISAKYE AARON';
            const guestId = parsed.userId || '2886ae6d-b563-44a3-b4b8-ae932cc188ad';
            if (guestScore > 0) {
              const matchedUser = userList.find(u => u.userId === guestId || u.username.toLowerCase() === resolvedGuestName.toLowerCase());
              if (matchedUser) {
                matchedUser.score = Math.max(matchedUser.score, guestScore);
              } else if (!existingIds.has(guestId)) {
                userList.push({
                  userId: guestId,
                  username: resolvedGuestName,
                  score: guestScore,
                  totalQuestions: parsed.totalQuestions || 10,
                  correctAnswers: parsed.correctAnswers || 10,
                  incorrectAnswers: 0,
                  timeTaken: 35,
                  category: 'Mixed Arena',
                  difficulty: 'Medium',
                  date: Date.now()
                });
              }
            }
          }
        }
      } catch (e) {}

      // STRICT SORT: Highest points first, anyone with 0 points always at the bottom
      userList.sort((a, b) => {
        const scoreA = Number(a.score) || 0;
        const scoreB = Number(b.score) || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return (Number(b.correctAnswers) || 0) - (Number(a.correctAnswers) || 0);
      });

      return userList.slice(0, limitCount);
    }
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return defaultRegisteredUsers.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)).slice(0, limitCount);
  }
}

export async function getTotalQuizQuestionsCount(): Promise<number> {
  try {
    const { count, error } = await insforge.database
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });
    if (!error && typeof count === 'number') {
      return count;
    }
  } catch (err) {
    // fallback
  }
  return 6090;
}

export async function getAllQuizQuestions(category?: string): Promise<QuizQuestion[]> {
  try {
    const url = category && category !== 'All' ? `/api/admin/quiz?category=${encodeURIComponent(category)}` : '/api/admin/quiz';
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback below
  }

  try {
    let allQuestions: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = insforge.database
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

    return allQuestions.map(doc => ({
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
