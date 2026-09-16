export type TipCategory = 'single' | 'maestro2+' | 'odd4+';
export type TipStatus = 'pending' | 'won' | 'lost' | 'void' | 'postponed';

export interface TipMatch {
  matchId?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  competition: string;
  kickoff?: number;
  prediction: string;
  market?: string;
}

export interface Tip {
  id: string;
  category: TipCategory;
  matches: TipMatch[];
  odds?: number;
  analysis?: string;
  status: TipStatus;
  bookingCode?: string;
  publishDate: number; // Start of day timestamp or specific time
  createdAt: number;
}
