import type { NormalizedMatch, NormalizedTeam } from '../server/services/footballDataService';

export interface ImportanceBreakdown {
  competitionPrestige: number;
  teamStrength: number;
  matchSignificance: number;
  recentForm: number;
  competitionStage: number;
}

export type FixtureTier = 'marquee' | 'featured' | 'standard';

export interface RankedFixture {
  match: NormalizedMatch;
  importanceScore: number;
  breakdown: ImportanceBreakdown;
  tier: FixtureTier;
  highlightLabel?: string;
}

export const IMPORTANCE_WEIGHTS = {
  competitionPrestige: 0.30,
  teamStrength: 0.25,
  matchSignificance: 0.20,
  recentForm: 0.15,
  competitionStage: 0.10,
} as const;

export interface CompetitionPrestigeRule {
  id: string;
  codes: string[];
  keywords: string[];
  score: number;
}

/**
 * Configurable Competition Prestige Ranking (0 - 100)
 */
export const COMPETITION_PRESTIGE_CONFIG: CompetitionPrestigeRule[] = [
  {
    id: 'fifa_world_cup',
    codes: ['WC', 'FIFA.WORLD'],
    keywords: ['fifa world cup', 'world cup finals'],
    score: 100,
  },
  {
    id: 'uefa_champions_league',
    codes: ['CL', 'UEFA.CHAMPIONS'],
    keywords: ['uefa champions league', 'champions league'],
    score: 98,
  },
  {
    id: 'uefa_euro',
    codes: ['EC', 'UEFA.EURO'],
    keywords: ['uefa european championship', 'euro 20', 'uefa euro'],
    score: 96,
  },
  {
    id: 'copa_america',
    codes: ['CONMEBOL.AMERICA'],
    keywords: ['copa america', 'copa américa'],
    score: 94,
  },
  {
    id: 'afcon',
    codes: ['CAF.NATIONS'],
    keywords: ['africa cup of nations', 'afcon'],
    score: 93,
  },
  {
    id: 'premier_league',
    codes: ['PL', 'ENG.1'],
    keywords: ['english premier league', 'premier league'],
    score: 92,
  },
  {
    id: 'uefa_europa_league',
    codes: ['EL', 'UEFA.EUROPA'],
    keywords: ['uefa europa league', 'europa league'],
    score: 88,
  },
  {
    id: 'la_liga',
    codes: ['PD', 'ESP.1'],
    keywords: ['laliga', 'la liga', 'primera division'],
    score: 88,
  },
  {
    id: 'serie_a',
    codes: ['SA', 'ITA.1'],
    keywords: ['serie a'],
    score: 86,
  },
  {
    id: 'bundesliga',
    codes: ['BL1', 'GER.1'],
    keywords: ['bundesliga'],
    score: 86,
  },
  {
    id: 'copa_libertadores',
    codes: ['CLI', 'CONMEBOL.LIBERTADORES'],
    keywords: ['copa libertadores', 'conmebol libertadores'],
    score: 85,
  },
  {
    id: 'ligue_1',
    codes: ['FL1', 'FRA.1'],
    keywords: ['ligue 1'],
    score: 82,
  },
  {
    id: 'uefa_nations_league',
    codes: ['UEFA.NATIONS'],
    keywords: ['uefa nations league'],
    score: 80,
  },
  {
    id: 'uefa_conference_league',
    codes: ['UEFA.EUROPA.CONF'],
    keywords: ['conference league', 'europa conference'],
    score: 79,
  },
  {
    id: 'world_cup_qualifiers',
    codes: [
      'FIFA.WORLDQ.UEFA',
      'FIFA.WORLDQ.CONMEBOL',
      'FIFA.WORLDQ.CAF',
      'FIFA.WORLDQ.CONCACAF',
      'FIFA.WORLDQ.AFC',
    ],
    keywords: ['world cup qualifying', 'world cup qualifier'],
    score: 78,
  },
  {
    id: 'caf_champions_league',
    codes: ['CAF.CHAMPIONS'],
    keywords: ['caf champions league'],
    score: 77,
  },
  {
    id: 'afcon_qualifiers',
    codes: ['CAF.NATIONS_QUAL'],
    keywords: ['africa cup of nations qualifying', 'afcon qualifying'],
    score: 76,
  },
  {
    id: 'fa_cup',
    codes: ['FAC', 'ENG.FA'],
    keywords: ['fa cup'],
    score: 76,
  },
  {
    id: 'afc_champions_league',
    codes: ['AFC.CHAMPIONS'],
    keywords: ['afc champions league'],
    score: 75,
  },
  {
    id: 'concacaf_champions',
    codes: ['CONCACAF.CHAMPIONS'],
    keywords: ['concacaf champions'],
    score: 74,
  },
  {
    id: 'major_domestic_cups',
    codes: ['ESP.COPA_DEL_REY', 'ITA.COPPA_ITALIA', 'GER.DFB_POKAL', 'FRA.COUPE_DE_FRANCE', 'ENG.LEAGUE_CUP'],
    keywords: ['copa del rey', 'coppa italia', 'dfb-pokal', 'dfb pokal', 'coupe de france', 'efl cup', 'carabao cup'],
    score: 73,
  },
  {
    id: 'conmebol_sudamericana',
    codes: ['CONMEBOL.SUDAMERICANA'],
    keywords: ['copa sudamericana', 'sudamericana'],
    score: 73,
  },
  {
    id: 'eredivisie_primeira',
    codes: ['DED', 'NED.1', 'PPL', 'POR.1'],
    keywords: ['eredivisie', 'primeira liga', 'liga portugal'],
    score: 70,
  },
  {
    id: 'brasileirao_argentina',
    codes: ['BSA', 'BRA.1', 'ARG.1'],
    keywords: ['serie a', 'brasileiro', 'liga profesional', 'argentine'],
    score: 68,
  },
  {
    id: 'european_top_flights',
    codes: ['TUR.1', 'BEL.1', 'SCO.1'],
    keywords: ['super lig', 'süper lig', 'jupiler pro league', 'belgian pro', 'scottish premiership'],
    score: 66,
  },
  {
    id: 'concacaf_nations',
    codes: ['CONCACAF.NATIONS.LEAGUE'],
    keywords: ['concacaf nations'],
    score: 66,
  },
  {
    id: 'americas_asia_top',
    codes: ['USA.1', 'MEX.1', 'KSA.1', 'JPN.1'],
    keywords: ['mls', 'major league soccer', 'liga mx', 'saudi pro league', 'j1 league'],
    score: 62,
  },
  {
    id: 'second_tiers',
    codes: ['ELC', 'ENG.2', 'ESP.2'],
    keywords: ['efl championship', 'championship', 'laliga2', 'segunda division'],
    score: 56,
  },
  {
    id: 'international_friendlies',
    codes: ['FIFA.FRIENDLY'],
    keywords: ['international friendly', 'friendly'],
    score: 55,
  },
  {
    id: 'other_recognized_top',
    codes: ['COL.1', 'AUS.1'],
    keywords: ['a-league', 'categoria primera'],
    score: 52,
  },
];

