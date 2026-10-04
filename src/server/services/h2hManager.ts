import { getInsforgeAdmin } from '../insforgeAdmin.js';
import { H2HMatch, H2HPlayer, H2HMatchSettings, H2HSubmission, H2HRoundResult, H2HHistoryItem } from '../../types/h2h.js';
import { QuizQuestion, QuizCategory, QuizDifficulty } from '../../types/quiz.js';
import { MOCK_QUESTIONS } from '../../services/mockQuestions.js';
import { WebSocket } from 'ws';

// In-memory active matches and connected sockets
const activeMatches = new Map<string, H2HMatch>();
// matchId -> Set of WebSockets
const matchSockets = new Map<string, Set<WebSocket>>();
// Round timer handles for automatic advancement
const roundTimers = new Map<string, NodeJS.Timeout>();

// Fallback questions pool if database questions are fewer than requested
const STARTER_QUESTIONS: QuizQuestion[] = [
  {
    id: "sq1",
    question: "Which country won the 2022 FIFA World Cup in Qatar?",
    category: "FIFA World Cup",
    difficulty: "Easy",
    options: ["France", "Argentina", "Brazil", "Croatia"],
    correctAnswer: "Argentina",
    explanation: "Argentina defeated France on penalties after a 3-3 draw."
  },
  {
    id: "sq2",
    question: "Who holds the record for most Premier League goals in a single 38-game season?",
    category: "Premier League",
    difficulty: "Easy",
    options: ["Mohamed Salah", "Erling Haaland", "Alan Shearer", "Cristiano Ronaldo"],
    correctAnswer: "Erling Haaland",
    explanation: "Erling Haaland scored 36 Premier League goals in the 2022-23 season."
  },
  {
    id: "sq3",
    question: "Which club has won the most UEFA Champions League titles in history?",
    category: "UEFA Champions League",
    difficulty: "Easy",
    options: ["AC Milan", "Bayern Munich", "Liverpool", "Real Madrid"],
    correctAnswer: "Real Madrid",
    explanation: "Real Madrid has won a record 15 European Cup / Champions League titles."
  },
  {
    id: "sq4",
    question: "Which nation won the UEFA Euro 2024 tournament held in Germany?",
    category: "World Football",
    difficulty: "Medium",
    options: ["England", "Spain", "France", "Netherlands"],
    correctAnswer: "Spain",
    explanation: "Spain defeated England 2-1 in Berlin to win Euro 2024."
  },
  {
    id: "sq5",
    question: "Who won the men's Ballon d'Or in 2024?",
    category: "World Football",
    difficulty: "Medium",
    options: ["Vinicius Junior", "Rodri", "Jude Bellingham", "Kylian Mbappé"],
    correctAnswer: "Rodri",
    explanation: "Manchester City and Spain midfield maestro Rodri won the 2024 Ballon d'Or."
  },
  {
    id: "sq6",
    question: "Which Italian club is nicknamed 'The Old Lady' (La Vecchia Signora)?",
    category: "Serie A",
    difficulty: "Easy",
    options: ["Inter Milan", "AS Roma", "Juventus", "Napoli"],
    correctAnswer: "Juventus",
    explanation: "Juventus FC, founded in Turin in 1897, is famously known as La Vecchia Signora."
  },
  {
    id: "sq7",
    question: "In what year did Arsenal complete their unbeaten Premier League 'Invincibles' season?",
    category: "Premier League",
    difficulty: "Medium",
    options: ["2001-02", "2003-04", "2005-06", "1998-99"],
    correctAnswer: "2003-04",
    explanation: "Arsenal went 38 league matches undefeated in 2003-04 under Arsène Wenger."
  },
  {
    id: "sq8",
    question: "Which African player was the first to win the FIFA World Player of the Year award?",
    category: "African Football",
    difficulty: "Hard",
    options: ["Samuel Eto'o", "Didier Drogba", "George Weah", "Roger Milla"],
    correctAnswer: "George Weah",
    explanation: "Liberian forward George Weah won the Ballon d'Or and FIFA World Player of the Year in 1995."
  },
  {
    id: "sq9",
    question: "Who is the all-time top goalscorer in UEFA Champions League history?",
    category: "UEFA Champions League",
    difficulty: "Medium",
    options: ["Lionel Messi", "Cristiano Ronaldo", "Robert Lewandowski", "Karim Benzema"],
    correctAnswer: "Cristiano Ronaldo",
    explanation: "Cristiano Ronaldo has scored 140 Champions League goals."
  },
  {
    id: "sq10",
    question: "Which team won the 2023-24 Spanish La Liga title?",
    category: "La Liga",
    difficulty: "Easy",
    options: ["Barcelona", "Atletico Madrid", "Real Madrid", "Girona"],
    correctAnswer: "Real Madrid",
    explanation: "Real Madrid won the 2023-24 La Liga campaign convincingly."
  },
  {
    id: "sq11",
    question: "Which Bundesliga club has the famous 'Yellow Wall' (Südtribüne) of supporters?",
    category: "Bundesliga",
    difficulty: "Easy",
    options: ["Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig"],
    correctAnswer: "Borussia Dortmund",
    explanation: "Borussia Dortmund's Westfalenstadion is home to the world-renowned Yellow Wall terrace."
  },
  {
    id: "sq12",
    question: "Which national team won the Africa Cup of Nations (AFCON) in 2023 (played in 2024)?",
    category: "African Football",
    difficulty: "Medium",
    options: ["Nigeria", "Senegal", "Ivory Coast", "Egypt"],
    correctAnswer: "Ivory Coast",
    explanation: "Host nation Ivory Coast pulled off a dramatic triumph, beating Nigeria 2-1 in the final."
  },
  {
    id: "sq13",
    question: "Who was the manager of Barcelona during their historic sextuple season in 2009?",
    category: "Famous Managers",
    difficulty: "Easy",
    options: ["Frank Rijkaard", "Pep Guardiola", "Luis Enrique", "Jose Mourinho"],
    correctAnswer: "Pep Guardiola",
    explanation: "Pep Guardiola led FC Barcelona to all six available major trophies in 2009."
  },
  {
    id: "sq14",
    question: "How many yards away from the ball must defending players stand at a free-kick?",
    category: "Football Rules",
    difficulty: "Medium",
    options: ["8 yards", "10 yards", "12 yards", "15 yards"],
    correctAnswer: "10 yards",
    explanation: "According to IFAB football rules, defenders must be at least 10 yards (9.15 meters) away."
  },
  {
    id: "sq15",
    question: "Who is Brazil's official all-time leading male international goalscorer?",
    category: "Football Records",
    difficulty: "Medium",
    options: ["Pelé", "Ronaldo Nazário", "Neymar Jr", "Romário"],
    correctAnswer: "Neymar Jr",
    explanation: "Neymar surpassed Pelé's tally of 77 goals to become Brazil's all-time top scorer with 79 goals."
  }
];

