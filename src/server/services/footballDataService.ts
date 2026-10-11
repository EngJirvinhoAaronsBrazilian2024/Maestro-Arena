import "dotenv/config";

export interface NormalizedTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
}

export interface NormalizedScore {
  home: number | null;
  away: number | null;
  halfTimeHome: number | null;
  halfTimeAway: number | null;
  winner: string | null;
  duration: string;
}

export interface NormalizedCompetition {
  id: number;
  name: string;
  code: string;
  emblem: string | null;
  type: string;
}

export interface NormalizedMatch {
  id: number;
  competition: NormalizedCompetition;
  utcDate: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  rawStatus: string;
  statusLabel: string;
  minute?: string;
  isLive: boolean;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  score: NormalizedScore;
  matchday?: number;
  lastUpdated: string;
}

export interface MatchesResponseData {
  success: boolean;
  count: number;
  liveCount: number;
  upcomingCount: number;
  finishedCount: number;
  lastUpdated: string;
  cached: boolean;
  isStale?: boolean;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
  warning?: string;
  matches: NormalizedMatch[];
}

// In-memory server-side shared cache
interface CacheEntry {
  data: MatchesResponseData;
  expiresAt: number;
  cachedAt: number;
}

let memoryCache: CacheEntry | null = null;
let lastKnownGoodData: MatchesResponseData | null = null;
let inFlightFetchPromise: Promise<MatchesResponseData> | null = null;

// Rate limit cooldown tracker
let rateLimitedUntil: number = 0;

const DEFAULT_LIVE_TTL_MS = 60 * 1000;       // 60 seconds when matches are LIVE
const DEFAULT_REGULAR_TTL_MS = 180 * 1000;   // 3 minutes when no matches are live
const MINIMUM_REFRESH_INTERVAL_MS = 15 * 1000; // Protect against spamming manual refresh

function getApiKey(): string {
  // Read purely from server-side environment variable
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error('FOOTBALL_DATA_API_KEY server environment variable is not configured.');
  }
  return key.trim();
}

/**
 * Maps raw API status to normalized category and human-readable label
 */
function normalizeStatus(rawStatus: string): {
  status: 'LIVE' | 'UPCOMING' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  statusLabel: string;
  isLive: boolean;
} {
  const upper = (rawStatus || '').toUpperCase();
  switch (upper) {
    case 'IN_PLAY':
      return { status: 'LIVE', statusLabel: 'LIVE', isLive: true };
    case 'PAUSED':
      return { status: 'LIVE', statusLabel: 'HT', isLive: true };
    case 'EXTRA_TIME':
      return { status: 'LIVE', statusLabel: 'ET', isLive: true };
    case 'PENALTY_SHOOTOUT':
      return { status: 'LIVE', statusLabel: 'PEN', isLive: true };
    case 'FINISHED':
    case 'AWARDED':
      return { status: 'FINISHED', statusLabel: 'FT', isLive: false };
    case 'TIMED':
    case 'SCHEDULED':
      return { status: 'UPCOMING', statusLabel: 'Scheduled', isLive: false };
    case 'POSTPONED':
      return { status: 'POSTPONED', statusLabel: 'Postponed', isLive: false };
    case 'CANCELLED':
      return { status: 'CANCELLED', statusLabel: 'Cancelled', isLive: false };
    case 'SUSPENDED':
      return { status: 'LIVE', statusLabel: 'Suspended', isLive: true };
    default:
      return { status: 'UPCOMING', statusLabel: upper, isLive: false };
  }
}

/**
 * Normalizes raw match object from football-data.org v4
 */