const DEFAULT_COMPETITION_PRESTIGE = 44;

/**
 * Verified canonical club & national team reputation weights (0 - 100)
 */
const TEAM_REPUTATION_WEIGHTS: Record<string, number> = {
  // Global Superpowers
  'real madrid': 100,
  'manchester city': 98,
  'bayern munich': 97,
  'barcelona': 96,
  'liverpool': 96,
  'arsenal': 94,
  'paris saint germain': 93,
  'inter milan': 93,

  // Continental Contenders & European Giants
  'ac milan': 90,
  'juventus': 90,
  'atletico madrid': 89,
  'borussia dortmund': 88,
  'bayer leverkusen': 87,
  'chelsea': 88,
  'manchester united': 88,
  'tottenham': 84,
  'napoli': 85,
  'newcastle united': 82,
  'aston villa': 82,
  'rb leipzig': 81,
  'atalanta': 82,
  'as roma': 81,
  'lazio': 79,
  'benfica': 82,
  'porto': 82,
  'sporting cp': 81,
  'ajax': 82,
  'psv eindhoven': 79,
  'feyenoord': 78,
  'monaco': 78,
  'olympique lyonnais': 77,
  'marseille': 78,
  'lille': 76,
  'athletic club': 79,
  'real sociedad': 78,
  'villarreal': 78,
  'real betis': 76,
  'sevilla': 79,
  'west ham united': 75,
  'brighton': 75,
  'celtic': 77,
  'rangers': 76,
  'galatasaray': 77,
  'fenerbahce': 76,
  'besiktas': 73,
  'club brugge': 74,

  // South America & Global Notable Clubs
  'flamengo': 81,
  'palmeiras': 80,
  'river plate': 81,
  'boca juniors': 80,
  'botafogo': 75,
  'atletico mineiro': 75,
  'sao paulo': 75,
  'corinthians': 74,
  'inter miami': 73,
  'al hilal': 74,
  'al nassr': 73,
  'al ahly': 76,
  'wydad ac': 72,
  'mamelodi sundowns': 72,
  'esperance de tunis': 72,

  // Major National Teams
  'argentina': 98,
  'france': 97,
  'spain': 96,
  'england': 94,
  'brazil': 95,
  'germany': 93,
  'portugal': 92,
  'netherlands': 90,
  'italy': 89,
  'belgium': 86,
  'croatia': 85,
  'uruguay': 86,
  'colombia': 84,
  'morocco': 86,
  'senegal': 83,
  'nigeria': 82,
  'egypt': 81,
  'ivory coast': 81,
  'algeria': 79,
  'cameroon': 78,
  'ghana': 77,
  'japan': 81,
  'south korea': 79,
  'usa': 78,
  'mexico': 77,
  'switzerland': 80,
  'denmark': 79,
  'austria': 78,
  'turkey': 77,
  'uganda': 68,
};