// Helper: Generate a unique room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fetch questions from InsForge database with fallback
async function fetchQuestionsForMatch(
  category: QuizCategory | 'All',
  difficulty: QuizDifficulty,
  count: number
): Promise<QuizQuestion[]> {
  const admin = getInsforgeAdmin();
  let dbQuestions: QuizQuestion[] = [];

  try {
    let query = admin.database
      .from('quiz_questions')
      .select('*')
      .eq('status', 'PUBLISHED');

    if (category !== 'All') {
      query = query.eq('category', category);
    } else {
      const randomStart = Math.floor(Math.random() * 50) * 100;
      query = query.range(randomStart, randomStart + 299);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      dbQuestions = data.map((d: any) => ({
        id: d.id,
        question: d.question,
        category: d.category,
        difficulty: d.difficulty,
        options: [...(d.options || [])].sort(() => 0.5 - Math.random()),
        correctAnswer: d.correctanswer || d.correctAnswer || d.correct_answer,
        explanation: d.explanation || ''
      }));
    }
  } catch (err) {
    console.warn('InsForge quiz questions fetch warning:', err);
  }

  // Combine all local static pools: STARTER_QUESTIONS + MOCK_QUESTIONS
  const allStaticPool: QuizQuestion[] = [...STARTER_QUESTIONS, ...MOCK_QUESTIONS];

  // Filter starter/mock questions
  let matchedStarters = allStaticPool.filter(q => {
    const catMatch = category === 'All' || q.category.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(q.category.toLowerCase());
    const diffMatch = !difficulty || q.difficulty === difficulty;
    return catMatch && diffMatch;
  });

  if (matchedStarters.length === 0) {
    matchedStarters = allStaticPool.filter(q => category === 'All' || q.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (matchedStarters.length === 0) {
    matchedStarters = [...allStaticPool];
  }

  // Combine and strictly deduplicate by normalized question text and ID
  const normalize = (t: string) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const combined: QuizQuestion[] = [];
  const seenKeys = new Set<string>();

  const addUnique = (q: QuizQuestion) => {
    if (!q || !q.question || !q.correctAnswer) return;
    const key = normalize(q.question);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combined.push({
        ...q,
        options: Array.from(new Set(q.options || [])).sort(() => 0.5 - Math.random())
      });
    }
  };

  // Add DB questions first
  dbQuestions.forEach(addUnique);

  // Add category matched starters
  matchedStarters.forEach(addUnique);

  // If still fewer than count, add from allStaticPool without repeats
  if (combined.length < count) {
    for (const sq of allStaticPool) {
      addUnique(sq);
      if (combined.length >= count) break;
    }
  }

  // Shuffle and slice exactly up to count (guaranteed unique, no repeated questions)
  const shuffled = combined.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Persist match state to InsForge h2h_matches table
export async function persistMatchToDb(match: H2HMatch) {
  try {
    const admin = getInsforgeAdmin();
    const payload = {
      id: match.id,
      player1id: match.player1?.uid || null,
      player1name: match.player1?.displayName || null,
      player2id: match.player2?.uid || null,
      player2name: match.player2?.displayName || null,
      category: match.settings.category,
      difficulty: match.settings.difficulty,
      status: match.status,
      questions: {
        list: match.questions,
        settings: match.settings,
        roundResults: match.roundResults,
        currentRound: match.currentRound,
        roundStartedAt: match.roundStartedAt,
        roundDeadline: match.roundDeadline,
        player1: match.player1,
        player2: match.player2,
        winnerUid: match.winnerUid,
        winnerName: match.winnerName
      },
      player1score: match.player1?.score || 0,
      player2score: match.player2?.score || 0,
      winnerid: match.winnerUid || null,
      created_at: match.createdAt
    };

    // Upsert into database
    const { error } = await admin.database
      .from('h2h_matches')
      .upsert([payload]);

    if (error) {
      console.warn('Notice persisting h2h_matches to InsForge:', error.message);
    }
  } catch (err) {
    console.error('Error persisting h2h match to database:', err);
  }
}

// Convert from DB row to H2HMatch
export function mapDbRowToMatch(row: any): H2HMatch {
  const qMeta = row.questions || {};
  const isArrayQuestions = Array.isArray(row.questions);
  const questionsList = isArrayQuestions ? row.questions : (qMeta.list || []);

  const settings: H2HMatchSettings = qMeta.settings || {
    roomCode: row.id.startsWith('h2h_') ? row.id.slice(4, 10).toUpperCase() : row.id.toUpperCase(),
    isPrivate: true,
    category: (row.category || 'All') as any,
    difficulty: (row.difficulty || 'Medium') as any,
    questionCount: questionsList.length || 5,
    timePerQuestion: 60
  };

  const player1: H2HPlayer = qMeta.player1 || {
    uid: row.player1id || 'host',
    displayName: row.player1name || 'Player 1',
    score: row.player1score || 0,
    isReady: true,
    currentQuestionIndex: 0,
    hasFinished: false,
    answers: []
  };

  const player2: H2HPlayer | undefined = row.player2id ? (qMeta.player2 || {
    uid: row.player2id,
    displayName: row.player2name || 'Player 2',
    score: row.player2score || 0,
    isReady: false,
    currentQuestionIndex: 0,
    hasFinished: false,
    answers: []
  }) : undefined;

  return {
    id: row.id,
    roomCode: settings.roomCode || row.id,
    status: row.status,
    settings,
    player1,
    player2,
    currentRound: qMeta.currentRound || 0,
    roundStartedAt: qMeta.roundStartedAt,
    roundDeadline: qMeta.roundDeadline,
    questions: questionsList,
    roundResults: qMeta.roundResults || [],
    winnerUid: row.winnerid || qMeta.winnerUid,
    winnerName: qMeta.winnerName,
    createdAt: Number(row.created_at || Date.now())
  };
}

// WebSocket broadcast to room
export function broadcastToRoom(matchId: string, event: string, data: any) {
  const sockets = matchSockets.get(matchId);
  if (!sockets) return;

  const payload = JSON.stringify({ event, data, timestamp: Date.now() });
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Sanitize match state before sending to user (hide answers of future questions)
export function sanitizeMatchForUser(match: H2HMatch, userId?: string): H2HMatch {
  const currentIdx = match.currentRound;
  const isFinished = match.status === 'finished';

  const sanitizedQuestions = match.questions.map((q, idx) => {
    // Only reveal correctAnswer if round is completed or match is finished
    if (idx < currentIdx || isFinished || match.status === 'round_review') {
      return q;
    }
    // Conceal correctAnswer for current and future questions
    const { correctAnswer, ...rest } = q;
    return { ...rest, correctAnswer: '' };
  });

  return {
    ...match,
    questions: sanitizedQuestions
  };
}

// -------------------------------------------------------------
// CORE MULTIPLAYER ACTIONS
// -------------------------------------------------------------

export async function createMatch(
  hostUser: { id: string; displayName?: string; avatarUrl?: string },
  settings: Partial<H2HMatchSettings>
): Promise<H2HMatch> {
  const questionCount = settings.questionCount || 5;
  // Maximum time to play is 1 minute (60s) per question with default 60s
  const rawTime = Number(settings.timePerQuestion) || 60;
  const timePerQuestion = Math.min(60, Math.max(10, rawTime));
  const category = settings.category || 'All';
  const difficulty = settings.difficulty || 'Medium';
  const isPrivate = settings.isPrivate !== false;
  const roomCode = generateRoomCode();
  const matchId = `h2h_${Date.now()}_${roomCode.toLowerCase()}`;

  const questions = await fetchQuestionsForMatch(category, difficulty, questionCount);

  const fullSettings: H2HMatchSettings = {
    roomCode,
    isPrivate,
    category,
    difficulty,
    questionCount: questions.length,
    timePerQuestion
  };

  const match: H2HMatch = {
    id: matchId,
    roomCode,
    status: 'waiting',
    settings: fullSettings,
    player1: {
      uid: hostUser.id,
      displayName: hostUser.displayName || 'Host',
      avatarUrl: hostUser.avatarUrl,
      score: 0,
      isReady: true,
      currentQuestionIndex: 0,
      hasFinished: false,
      answers: []
    },
    currentRound: 0,
    questions,
    roundResults: [],
    createdAt: Date.now()
  };

  activeMatches.set(matchId, match);
  await persistMatchToDb(match);
  return match;
}

export async function joinMatch(
  user: { id: string; displayName?: string; avatarUrl?: string },
  roomCodeOrId: string
): Promise<H2HMatch> {
  const cleanCode = (roomCodeOrId || '').trim();
  if (!cleanCode) {
    throw new Error('Room code is required to join a match.');
  }

  let match = findMatchByCodeOrId(cleanCode);

  // If not in memory, try loading from DB
  if (!match) {
    try {
      const admin = getInsforgeAdmin();
      const codeUpper = cleanCode.toUpperCase();
      const codeLower = cleanCode.toLowerCase();

      // 1. Try matching the match ID ending or containing the room code
      let { data } = await admin.database
        .from('h2h_matches')
        .select('*')
        .ilike('id', `%${codeLower}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      // 2. If not found, try direct ID match
      if (!data || data.length === 0) {
        const directRes = await admin.database
          .from('h2h_matches')
          .select('*')
          .eq('id', cleanCode)
          .limit(1);
        data = directRes.data;
      }

      if (data && data[0]) {
        match = mapDbRowToMatch(data[0]);
        activeMatches.set(match.id, match);
      }
    } catch (dbErr) {
      console.warn('Notice querying DB for match room:', dbErr);
    }
  }

  if (!match) {
    throw new Error(`Match room "${cleanCode.toUpperCase()}" not found. Please verify the 6-letter room code.`);
  }

  if (match.status === 'finished' || match.status === 'cancelled') {
    throw new Error('This match has already ended.');
  }

  // If user is already player1
  if (match.player1.uid === user.id) {
    return match;
  }

  // If user is already player2
  if (match.player2 && match.player2.uid === user.id) {
    return match;
  }

  // If already full
  if (match.player2 && match.player2.uid !== user.id) {
    throw new Error('This room is already full (2/2 players joined).');
  }

  // Add as player2
  match.player2 = {
    uid: user.id,
    displayName: user.displayName || 'Challenger',
    avatarUrl: user.avatarUrl,
    score: 0,
    isReady: true, // Auto-ready or toggleable
    currentQuestionIndex: 0,
    hasFinished: false,
    answers: []
  };

  match.status = 'ready';
  activeMatches.set(match.id, match);
  await persistMatchToDb(match);

  // Broadcast player joined to room
  broadcastToRoom(match.id, 'player_joined', {
    match: sanitizeMatchForUser(match),
    joinedPlayer: match.player2
  });

  return match;
}

export async function togglePlayerReady(
  userId: string,
  matchId: string,
  isReady: boolean
): Promise<H2HMatch> {
  const match = await getOrLoadMatch(matchId);
  if (!match) throw new Error('Match not found');

  if (match.player1.uid === userId) {
    match.player1.isReady = isReady;
  } else if (match.player2 && match.player2.uid === userId) {
    match.player2.isReady = isReady;
  } else {
    throw new Error('User is not a participant in this match');
  }

  // Check if both ready
  if (match.player1.isReady && match.player2?.isReady) {
    match.status = 'ready';
  } else if (match.status === 'ready') {
    match.status = 'waiting';
  }

  activeMatches.set(match.id, match);
  await persistMatchToDb(match);

  broadcastToRoom(match.id, 'match_updated', {
    match: sanitizeMatchForUser(match)
  });

  return match;
}

export async function startMatch(
  hostUserId: string,
  matchId: string
): Promise<H2HMatch> {
  const match = await getOrLoadMatch(matchId);
  if (!match) throw new Error('Match not found');

  if (match.player1.uid !== hostUserId) {
    throw new Error('Only the host can start the match');
  }

  if (!match.player2) {
    throw new Error('Cannot start match without an opponent. Wait for someone to join!');
  }

  // 1. Synchronized Countdown Phase (3000ms)
  // Both players see the 3.. 2.. 1.. countdown at the exact same millisecond
  const now = Date.now();
  const COUNTDOWN_MS = 3000;
  const countdownDeadline = now + COUNTDOWN_MS;

  match.status = 'starting';
  match.currentRound = 0;
  match.countdownDeadline = countdownDeadline;

  activeMatches.set(match.id, match);
  void persistMatchToDb(match).catch(() => {});

  // Broadcast synchronized starting countdown to room immediately
  broadcastToRoom(match.id, 'match_starting', {
    match: sanitizeMatchForUser(match),
    countdownDeadline,
    serverTime: now
  });

  // Schedule the synchronized question reveal at countdownDeadline
  clearExistingRoundTimer(match.id);
  const startTimer = setTimeout(() => {
    const current = activeMatches.get(match.id);
    if (!current || current.status !== 'starting') return;

    const roundNow = Date.now();
    const timeLimit = (current.settings.timePerQuestion || 60) * 1000;

    current.status = 'playing';
    current.currentRound = 0;
    current.roundStartedAt = roundNow;
    current.roundDeadline = roundNow + timeLimit;
    current.countdownDeadline = undefined;

    activeMatches.set(current.id, current);
    void persistMatchToDb(current).catch(() => {});

    broadcastToRoom(current.id, 'match_started', {
      match: sanitizeMatchForUser(current),
      roundIndex: 0,
      serverTime: roundNow
    });

    scheduleRoundDeadline(current.id, 0, timeLimit);
  }, COUNTDOWN_MS);

  roundTimers.set(match.id, startTimer);

  return match;
}

export async function submitAnswer(
  userId: string,
  matchId: string,
  roundIndex: number,
  selectedOption: string
): Promise<{ success: boolean; match: H2HMatch }> {
  const match = await getOrLoadMatch(matchId);
  if (!match) throw new Error('Match not found');

  if (match.status !== 'playing') {
    throw new Error('Match is not currently in playing state');
  }

  if (match.currentRound !== roundIndex) {
    throw new Error(`Round mismatch: current round is ${match.currentRound}, submitted ${roundIndex}`);
  }

  const currentQ = match.questions[roundIndex];
  if (!currentQ) throw new Error('Invalid question index');

  const now = Date.now();
  const startedAt = match.roundStartedAt || now;
  const timeTakenSec = Math.max(0.1, Number(((now - startedAt) / 1000).toFixed(1)));
  const isCorrect = selectedOption.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

  // Scoring: 1000 base + speed bonus up to 500 (proportional to remaining time out of 60s)
  const maxTime = match.settings.timePerQuestion || 60;
  let pointsAwarded = 0;
  if (isCorrect) {
    const remainingFraction = Math.max(0, (maxTime - timeTakenSec) / maxTime);
    const speedBonus = Math.round(500 * remainingFraction);
    pointsAwarded = 1000 + speedBonus;
  }

  // Find or create current round result
  let roundResult = match.roundResults.find(r => r.roundIndex === roundIndex);
  if (!roundResult) {
    roundResult = {
      roundIndex,
      questionId: currentQ.id,
      correctAnswer: currentQ.correctAnswer,
      explanation: currentQ.explanation,
      submissions: {}
    };
    match.roundResults.push(roundResult);
  }

  // Check if already answered
  if (roundResult.submissions[userId]) {
    return { success: true, match: sanitizeMatchForUser(match, userId) };
  }

  // Record submission
  const sub: H2HSubmission = {
    selectedOption,
    isCorrect,
    pointsAwarded,
    timeTakenSeconds: timeTakenSec,
    submittedAt: now
  };
  roundResult.submissions[userId] = sub;

  // Update cumulative player scores
  if (match.player1.uid === userId) {
    match.player1.score += pointsAwarded;
    match.player1.currentQuestionIndex = roundIndex + 1;
    match.player1.answers.push(isCorrect);
  } else if (match.player2 && match.player2.uid === userId) {
    match.player2.score += pointsAwarded;
    match.player2.currentQuestionIndex = roundIndex + 1;
    match.player2.answers.push(isCorrect);
  }

  activeMatches.set(match.id, match);

  // IMMEDIATELY broadcast neutral answer confirmation so opponent knows answer was submitted (< 1ms latency)
  broadcastToRoom(match.id, 'answer_submitted', {
    userId,
    roundIndex,
    hasAnswered: true,
    serverTime: now
  });

  // Non-blocking background persistence so gameplay has zero I/O stutter
  void persistMatchToDb(match).catch(() => {});

  // Check if all players have answered
  const p1Answered = Boolean(roundResult.submissions[match.player1.uid]);
  const p2Answered = match.player2 ? Boolean(roundResult.submissions[match.player2.uid]) : true;

  if (p1Answered && p2Answered) {
    // Both answered! Trigger round review immediately
    clearExistingRoundTimer(match.id);
    completeRound(match.id, roundIndex);
  }

  return { success: true, match: sanitizeMatchForUser(match, userId) };
}

// Automatically advance round when timer expires
function scheduleRoundDeadline(matchId: string, roundIndex: number, ms: number) {
  clearExistingRoundTimer(matchId);

  const timer = setTimeout(() => {
    const match = activeMatches.get(matchId);
    if (match && match.status === 'playing' && match.currentRound === roundIndex) {
      completeRound(matchId, roundIndex);
    }
  }, ms + 250); // Minimal 250ms grace period

  roundTimers.set(matchId, timer);
}

function clearExistingRoundTimer(matchId: string) {
  const existing = roundTimers.get(matchId);
  if (existing) {
    clearTimeout(existing);
    roundTimers.delete(matchId);
  }
}

// Complete round, reveal answers, update scoreboard, transition
async function completeRound(matchId: string, roundIndex: number) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  const currentQ = match.questions[roundIndex];
  let roundResult = match.roundResults.find(r => r.roundIndex === roundIndex);
  if (!roundResult) {
    roundResult = {
      roundIndex,
      questionId: currentQ?.id || `q_${roundIndex}`,
      correctAnswer: currentQ?.correctAnswer || '',
      explanation: currentQ?.explanation || '',
      submissions: {}
    };
    match.roundResults.push(roundResult);
  }

  const now = Date.now();

  // Check unanswered players
  if (!roundResult.submissions[match.player1.uid]) {
    roundResult.submissions[match.player1.uid] = {
      selectedOption: '',
      isCorrect: false,
      pointsAwarded: 0,
      timeTakenSeconds: match.settings.timePerQuestion || 60,
      submittedAt: now
    };
    match.player1.answers.push(false);
  }

  if (match.player2 && !roundResult.submissions[match.player2.uid]) {
    roundResult.submissions[match.player2.uid] = {
      selectedOption: '',
      isCorrect: false,
      pointsAwarded: 0,
      timeTakenSeconds: match.settings.timePerQuestion || 60,
      submittedAt: now
    };
    match.player2.answers.push(false);
  }

  match.status = 'round_review';
  activeMatches.set(match.id, match);
  void persistMatchToDb(match).catch(() => {});

  // Broadcast round complete with revealed results IMMEDIATELY
  broadcastToRoom(match.id, 'round_complete', {
    roundIndex,
    roundResult,
    player1Score: match.player1.score,
    player2Score: match.player2?.score || 0,
    match: sanitizeMatchForUser(match),
    serverTime: now
  });

  // Delay transition for 3.5 seconds in review mode so players can read the explanation
  clearExistingRoundTimer(match.id);
  const reviewTimer = setTimeout(async () => {
    const nextRound = roundIndex + 1;
    if (nextRound >= match.questions.length) {
      // Final question complete -> Finish Match!
      await finishMatch(match.id);
    } else {
      // Advance to next round
      const advanceNow = Date.now();
      const timeLimit = (match.settings.timePerQuestion || 60) * 1000;

      match.status = 'playing';
      match.currentRound = nextRound;
      match.roundStartedAt = advanceNow;
      match.roundDeadline = advanceNow + timeLimit;

      activeMatches.set(match.id, match);
      void persistMatchToDb(match).catch(() => {});

      broadcastToRoom(match.id, 'next_question', {
        roundIndex: nextRound,
        match: sanitizeMatchForUser(match),
        serverTime: advanceNow
      });

      scheduleRoundDeadline(match.id, nextRound, timeLimit);
    }
  }, 3500);

  roundTimers.set(match.id, reviewTimer);
}

// Complete the entire match and calculate winner
async function finishMatch(matchId: string) {
  clearExistingRoundTimer(matchId);
  const match = activeMatches.get(matchId);
  if (!match) return;

  match.status = 'finished';
  match.player1.hasFinished = true;
  if (match.player2) match.player2.hasFinished = true;

  const p1Score = match.player1.score;
  const p2Score = match.player2?.score || 0;

  if (p1Score > p2Score) {
    match.winnerUid = match.player1.uid;
    match.winnerName = match.player1.displayName;
  } else if (p2Score > p1Score && match.player2) {
    match.winnerUid = match.player2.uid;
    match.winnerName = match.player2.displayName;
  } else {
    match.winnerUid = null; // Draw
    match.winnerName = 'Draw';
  }

  activeMatches.set(match.id, match);
  await persistMatchToDb(match);

  // Save to quiz_results for profile stats & leaderboard tracking
  try {
    const admin = getInsforgeAdmin();
    const resultEntries = [
      {
        user_id: match.player1.uid,
        score: match.player1.score,
        total: match.questions.length,
        category: match.settings.category,
        difficulty: match.settings.difficulty,
        completed_at: Date.now()
      }
    ];
    if (match.player2) {
      resultEntries.push({
        user_id: match.player2.uid,
        score: match.player2.score,
        total: match.questions.length,
        category: match.settings.category,
        difficulty: match.settings.difficulty,
        completed_at: Date.now()
      });
    }
    await admin.database.from('quiz_results').insert(resultEntries);
  } catch (e) {
    console.warn('Notice saving quiz_results for h2h:', e);
  }

  broadcastToRoom(match.id, 'match_finished', {
    match: sanitizeMatchForUser(match),
    winnerUid: match.winnerUid,
    winnerName: match.winnerName
  });
}

export async function leaveMatch(userId: string, matchId: string): Promise<void> {
  const match = await getOrLoadMatch(matchId);
  if (!match) return;

  if (match.status === 'playing' || match.status === 'round_review') {
    // Player forfeited
    if (match.player1.uid === userId && match.player2) {
      match.winnerUid = match.player2.uid;
      match.winnerName = match.player2.displayName;
      match.status = 'finished';
    } else if (match.player2?.uid === userId) {
      match.winnerUid = match.player1.uid;
      match.winnerName = match.player1.displayName;
      match.status = 'finished';
    }
    activeMatches.set(match.id, match);
    await persistMatchToDb(match);
    broadcastToRoom(match.id, 'player_left', { userId, match: sanitizeMatchForUser(match) });
  } else if (match.status === 'waiting' || match.status === 'ready') {
    if (match.player1.uid === userId) {
      // Host left before start: cancel match
      match.status = 'cancelled';
      activeMatches.delete(match.id);
      await persistMatchToDb(match);
      broadcastToRoom(match.id, 'match_cancelled', { reason: 'Host left the room' });
    } else if (match.player2?.uid === userId) {
      // Challenger left waiting room
      match.player2 = undefined;
      match.status = 'waiting';
      activeMatches.set(match.id, match);
      await persistMatchToDb(match);
      broadcastToRoom(match.id, 'player_left', { userId, match: sanitizeMatchForUser(match) });
    }
  }
}

// -------------------------------------------------------------
// QUERY HELPERS
// -------------------------------------------------------------

function findMatchByCodeOrId(codeOrId: string): H2HMatch | undefined {
  const clean = codeOrId.trim().toUpperCase();
  for (const match of activeMatches.values()) {
    if (match.id === codeOrId || match.roomCode.toUpperCase() === clean) {
      return match;
    }
  }
  return undefined;
}

export async function getOrLoadMatch(matchId: string): Promise<H2HMatch | null> {
  let match = activeMatches.get(matchId);
  if (match) return match;

  const admin = getInsforgeAdmin();
  const { data } = await admin.database.from('h2h_matches').select('*').eq('id', matchId).single();
  if (data) {
    match = mapDbRowToMatch(data);
    activeMatches.set(match.id, match);
    return match;
  }
  return null;
}

export async function getPublicWaitingMatches(): Promise<H2HMatch[]> {
  // Query memory first
  const publicWaiting: H2HMatch[] = [];
  for (const m of activeMatches.values()) {
    if (!m.settings.isPrivate && m.status === 'waiting' && !m.player2) {
      publicWaiting.push(sanitizeMatchForUser(m));
    }
  }

  // Also query DB for any waiting matches
  try {
    const admin = getInsforgeAdmin();
    const { data } = await admin.database
      .from('h2h_matches')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      for (const row of data) {
        if (!publicWaiting.some(m => m.id === row.id)) {
          const match = mapDbRowToMatch(row);
          if (!match.settings.isPrivate && !match.player2) {
            publicWaiting.push(sanitizeMatchForUser(match));
          }
        }
      }
    }
  } catch (err) {}

  return publicWaiting;
}

export async function getUserMatchHistory(userId: string): Promise<H2HHistoryItem[]> {
  try {
    const admin = getInsforgeAdmin();
    const { data, error } = await admin.database
      .from('h2h_matches')
      .select('*')
      .or(`player1id.eq.${userId},player2id.eq.${userId}`)
      .eq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return data.map((row: any) => {
      const isPlayer1 = row.player1id === userId;
      const myScore = isPlayer1 ? (row.player1score || 0) : (row.player2score || 0);
      const opponentScore = isPlayer1 ? (row.player2score || 0) : (row.player1score || 0);
      const opponentName = isPlayer1 ? (row.player2name || 'Opponent') : (row.player1name || 'Host');

      let result: 'VICTORY' | 'DEFEAT' | 'DRAW' = 'DRAW';
      if (myScore > opponentScore) result = 'VICTORY';
      else if (myScore < opponentScore) result = 'DEFEAT';

      const qMeta = row.questions || {};
      const qList = Array.isArray(row.questions) ? row.questions : (qMeta.list || []);

      return {
        id: row.id,
        roomCode: qMeta.settings?.roomCode || row.id.slice(0, 8),
        category: row.category || 'World Football',
        difficulty: row.difficulty || 'Medium',
        myScore,
        opponentScore,
        opponentName,
        result,
        createdAt: Number(row.created_at || Date.now()),
        questionCount: qList.length || 5
      };
    });
  } catch (err) {
    console.error('Error fetching user h2h history:', err);
    return [];
  }
}

// Register WebSocket for a match with immediate hydration & fast-path actions
export function registerMatchSocket(matchId: string, ws: WebSocket, userId?: string) {
  if (!matchSockets.has(matchId)) {
    matchSockets.set(matchId, new Set());
  }
  matchSockets.get(matchId)!.add(ws);

  // 1. Immediately hydrate client with authoritative state and server timestamp
  const match = activeMatches.get(matchId);
  if (match && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      event: 'init_sync',
      data: {
        match: sanitizeMatchForUser(match, userId),
        serverTime: Date.now()
      }
    }));
  }

  // 2. High-speed bidirectional action listener
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // Ping-pong for millisecond clock synchronization & Cloud Run keepalive
      if (msg.action === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            event: 'pong',
            data: {
              serverTime: Date.now(),
              clientTime: msg.clientTime
            }
          }));
        }
        return;
      }

      // High-speed direct answer submission
      if (
        msg.action === 'answer' &&
        msg.userId &&
        msg.matchId &&
        typeof msg.roundIndex === 'number' &&
        msg.selectedOption
      ) {
        await submitAnswer(msg.userId, msg.matchId, msg.roundIndex, msg.selectedOption);
      }
    } catch (e) {
      console.warn('H2H WebSocket message handling notice:', e);
    }
  });

  // 3. Keepalive ping every 15s to prevent cloud proxy disconnects
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(heartbeat);
    }
  }, 15000);

  ws.on('close', () => {
    clearInterval(heartbeat);
    const set = matchSockets.get(matchId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) {
        matchSockets.delete(matchId);
      }
    }
  });
}
