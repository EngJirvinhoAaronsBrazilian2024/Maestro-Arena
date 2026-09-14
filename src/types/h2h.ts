import { QuizQuestion, QuizCategory, QuizDifficulty } from './quiz';

export interface H2HPlayer {
  uid: string;
  displayName: string;
  score: number;
  currentQuestionIndex: number;
  isReady: boolean;
  hasFinished: boolean;
  answers: boolean[]; // true for correct, false for incorrect
}

export interface H2HMatch {
  id?: string;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  category: QuizCategory | 'All';
  difficulty: QuizDifficulty;
  player1: H2HPlayer;
  player2?: H2HPlayer;
  questions: QuizQuestion[];
  createdAt: number;
  winnerUid?: string | null;
}