const TEAM_ALIASES: Record<string, string> = {
  'real madrid cf': 'real madrid',
  'fc barcelona': 'barcelona',
  'barca': 'barcelona',
  'fc bayern munchen': 'bayern munich',
  'fc bayern munich': 'bayern munich',
  'bayern munchen': 'bayern munich',
  'bayern': 'bayern munich',
  'man city': 'manchester city',
  'manchester city fc': 'manchester city',
  'man utd': 'manchester united',
  'man united': 'manchester united',
  'manchester united fc': 'manchester united',
  'arsenal fc': 'arsenal',
  'liverpool fc': 'liverpool',
  'chelsea fc': 'chelsea',
  'tottenham hotspur': 'tottenham',
  'spurs': 'tottenham',
  'psg': 'paris saint germain',
  'paris saint-germain': 'paris saint germain',
  'paris sg': 'paris saint germain',
  'fc internazionale milano': 'inter milan',
  'internazionale': 'inter milan',
  'inter': 'inter milan',
  'milan': 'ac milan',
  'juventus fc': 'juventus',
  'juve': 'juventus',
  'atletico de madrid': 'atletico madrid',
  'club atletico de madrid': 'atletico madrid',
  'atleti': 'atletico madrid',
  'dortmund': 'borussia dortmund',
  'bvb': 'borussia dortmund',
  'bayer 04 leverkusen': 'bayer leverkusen',
  'leverkusen': 'bayer leverkusen',
  'ssc napoli': 'napoli',
  'newcastle': 'newcastle united',
  'west ham': 'west ham united',
  'brighton hove albion': 'brighton',
  'brighton and hove albion': 'brighton',
  'roma': 'as roma',
  'ss lazio': 'lazio',
  'sl benfica': 'benfica',
  'fc porto': 'porto',
  'sporting lisbon': 'sporting cp',
  'afc ajax': 'ajax',
  'psv': 'psv eindhoven',
  'olympique de marseille': 'marseille',
  'om': 'marseille',
  'lyon': 'olympique lyonnais',
  'ol': 'olympique lyonnais',
  'as monaco': 'monaco',
  'losc lille': 'lille',
  'athletic bilbao': 'athletic club',
  'athletic club bilbao': 'athletic club',
  'united states': 'usa',
  'cote divoire': 'ivory coast',
  'korea republic': 'south korea',
};

const DEFAULT_UNKNOWN_TEAM_STRENGTH = 34;

interface VerifiedRivalry {
  teams: [string, string];
  score: number;
  label?: string;
}

/**
 * Curated verified rivalries & classic high-profile clashes.
 * Never classify random matches as rivalries.
 */