function normalizeRawMatch(raw: any): NormalizedMatch {
  const { status, statusLabel, isLive } = normalizeStatus(raw.status);

  // Home score: check fullTime, then regularTime
  const homeScore = raw.score?.fullTime?.home ?? raw.score?.regularTime?.home ?? null;
  const awayScore = raw.score?.fullTime?.away ?? raw.score?.regularTime?.away ?? null;

  // Match minute when provided by API (e.g. raw.minute)
  // If not provided, don't invent one: show statusLabel (LIVE, HT, etc.)
  let minute: string | undefined = undefined;
  if (raw.minute !== undefined && raw.minute !== null) {
    minute = `${raw.minute}'`;
  } else if (raw.status === 'PAUSED') {
    minute = 'HT';
  } else if (raw.status === 'IN_PLAY') {
    minute = 'LIVE';
  }

  return {
    id: Number(raw.id),
    competition: {
      id: Number(raw.competition?.id || 0),
      name: raw.competition?.name || 'Football Competition',
      code: raw.competition?.code || 'GEN',
      emblem: raw.competition?.emblem || null,
      type: raw.competition?.type || 'LEAGUE',
    },
    utcDate: raw.utcDate,
    status,
    rawStatus: raw.status,
    statusLabel,
    minute,
    isLive,
    homeTeam: {
      id: Number(raw.homeTeam?.id || 0),
      name: raw.homeTeam?.name || 'Home Team',
      shortName: raw.homeTeam?.shortName || raw.homeTeam?.name || 'Home',
      tla: raw.homeTeam?.tla || (raw.homeTeam?.name ? raw.homeTeam.name.substring(0, 3).toUpperCase() : 'HOM'),
      crest: raw.homeTeam?.crest || null,
    },
    awayTeam: {
      id: Number(raw.awayTeam?.id || 0),
      name: raw.awayTeam?.name || 'Away Team',
      shortName: raw.awayTeam?.shortName || raw.awayTeam?.name || 'Away',
      tla: raw.awayTeam?.tla || (raw.awayTeam?.name ? raw.awayTeam.name.substring(0, 3).toUpperCase() : 'AWY'),
      crest: raw.awayTeam?.crest || null,
    },
    score: {
      home: homeScore,
      away: awayScore,
      halfTimeHome: raw.score?.halfTime?.home ?? null,
      halfTimeAway: raw.score?.halfTime?.away ?? null,
      winner: raw.score?.winner ?? null,
      duration: raw.score?.duration || 'REGULAR',
    },
    matchday: raw.matchday,
    lastUpdated: raw.lastUpdated || new Date().toISOString(),
  };
}

/**
 * Fetch matches directly from football-data.org v4 API with token and error handling
 */
