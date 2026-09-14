export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  venue?: string;
  founded?: number;
}

export interface Player {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  number?: number;
  photoUrl?: string;
  age?: number;
  nationality?: string;
  currentTeamId?: string;
}

export interface MatchEvent {
  time: { elapsed: number; extra?: number };
  team: { id: string; name: string; logo?: string };
  player: { id: string; name: string };
  assist?: { id: string; name: string };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
}

export interface MatchStats {
  team: { id: string; name: string; logo?: string };
  statistics: { type: string; value: string | number | null }[];
}

export interface MatchLineup {
  team: { id: string; name: string; logo?: string };
  formation: string;
  startXI: { player: Player }[];
  substitutes: { player: Player }[];
  coach: { id: string; name: string };
}

export interface MatchDetail extends Match {
  events?: MatchEvent[];
  statistics?: MatchStats[];
  lineups?: MatchLineup[];
}

export interface TeamDetail extends Team {
  squad?: Player[];
  // Fixtures and results would be separate API calls or paginated
}

export interface PlayerDetail extends Player {
  statistics?: {
    team: Team;
    league: Competition;
    games: { appearances: number; lineups: number; minutes: number };
    goals: { total: number; assists: number };
  }[];
}

export interface Match {
  id: string;
  competitionId: string;
  competitionName?: string;
  competitionCountry?: string;
  competitionLogo?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  startTime: number;
  matchMinute?: string;
  isMock?: boolean;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
  logoUrl?: string;
  countryFlag?: string;
  type?: string;
}

export interface League {
  id: number;
  name: string;
  type: string;
  logo: string;
}

export interface Country {
  name: string;
  code: string | null;
  flag: string | null;
}

export interface Season {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: any;
}

export interface LeagueResponse {
  league: League;
  country: Country;
  seasons: Season[];
}

export interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  form: string;
}

export interface Transfer {
  id: string;
  date: number;
  type: 'Confirmed' | 'Rumour';
  player: { id: string; name: string; photoUrl?: string };
  fromTeam?: { id: string; name: string; logoUrl?: string };
  toTeam?: { id: string; name: string; logoUrl?: string };
  fee?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  status: 'draft' | 'published';
  publishedAt: number;
}