const VERIFIED_RIVALRIES: VerifiedRivalry[] = [
  { teams: ['real madrid', 'barcelona'], score: 100, label: 'El Clásico' },
  { teams: ['liverpool', 'manchester united'], score: 96, label: 'North-West Derby' },
  { teams: ['bayern munich', 'borussia dortmund'], score: 95, label: 'Der Klassiker' },
  { teams: ['manchester city', 'manchester united'], score: 94, label: 'Manchester Derby' },
  { teams: ['arsenal', 'tottenham'], score: 94, label: 'North London Derby' },
  { teams: ['inter milan', 'ac milan'], score: 94, label: 'Derby della Madonnina' },
  { teams: ['boca juniors', 'river plate'], score: 95, label: 'Superclásico' },
  { teams: ['inter milan', 'juventus'], score: 92, label: "Derby d'Italia" },
  { teams: ['real madrid', 'atletico madrid'], score: 92, label: 'Madrid Derby' },
  { teams: ['psg', 'marseille'], score: 90, label: 'Le Classique' },
  { teams: ['paris saint germain', 'marseille'], score: 90, label: 'Le Classique' },
  { teams: ['celtic', 'rangers'], score: 90, label: 'Old Firm' },
  { teams: ['ajax', 'feyenoord'], score: 88, label: 'De Klassieker' },
  { teams: ['benfica', 'porto'], score: 88, label: 'O Clássico' },
  { teams: ['as roma', 'lazio'], score: 88, label: 'Derby della Capitale' },
  { teams: ['liverpool', 'everton'], score: 86, label: 'Merseyside Derby' },
  { teams: ['galatasaray', 'fenerbahce'], score: 90, label: 'Intercontinental Derby' },
  { teams: ['arsenal', 'chelsea'], score: 86, label: 'London Derby' },
  { teams: ['chelsea', 'tottenham'], score: 84, label: 'London Derby' },
  { teams: ['manchester city', 'liverpool'], score: 92, label: 'Title Rivalry' },
  { teams: ['manchester city', 'arsenal'], score: 91, label: 'Title Rivalry' },
  { teams: ['arsenal', 'liverpool'], score: 90, label: 'Premier Clash' },
  { teams: ['arsenal', 'manchester united'], score: 88, label: 'Historic Rivalry' },
  { teams: ['liverpool', 'chelsea'], score: 85 },
  { teams: ['barcelona', 'atletico madrid'], score: 86 },
  { teams: ['juventus', 'ac milan'], score: 87 },
  { teams: ['juventus', 'napoli'], score: 84 },
  { teams: ['real madrid', 'manchester city'], score: 95, label: 'European Clash' },
  { teams: ['real madrid', 'bayern munich'], score: 95, label: 'European Classic' },
  { teams: ['real madrid', 'liverpool'], score: 92, label: 'European Classic' },
  { teams: ['barcelona', 'bayern munich'], score: 92, label: 'European Classic' },
  { teams: ['barcelona', 'paris saint germain'], score: 90, label: 'European Clash' },
  { teams: ['real madrid', 'paris saint germain'], score: 90, label: 'European Clash' },
  { teams: ['bayern munich', 'arsenal'], score: 88 },
  { teams: ['inter milan', 'barcelona'], score: 88 },
  // Major international rivalries
  { teams: ['argentina', 'brazil'], score: 97, label: 'Superclásico' },
  { teams: ['argentina', 'france'], score: 94, label: 'International Classic' },
  { teams: ['england', 'germany'], score: 90, label: 'International Classic' },
  { teams: ['spain', 'france'], score: 89, label: 'International Classic' },
  { teams: ['spain', 'germany'], score: 89, label: 'International Classic' },
  { teams: ['netherlands', 'germany'], score: 88, label: 'International Classic' },
  { teams: ['italy', 'france'], score: 88 },
  { teams: ['nigeria', 'ghana'], score: 88, label: 'Jollof Derby' },
  { teams: ['egypt', 'senegal'], score: 86 },
  { teams: ['morocco', 'algeria'], score: 86 },
];

export function canonicalizeTeamName(rawName?: string | null): string {
  if (!rawName || typeof rawName !== 'string') return '';
  const cleaned = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(fc|cf|afc|sc|ac|ssc|ss|as|sv|fk|sk|cd|ud|rcd|club|de|balompie|hotspur)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (TEAM_ALIASES[cleaned]) return TEAM_ALIASES[cleaned];

  // Also check cleaned raw without stripping short identifiers (e.g. AC Milan, AS Roma)
  const lightCleaned = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (TEAM_ALIASES[lightCleaned]) return TEAM_ALIASES[lightCleaned];
  if (TEAM_REPUTATION_WEIGHTS[lightCleaned]) return lightCleaned;
  if (TEAM_REPUTATION_WEIGHTS[cleaned]) return cleaned;

  return cleaned || lightCleaned;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function scoreCompetitionPrestige(match: NormalizedMatch): number {
  const code = (match.competition?.code || '').toUpperCase().trim();
  const name = (match.competition?.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // Exact code match takes highest precision priority
  for (const rule of COMPETITION_PRESTIGE_CONFIG) {
    if (code && rule.codes.includes(code)) {
      return rule.score;
    }
  }

  // Fallback keyword match
  for (const rule of COMPETITION_PRESTIGE_CONFIG) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return rule.score;
    }
  }

  return DEFAULT_COMPETITION_PRESTIGE;
}

