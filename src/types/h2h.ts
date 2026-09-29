import { QuizQuestion, QuizCategory, QuizDifficulty } from './quiz';

export interface H2HPlayer {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  isReady: boolean;
  currentQuestionIndex: number;
  hasFinished: boolean;
  answers: boolean[]; // true for correct, false for incorrect
}

export interface H2HSubmission {
  selectedOption: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timeTakenSeconds: number;
  submittedAt: number;
}

export interface H2HRoundResult {
  roundIndex: number;
  questionId: string;
  correctAnswer: string;
  explanation?: string;
  submissions: Record<string, H2HSubmission>; // uid -> submission
}

export interface H2HMatchSettings {
  roomCode: string;
  isPrivate: boolean;
  category: QuizCategory | 'All';
  difficulty: QuizDifficulty;
  questionCount: number;
  timePerQuestion: number;
}

export interface H2HMatch {
  id: string;
  roomCode: string;
  status: 'waiting' | 'ready' | 'starting' | 'playing' | 'round_review' | 'finished' | 'cancelled';
  settings: H2HMatchSettings;
  player1: H2HPlayer;
  player2?: H2HPlayer;
  currentRound: number;
  roundStartedAt?: number;
  roundDeadline?: number;
  questions: QuizQuestion[];
  roundResults: H2HRoundResult[];
  winnerUid?: string | null;
  winnerName?: string | null;
  createdAt: number;
  updatedAt?: number;
}

export interface H2HHistoryItem {
  id: string;
  roomCode: string;
  category: string;
  difficulty: string;
  myScore: number;
  opponentScore: number;
  opponentName: string;
  result: 'VICTORY' | 'DEFEAT' | 'DRAW';
  createdAt: number;
  questionCount: number;
}
