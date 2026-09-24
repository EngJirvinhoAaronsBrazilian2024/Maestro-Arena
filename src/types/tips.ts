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
  odds?: number;
}

export interface Tip {
  id: string;
  category: TipCategory;
  matches: TipMatch[];
  odds?: number;
  analysis?: string;
  status: TipStatus;
  bookingCode?: string;
  imageUrl?: string;
  publishDate: number; // Start of day timestamp or specific time
  createdAt: number;
}

/**
 * Standardize category strings from any legacy or manual format
 */
export function normalizeCategory(cat: string | undefined): TipCategory {
  if (!cat) return 'single';
  const clean = cat.toLowerCase().trim().replace(/[\s_-]+/g, '');
  if (clean.includes('maestro') || clean.includes('2+')) {
    return 'maestro2+';
  }
  if (clean.includes('odd') || clean.includes('4+')) {
    return 'odd4+';
  }
  return 'single';
}