function parseRecordPpgScore(record?: string): number | null {
  if (!record || typeof record !== 'string') return null;
  const parts = record.trim().split(/[-–]/).map((n) => parseInt(n.trim(), 10));
  if (parts.length < 2 || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  const wins = parts[0] || 0;
  const draws = parts.length >= 3 ? (parts[1] || 0) : 0;
  const losses = parts.length >= 3 ? (parts[2] || 0) : (parts[1] || 0);
  const played = wins + draws + losses;
  if (played < 2) return null;
  const ppgRatio = (wins * 3 + draws) / (played * 3); // 0 to 1
  return clampScore(25 + ppgRatio * 75);
}

function scoreSingleTeamStrength(team?: NormalizedTeam | null): number {
  if (!team) return DEFAULT_UNKNOWN_TEAM_STRENGTH;
  const canonical = canonicalizeTeamName(team.name || team.shortName);
  let reputation = DEFAULT_UNKNOWN_TEAM_STRENGTH;

  if (canonical && TEAM_REPUTATION_WEIGHTS[canonical] !== undefined) {
    reputation = TEAM_REPUTATION_WEIGHTS[canonical];
  } else if (canonical) {
    // Try partial exact token match against verified keys (at least 5 chars to avoid false hits)
    for (const [key, val] of Object.entries(TEAM_REPUTATION_WEIGHTS)) {
      if (key.length >= 5 && (canonical === key || canonical.includes(key))) {
        reputation = val;
        break;
      }
    }
  }

  // Blend in genuine league ranking or season record ONLY if supplied by the API
  const signals: number[] = [];
  if (typeof team.rank === 'number' && team.rank >= 1 && team.rank <= 30) {
    const rankScore = clampScore(100 - (team.rank - 1) * 3.2);
    signals.push(rankScore);
  }
  const recordScore = parseRecordPpgScore(team.record);
  if (recordScore !== null) {
    signals.push(recordScore);
  }

  if (signals.length === 0) {
    return reputation;
  }

  const livePerformanceAvg = signals.reduce((acc, s) => acc + s, 0) / signals.length;
  // Blend historical reputation (75%) with real live league standing/record (25%)
  return clampScore(reputation * 0.75 + livePerformanceAvg * 0.25);
}

export function scoreTeamStrength(match: NormalizedMatch): number {
  const homeStr = scoreSingleTeamStrength(match.homeTeam);
  const awayStr = scoreSingleTeamStrength(match.awayTeam);
  const avg = (homeStr + awayStr) / 2;
  const weakerTeam = Math.min(homeStr, awayStr);
  // Balance weighting ensures two strong clubs outrank one giant vs an unknown minnow
  return clampScore(avg * 0.78 + weakerTeam * 0.22);
}

export function scoreMatchSignificance(match: NormalizedMatch): {
  score: number;
  rivalryLabel?: string;
} {
  const homeKey = canonicalizeTeamName(match.homeTeam?.name || match.homeTeam?.shortName);
  const awayKey = canonicalizeTeamName(match.awayTeam?.name || match.awayTeam?.shortName);

  if (homeKey && awayKey && homeKey !== awayKey) {
    for (const rivalry of VERIFIED_RIVALRIES) {
      const [a, b] = rivalry.teams;
      if ((homeKey === a && awayKey === b) || (homeKey === b && awayKey === a)) {
        return { score: rivalry.score, rivalryLabel: rivalry.label };
      }
    }
  }

  // Derive objective high-profile encounter significance from verified team strengths (never fake rivalries)
  const homeRep = scoreSingleTeamStrength(match.homeTeam);
  const awayRep = scoreSingleTeamStrength(match.awayTeam);
  const minRep = Math.min(homeRep, awayRep);
  const avgRep = (homeRep + awayRep) / 2;

  if (minRep >= 86) {
    return { score: 86, rivalryLabel: 'Marquee Clash' };
  }
  if (minRep >= 78 && avgRep >= 82) {
    return { score: 74 };
  }
  if (avgRep >= 70) {
    return { score: 56 };
  }
  if (avgRep >= 55) {
    return { score: 42 };
  }
  return { score: 26 };
}

function parseFormStringScore(form?: string): number | null {
  if (!form || typeof form !== 'string') return null;
  const tokens = form.toUpperCase().replace(/[^WDL]/g, '');
  if (tokens.length === 0) return null;
  const recent = tokens.slice(-5);
  let pts = 0;
  for (const ch of recent) {
    if (ch === 'W') pts += 3;
    else if (ch === 'D') pts += 1;
  }
  const ratio = pts / (recent.length * 3);
  return clampScore(20 + ratio * 80);
}

export function scoreRecentForm(match: NormalizedMatch): number {
  const homeForm =
    parseFormStringScore(match.homeTeam?.form) ?? parseRecordPpgScore(match.homeTeam?.record);
  const awayForm =
    parseFormStringScore(match.awayTeam?.form) ?? parseRecordPpgScore(match.awayTeam?.record);

  if (homeForm !== null && awayForm !== null) {
    const avg = (homeForm + awayForm) / 2;
    const minForm = Math.min(homeForm, awayForm);
    // Reward matchups where both sides bring genuine strong recent form
    const synergy = minForm >= 65 ? 8 : 0;
    return clampScore(avg + synergy);
  }

  if (homeForm !== null || awayForm !== null) {
    const known = (homeForm ?? awayForm)!;
    return clampScore(known * 0.7 + 40 * 0.3);
  }

  // Neutral baseline when the upstream API provides no form or record fields
  return 40;
}

export function scoreCompetitionStage(match: NormalizedMatch): number {
  const stageRaw = `${match.stage || ''} ${match.roundNote || ''}`.toLowerCase().trim();

  if (stageRaw) {
    if (/\b(final|championship)\b/.test(stageRaw) && !/semi|quarter|1\/4|1\/8/.test(stageRaw)) {
      return 100;
    }
    if (/\b(semi[-\s]?final|semi_finals|semifinal)\b/.test(stageRaw)) {
      return 92;
    }
    if (/\b(quarter[-\s]?final|quarter_finals|quarterfinal)\b/.test(stageRaw)) {
      return 85;
    }
    if (/\b(round of 16|last_16|last 16|knockout|play[-\s]?off|playoffs|elimination)\b/.test(stageRaw)) {
      return 78;
    }
    if (/\b(qualif|preliminary)\b/.test(stageRaw)) {
      return 70;
    }
    if (/\b(group_stage|group stage)\b/.test(stageRaw)) {
      return 58;
    }
  }

  // Late-season domestic league deciders (only when genuine matchday & ranks/high prestige exist)
  if (typeof match.matchday === 'number' && match.matchday >= 32) {
    const hRank = match.homeTeam?.rank;
    const aRank = match.awayTeam?.rank;
    if (hRank && aRank && ((hRank <= 4 && aRank <= 4) || (hRank >= 16 && aRank >= 16))) {
      return 84; // Genuine title or relegation six-pointer
    }
    return 68;
  }

  if (match.competition?.type === 'CUP') {
    return 60;
  }

  return 45;
}

export function scoreFixtureImportance(match: NormalizedMatch): RankedFixture {
  const competitionPrestige = scoreCompetitionPrestige(match);
  const teamStrength = scoreTeamStrength(match);
  const { score: matchSignificance, rivalryLabel } = scoreMatchSignificance(match);
  const recentForm = scoreRecentForm(match);
  const competitionStage = scoreCompetitionStage(match);

  const rawWeighted =
    competitionPrestige * IMPORTANCE_WEIGHTS.competitionPrestige +
    teamStrength * IMPORTANCE_WEIGHTS.teamStrength +
    matchSignificance * IMPORTANCE_WEIGHTS.matchSignificance +
    recentForm * IMPORTANCE_WEIGHTS.recentForm +
    competitionStage * IMPORTANCE_WEIGHTS.competitionStage;

  const importanceScore = Math.round(clampScore(rawWeighted) * 10) / 10;

  let tier: FixtureTier = 'standard';
  if (importanceScore >= 76) {
    tier = 'marquee';
  } else if (importanceScore >= 60) {
    tier = 'featured';
  }

  let highlightLabel = rivalryLabel;
  if (!highlightLabel && tier === 'marquee') {
    highlightLabel = 'Top Match';
  }

  return {
    match,
    importanceScore,
    breakdown: {
      competitionPrestige,
      teamStrength,
      matchSignificance,
      recentForm,
      competitionStage,
    },
    tier,
    highlightLabel,
  };
}

function getKickoffMs(utcDate?: string): number {
  if (!utcDate) return Number.MAX_SAFE_INTEGER;
  const ms = new Date(utcDate).getTime();
  return Number.isFinite(ms) ? ms : Number.MAX_SAFE_INTEGER;
}

/**
 * Deterministic comparator adhering strictly to tie-breakers:
 * 1. Importance Score DESC
 * 2. Competition Prestige DESC
 * 3. Team Strength DESC
 * 4. Match Significance DESC
 * 5. Kickoff Time ASC
 * 6. Match ID ASC
 */
export function compareRankedFixtures(a: RankedFixture, b: RankedFixture): number {
  if (b.importanceScore !== a.importanceScore) {
    return b.importanceScore - a.importanceScore;
  }
  if (b.breakdown.competitionPrestige !== a.breakdown.competitionPrestige) {
    return b.breakdown.competitionPrestige - a.breakdown.competitionPrestige;
  }
  if (b.breakdown.teamStrength !== a.breakdown.teamStrength) {
    return b.breakdown.teamStrength - a.breakdown.teamStrength;
  }
  if (b.breakdown.matchSignificance !== a.breakdown.matchSignificance) {
    return b.breakdown.matchSignificance - a.breakdown.matchSignificance;
  }
  const timeDiff = getKickoffMs(a.match.utcDate) - getKickoffMs(b.match.utcDate);
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return (a.match.id || 0) - (b.match.id || 0);
}

/**
 * Ranks a list of fixtures with graceful degradation on unexpected malformed data.
 */
export function rankFixtures(matches: NormalizedMatch[]): RankedFixture[] {
  if (!Array.isArray(matches) || matches.length === 0) return [];
  try {
    return matches.map((match) => scoreFixtureImportance(match)).sort(compareRankedFixtures);
  } catch (err) {
    console.warn('[FixtureRanking] Falling back to original order:', err);
    return matches.map((match) => ({
      match,
      importanceScore: 50,
      breakdown: {
        competitionPrestige: 50,
        teamStrength: 50,
        matchSignificance: 50,
        recentForm: 40,
        competitionStage: 45,
      },
      tier: 'standard',
    }));
  }
}

/**
 * Local calendar YYYY-MM-DD key so matchday grouping strictly aligns with the user's selected day.
 */
export function getLocalDateKey(dateInput: string | Date): string {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return 'unknown';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return 'unknown';
  }
}

