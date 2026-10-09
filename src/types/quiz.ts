export type QuizCategory = 
  | 'World Football'
  | 'Premier League'
  | 'La Liga'
  | 'Serie A'
  | 'Bundesliga'
  | 'UEFA Champions League'
  | 'UEFA Europa League'
  | 'FIFA World Cup'
  | 'African Football'
  | 'African Cup of Nations'
  | 'Football Players'
  | 'Football Clubs'
  | 'Football History'
  | 'Football Records'
  | 'Football Rules'
  | 'Famous Managers';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface QuizQuestion {
  id: string;
  question: string;
  category: QuizCategory;
  difficulty: QuizDifficulty;
  options: string[];
  correctAnswer: string; // Must exactly match one of the options
  explanation: string;
  hint?: string;
  image?: string;
  source?: string;
  dateAdded?: string;
}

export interface QuizResult {
  userId?: string;
  username?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeTaken: number;
  category: string;
  difficulty: QuizDifficulty;
  date: number;
}

export interface QuizUserStats {
  userId: string;
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  bestScore: number;
  totalScore?: number;
  categoriesPlayed: string[];
}