async function fetchFromFootballDataOrg(): Promise<MatchesResponseData> {
  const token = getApiKey();
  if (!token) {
    throw new Error('FOOTBALL_DATA_API_KEY is not configured on the server.');
  }

  const endpoint = 'https://api.football-data.org/v4/matches';
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-Auth-Token': token,
      'Accept': 'application/json',
      'User-Agent': 'MaestroArena/2.0 (+https://maestroarena.app)',
    },
  });

  // Handle Rate Limit (HTTP 429)
  if (response.status === 429) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retrySecs = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
    rateLimitedUntil = Date.now() + (retrySecs * 1000);
    console.warn(`[FootballData] Rate limit (429) encountered. Backing off for ${retrySecs}s`);

    if (lastKnownGoodData) {
      return {
        ...lastKnownGoodData,
        cached: true,
        isStale: true,
        rateLimited: true,
        retryAfterSeconds: retrySecs,
        warning: `football-data.org rate limit reached. Displaying cached scores from ${new Date(lastKnownGoodData.lastUpdated).toLocaleTimeString()}.`,
      };
    }

    const error: any = new Error('Rate limit reached (429). Please wait before refreshing.');
    error.status = 429;
    error.retryAfter = retrySecs;
    throw error;
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`[FootballData] API error ${response.status}: ${errText}`);

    if (lastKnownGoodData) {
      return {
        ...lastKnownGoodData,
        cached: true,
        isStale: true,
        warning: `Temporary upstream connection issue (${response.status}). Displaying previously fetched scores.`,
      };
    }

    const error: any = new Error(`Failed to fetch from football-data.org (HTTP ${response.status})`);
    error.status = response.status;
    throw error;
  }

  const json = await response.json();
  const rawMatches: any[] = json.matches || [];
  const normalized = rawMatches.map(normalizeRawMatch);

  // Sort matches intelligently:
  // 1. Live matches first
  // 2. Scheduled/Upcoming matches by kickoff time
  // 3. Finished matches
  normalized.sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    if (a.status === 'UPCOMING' && b.status === 'UPCOMING') {
      return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
    }
    if (a.status === 'FINISHED' && b.status === 'FINISHED') {
      return new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime();
    }
    return 0;
  });

  const liveMatches = normalized.filter(m => m.isLive);
  const upcomingMatches = normalized.filter(m => m.status === 'UPCOMING');
  const finishedMatches = normalized.filter(m => m.status === 'FINISHED');

  const result: MatchesResponseData = {
    success: true,
    count: normalized.length,
    liveCount: liveMatches.length,
    upcomingCount: upcomingMatches.length,
    finishedCount: finishedMatches.length,
    lastUpdated: new Date().toISOString(),
    cached: false,
    isStale: false,
    matches: normalized,
  };

  // Update last known good data
  lastKnownGoodData = result;

  // Dynamic TTL calculation: 60s if live matches exist, otherwise 180s
  const ttlMs = liveMatches.length > 0 ? DEFAULT_LIVE_TTL_MS : DEFAULT_REGULAR_TTL_MS;
  memoryCache = {
    data: result,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  return result;
}

/**
 * Public service method to get matches with multi-user shared caching & deduplication
 */
export async function getMatches(options: { forceRefresh?: boolean } = {}): Promise<MatchesResponseData> {
  const now = Date.now();

  // 1. Check rate-limit cooldown
  if (now < rateLimitedUntil && lastKnownGoodData) {
    const remainingSecs = Math.ceil((rateLimitedUntil - now) / 1000);
    return {
      ...lastKnownGoodData,
      cached: true,
      isStale: true,
      rateLimited: true,
      retryAfterSeconds: remainingSecs,
      warning: `football-data.org rate limit active. Cooldown remaining: ${remainingSecs}s. Displaying cached scores.`,
    };
  }

  // 2. Check in-memory shared cache
  if (memoryCache && memoryCache.expiresAt > now && !options.forceRefresh) {
    return {
      ...memoryCache.data,
      cached: true,
      isStale: false,
    };
  }

  // 3. Protect against manual refresh spamming within MINIMUM_REFRESH_INTERVAL_MS
  if (options.forceRefresh && memoryCache && (now - memoryCache.cachedAt < MINIMUM_REFRESH_INTERVAL_MS)) {
    return {
      ...memoryCache.data,
      cached: true,
      isStale: false,
    };
  }

  // 4. In-flight request deduplication: return the active promise if one is already fetching
  if (inFlightFetchPromise) {
    try {
      const activeData = await inFlightFetchPromise;
      return {
        ...activeData,
        cached: true,
      };
    } catch (e) {
      // Fall through to retry or fallback
    }
  }

  // 5. Fire fetch
  inFlightFetchPromise = (async () => {
    try {
      return await fetchFromFootballDataOrg();
    } finally {
      inFlightFetchPromise = null;
    }
  })();

  try {
    return await inFlightFetchPromise;
  } catch (err: any) {
    // If error occurs, return stale cache if available
    if (lastKnownGoodData) {
      console.warn('[FootballData] Error fetching, returning stale cache:', err.message);
      return {
        ...lastKnownGoodData,
        cached: true,
        isStale: true,
        warning: `Could not reach live scores provider. Displaying cached data from ${new Date(lastKnownGoodData.lastUpdated).toLocaleTimeString()}.`,
      };
    }
    throw err;
  }
}