export interface MatchdayOption {
  dateKey: string;
  label: string;
  shortLabel: string;
  count: number;
  liveCount: number;
  isToday: boolean;
}

export function buildMatchdayOptions(matches: NormalizedMatch[]): MatchdayOption[] {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayKey = getLocalDateKey(today);
  const yesterdayKey = getLocalDateKey(yesterday);
  const tomorrowKey = getLocalDateKey(tomorrow);

  const buckets = new Map<string, { count: number; liveCount: number }>();

  for (const m of matches) {
    const key = getLocalDateKey(m.utcDate);
    if (key === 'unknown') continue;
    const prev = buckets.get(key) || { count: 0, liveCount: 0 };
    prev.count += 1;
    if (m.isLive) prev.liveCount += 1;
    buckets.set(key, prev);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, meta]) => {
      let label: string;
      let shortLabel: string;

      if (dateKey === todayKey) {
        label = 'Today';
        shortLabel = 'Today';
      } else if (dateKey === yesterdayKey) {
        label = 'Yesterday';
        shortLabel = 'Yesterday';
      } else if (dateKey === tomorrowKey) {
        label = 'Tomorrow';
        shortLabel = 'Tomorrow';
      } else {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1);
        label = dt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        shortLabel = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      return {
        dateKey,
        label,
        shortLabel,
        count: meta.count,
        liveCount: meta.liveCount,
        isToday: dateKey === todayKey,
      };
    });
}
