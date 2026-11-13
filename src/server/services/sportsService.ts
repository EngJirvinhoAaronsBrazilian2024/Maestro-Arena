import { Match, Competition, Team, MatchDetail, TeamDetail, PlayerDetail, MatchEvent, MatchStats, MatchLineup, Standing, Transfer, ApiFootballResponse, LeagueResponse } from "../../types/sports.js";
import { getMatches as getGlobalMatches, NormalizedMatch } from "./footballDataService.js";
import { getInsforgeAdmin } from "../insforgeAdmin.js";
import { isFreshNewsTimestamp } from "./autoNewsService.js";

const CACHE_TTL_LIVE = 120 * 1000; // 1 minute for live scores
const CACHE_TTL_REGULAR = 30 * 60 * 1000; // 5 minutes for general info
const CACHE_TTL_LONG = 24 * 60 * 60 * 1000; // 24 hours for static info (teams/squads)

const cache = new Map<string, { expiry: number; data: any }>();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  return null;
}

function getStaleCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached) {
    return cached.data as T;
  }
  return null;
}



let isApiKeySuspended = false;
let lastSuspensionCheck = 0;
const SUSPENSION_COOLDOWN_MS = 30 * 60 * 1000; // 30 mins cooldown when API reports errors

export function getEffectiveSportsApiKey(): string | undefined {
  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey || apiKey.trim() === '') return undefined;

  if (isApiKeySuspended) {
    if (Date.now() - lastSuspensionCheck > SUSPENSION_COOLDOWN_MS) {
      isApiKeySuspended = false;
    } else {
      return undefined;
    }
  }
  return apiKey.trim();
}

export function handleApiErrorResponse(_errors?: any) {
  isApiKeySuspended = true;
  lastSuspensionCheck = Date.now();
}

function setCache(key: string, data: any, ttlMs: number) {
  cache.set(key, { expiry: Date.now() + ttlMs, data });
}

function mapNormalizedToMatch(m: NormalizedMatch): Match {
  const statusMap: Record<NormalizedMatch['status'], Match['status']> = {
    LIVE: 'live',
    UPCOMING: 'scheduled',
    FINISHED: 'finished',
    POSTPONED: 'postponed',
    CANCELLED: 'postponed',
  };
  return {
    id: String(m.id),
    competitionId: String(m.competition.id),
    competitionName: m.competition.name,
    competitionCountry: m.competition.type === 'CUP' ? 'International / Cup' : 'World',
    competitionLogo: m.competition.emblem || undefined,
    homeTeam: {
      id: String(m.homeTeam.id),
      name: m.homeTeam.name,
      shortName: m.homeTeam.tla || m.homeTeam.shortName,
      logoUrl: m.homeTeam.crest || undefined,
    },
    awayTeam: {
      id: String(m.awayTeam.id),
      name: m.awayTeam.name,
      shortName: m.awayTeam.tla || m.awayTeam.shortName,
      logoUrl: m.awayTeam.crest || undefined,
    },
    homeScore: m.score.home,
    awayScore: m.score.away,
    status: statusMap[m.status] || 'scheduled',
    startTime: new Date(m.utcDate).getTime(),
    matchMinute: m.minute,
    isMock: false,
  };
}

async function getGlobalLiveMatchesFallback(): Promise<Match[]> {
  try {
    const res = await getGlobalMatches();
    return res.matches.filter((m) => m.isLive).map(mapNormalizedToMatch);
  } catch {
    return [];
  }
}

async function getGlobalUpcomingMatchesFallback(): Promise<Match[]> {
  try {
    const res = await getGlobalMatches();
    return res.matches.filter((m) => m.status === 'UPCOMING').map(mapNormalizedToMatch);
  } catch {
    return [];
  }
}

async function getGlobalRecentMatchesFallback(): Promise<Match[]> {
  try {
    const res = await getGlobalMatches();
    return res.matches.filter((m) => m.status === 'FINISHED').map(mapNormalizedToMatch);
  } catch {
    return [];
  }
}

async function getGlobalCompetitionsFallback(): Promise<Competition[]> {
  try {
    const res = await getGlobalMatches();
    const map = new Map<string, Competition>();
    for (const m of res.matches) {
      const id = String(m.competition.id);
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: m.competition.name,
          country: m.competition.type === 'CUP' ? 'Tournament' : 'World',
          logoUrl: m.competition.emblem || undefined,
          type: m.competition.type === 'CUP' ? 'Cup' : 'League',
        });
      }
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

export async function getMatchDetails(id: string): Promise<MatchDetail | null> {
  const cacheKey = `match_details_${id}`;
  const cached = getCached<MatchDetail>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  // Fallback to normalized global multi-tournament feed
  if (!apiKey) {
    const res = await getGlobalMatches();
    const match = res.matches.find((m) => String(m.id) === id);
    if (match) {
      const mapped = mapNormalizedToMatch(match);
      const detail: MatchDetail = {
        ...mapped,
        events: [],
        statistics: [],
      };
      setCache(cacheKey, detail, CACHE_TTL_LIVE);
      return detail;
    }

    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/fixtures?id=${id}`, {
      headers: { "x-apisports-key": apiKey }
    });
    if (!response.ok) throw new Error("API Error");
    const data = await response.json();
    if (!data.response || data.response.length === 0) return null;
    const item = data.response[0];

    const matchDetail: MatchDetail = {
      id: String(item.fixture.id),
      competitionId: String(item.league.id),
      competitionName: item.league.name,
      competitionCountry: item.league.country,
      competitionLogo: item.league.logo,
      homeTeam: { id: String(item.teams.home.id), name: item.teams.home.name, shortName: item.teams.home.name.substring(0,3).toUpperCase(), logoUrl: item.teams.home.logo },
      awayTeam: { id: String(item.teams.away.id), name: item.teams.away.name, shortName: item.teams.away.name.substring(0,3).toUpperCase(), logoUrl: item.teams.away.logo },
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      status: item.fixture.status.short === "FT" ? "finished" : item.fixture.status.short === "NS" ? "scheduled" : "live",
      startTime: new Date(item.fixture.date).getTime(),
      matchMinute: item.fixture.status.elapsed ? `${item.fixture.status.elapsed}'` : undefined,
      isMock: false,
      events: item.events?.map((e: any) => ({
        time: e.time,
        team: { id: String(e.team.id), name: e.team.name, logo: e.team.logo },
        player: { id: String(e.player.id), name: e.player.name },
        assist: e.assist.id ? { id: String(e.assist.id), name: e.assist.name } : undefined,
        type: e.type,
        detail: e.detail
      })),
      statistics: item.statistics?.map((s: any) => ({
        team: { id: String(s.team.id), name: s.team.name, logo: s.team.logo },
        statistics: s.statistics
      })),
      lineups: item.lineups?.map((l: any) => ({
        team: { id: String(l.team.id), name: l.team.name, logo: l.team.logo },
        formation: l.formation,
        startXI: l.startXI.map((x: any) => ({ player: { id: String(x.player.id), name: x.player.name, number: x.player.number } })),
        substitutes: l.substitutes.map((x: any) => ({ player: { id: String(x.player.id), name: x.player.name, number: x.player.number } })),
        coach: { id: String(l.coach.id), name: l.coach.name }
      }))
    };
    
    setCache(cacheKey, matchDetail, CACHE_TTL_LIVE);
    return matchDetail;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return null;
  }
}

export async function getTeamDetails(id: string): Promise<TeamDetail | null> {
  const cacheKey = `team_details_${id}`;
  const cached = getCached<TeamDetail>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const mockTeam: TeamDetail = {
      id, name: "Arsenal", shortName: "ARS",
      venue: "Emirates Stadium", founded: 1886,
      squad: [
        { id: "s1", name: "Bukayo Saka", position: "Attacker", number: 7, currentTeamId: id },
        { id: "s2", name: "Martin Odegaard", position: "Midfielder", number: 8, currentTeamId: id }
      ]
    };
    setCache(cacheKey, mockTeam, CACHE_TTL_LONG);
    return mockTeam;
  }

  try {
    const teamRes = await fetch(`${apiUrl}/teams?id=${id}`, { headers: { "x-apisports-key": apiKey }});
    const teamData = await teamRes.json();
    if (!teamData.response || teamData.response.length === 0) return null;
    
    const t = teamData.response[0].team;
    const v = teamData.response[0].venue;
    
    // Fetch squad (usually a separate endpoint in api-sports)
    const squadRes = await fetch(`${apiUrl}/players/squad?team=${id}`, { headers: { "x-apisports-key": apiKey }});
    const squadData = await squadRes.json();
    let squad: any[] = [];
    if (squadData.response && squadData.response.length > 0) {
      squad = squadData.response[0].players.map((p: any) => ({
        id: String(p.id), name: p.name, position: p.position, number: p.number, photoUrl: p.photo, age: p.age, currentTeamId: id
      }));
    }

    const teamDetail: TeamDetail = {
      id: String(t.id),
      name: t.name,
      shortName: t.code || t.name.substring(0,3).toUpperCase(),
      logoUrl: t.logo,
      founded: t.founded,
      venue: v.name,
      squad
    };

    setCache(cacheKey, teamDetail, CACHE_TTL_LONG);
    return teamDetail;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return null;
  }
}

export async function getPlayerDetails(id: string): Promise<PlayerDetail | null> {
  const cacheKey = `player_details_${id}`;
  const cached = getCached<PlayerDetail>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const mockPlayer: PlayerDetail = {
      id, name: "Bukayo Saka", firstName: "Bukayo", lastName: "Saka",
      position: "Attacker", age: 22, nationality: "England",
      statistics: [{
        team: { id: "ars", name: "Arsenal", shortName: "ARS" },
        league: { id: "pl", name: "Premier League", country: "England" },
        games: { appearances: 25, lineups: 25, minutes: 2200 },
        goals: { total: 10, assists: 8 }
      }]
    };
    setCache(cacheKey, mockPlayer, CACHE_TTL_LONG);
    return mockPlayer;
  }

  try {
    const res = await fetch(`${apiUrl}/players?id=${id}&season=${new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1}`, { headers: { "x-apisports-key": apiKey }});
    const data = await res.json();
    if (!data.response || data.response.length === 0) return null;
    
    const p = data.response[0].player;
    const stats = data.response[0].statistics;

    const playerDetail: PlayerDetail = {
      id: String(p.id),
      name: p.name,
      firstName: p.firstname,
      lastName: p.lastname,
      age: p.age,
      nationality: p.nationality,
      photoUrl: p.photo,
      statistics: stats.map((s: any) => ({
        team: { id: String(s.team.id), name: s.team.name, logoUrl: s.team.logo },
        league: { id: String(s.league.id), name: s.league.name, logoUrl: s.league.logo },
        games: { appearances: s.games.appearences, lineups: s.games.lineups, minutes: s.games.minutes },
        goals: { total: s.goals.total, assists: s.goals.assists }
      }))
    };

    setCache(cacheKey, playerDetail, CACHE_TTL_LONG);
    return playerDetail;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return null;
  }
}

export async function getLiveMatches(): Promise<Match[]> {
  const cacheKey = "live_matches";
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const data = await getGlobalLiveMatchesFallback();
    setCache(cacheKey, data, CACHE_TTL_LIVE);
    return data;
  }

  try {
    const response = await fetch(`${apiUrl}/fixtures?live=all`, {
      headers: {
        "x-apisports-key": apiKey
      }
    });

    if (!response.ok) {
      handleApiErrorResponse();
      const stale = getStaleCache<any>(cacheKey);
      return stale || (await getGlobalLiveMatchesFallback());
    }
    
    const data = await response.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      handleApiErrorResponse(data.errors);
      const stale = getStaleCache<any>(cacheKey);
      const fallback = stale || (await getGlobalLiveMatchesFallback());
      setCache(cacheKey, fallback, CACHE_TTL_LIVE);
      return fallback;
    }

    const matches: Match[] = (data.response || []).map((item: any) => ({
      id: String(item.fixture.id),
      competitionId: String(item.league.id),
      competitionName: item.league.name,
      competitionCountry: item.league.country,
      competitionLogo: item.league.logo,
      homeTeam: { 
        id: String(item.teams.home.id), 
        name: item.teams.home.name, 
        shortName: item.teams.home.name.substring(0, 3).toUpperCase(),
        logoUrl: item.teams.home.logo
      },
      awayTeam: { 
        id: String(item.teams.away.id), 
        name: item.teams.away.name, 
        shortName: item.teams.away.name.substring(0, 3).toUpperCase(),
        logoUrl: item.teams.away.logo
      },
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      status: "live",
      startTime: new Date(item.fixture.date).getTime(),
      matchMinute: item.fixture.status.elapsed ? `${item.fixture.status.elapsed}'` : "LIVE",
      isMock: false
    }));

    if (matches.length === 0) {
      const globalLive = await getGlobalLiveMatchesFallback();
      setCache(cacheKey, globalLive, CACHE_TTL_LIVE);
      return globalLive;
    }

    setCache(cacheKey, matches, CACHE_TTL_LIVE);
    return matches;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return await getGlobalLiveMatchesFallback();
  }
}

export async function getUpcomingMatches(): Promise<Match[]> {
  const cacheKey = "upcoming_matches";
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const data = await getGlobalUpcomingMatchesFallback();
    setCache(cacheKey, data, CACHE_TTL_REGULAR);
    return data;
  }

  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const response = await fetch(`${apiUrl}/fixtures?date=${dateStr}&status=NS`, {
      headers: {
        "x-apisports-key": apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.errors || Object.keys(data.errors).length === 0) {
        if (data.response && data.response.length > 0) {
          const sorted = [...data.response]
            .filter((item: any) => item.fixture?.status?.short === "NS")
            .sort((a: any, b: any) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

          if (sorted.length > 0) {
            const matches: Match[] = sorted.map((item: any) => ({
              id: String(item.fixture.id),
              competitionId: String(item.league.id),
              competitionName: item.league.name,
              competitionCountry: item.league.country,
              competitionLogo: item.league.logo,
              homeTeam: { 
                id: String(item.teams.home.id), 
                name: item.teams.home.name, 
                shortName: item.teams.home.name.substring(0, 3).toUpperCase(),
                logoUrl: item.teams.home.logo
              },
              awayTeam: { 
                id: String(item.teams.away.id), 
                name: item.teams.away.name, 
                shortName: item.teams.away.name.substring(0, 3).toUpperCase(),
                logoUrl: item.teams.away.logo
              },
              homeScore: null,
              awayScore: null,
              status: "scheduled",
              startTime: new Date(item.fixture.date).getTime(),
              isMock: false
            }));

            setCache(cacheKey, matches, CACHE_TTL_REGULAR);
            return matches;
          }
        }
      }
    }

    const fallback = await getGlobalUpcomingMatchesFallback();
    setCache(cacheKey, fallback, CACHE_TTL_REGULAR);
    return fallback;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return await getGlobalUpcomingMatchesFallback();
  }
}

export async function getCompetitions(): Promise<Competition[]> {
  const cacheKey = "competitions_current";
  const cached = getCached<Competition[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const globalComps = await getGlobalCompetitionsFallback();
    setCache(cacheKey, globalComps, CACHE_TTL_REGULAR);
    return globalComps;
  }

  try {
    const response = await fetch(`${apiUrl}/leagues?current=true`, {
      headers: {
        "x-apisports-key": apiKey
      }
    });

    if (!response.ok) {
      handleApiErrorResponse();
      const stale = getStaleCache<any>(cacheKey);
      return stale || (await getGlobalCompetitionsFallback());
    }

    const data: ApiFootballResponse<LeagueResponse> = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      handleApiErrorResponse(data.errors);
      const fallback = await getGlobalCompetitionsFallback();
      setCache(cacheKey, fallback, CACHE_TTL_REGULAR);
      return fallback;
    }

    const competitions: Competition[] = (data.response || [])
      .slice(0, 80)
      .map((item) => ({
        id: String(item.league.id),
        name: item.league.name,
        country: item.country.name,
        logoUrl: item.league.logo,
        countryFlag: item.country.flag || undefined,
        type: item.league.type
      }));

    setCache(cacheKey, competitions, CACHE_TTL_LONG);
    return competitions;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    return stale || (await getGlobalCompetitionsFallback());
  }
}

export async function getStandings(competitionId: string): Promise<Standing[]> {
  const cacheKey = `standings_${competitionId}`;
  const cached = getCached<Standing[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const mockStandings: Standing[] = [
      { rank: 1, team: { id: "ars", name: "Arsenal", shortName: "ARS" }, points: 85, goalsDiff: 45, goalsFor: 70, goalsAgainst: 25, played: 38, win: 26, draw: 7, lose: 5, form: "WWWDW" },
      { rank: 2, team: { id: "mci", name: "Manchester City", shortName: "MCI" }, points: 83, goalsDiff: 48, goalsFor: 80, goalsAgainst: 32, played: 38, win: 25, draw: 8, lose: 5, form: "WWWWL" },
      { rank: 3, team: { id: "liv", name: "Liverpool", shortName: "LIV" }, points: 79, goalsDiff: 32, goalsFor: 68, goalsAgainst: 36, played: 38, win: 23, draw: 10, lose: 5, form: "DWLDW" }
    ];
    setCache(cacheKey, mockStandings, CACHE_TTL_LONG);
    return mockStandings;
  }

  try {
    const res = await fetch(`${apiUrl}/standings?league=${competitionId}&season=${new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1}`, { headers: { "x-apisports-key": apiKey }});
    const data = await res.json();
    if (!data.response || data.response.length === 0) {
      const stale = getStaleCache<any>(cacheKey);
      if (stale) return stale;
      return [];
    }

    const standings = data.response[0].league.standings[0].map((s: any) => ({
      rank: s.rank,
      team: { id: String(s.team.id), name: s.team.name, logoUrl: s.team.logo, shortName: s.team.name.substring(0,3).toUpperCase() },
      points: s.points,
      goalsDiff: s.goalsDiff,
      goalsFor: s.all?.goals?.for || 0,
      goalsAgainst: s.all?.goals?.against || 0,
      played: s.all.played,
      win: s.all.win,
      draw: s.all.draw,
      lose: s.all.lose,
      form: s.form || ""
    }));

    setCache(cacheKey, standings, CACHE_TTL_LONG);
    return standings;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return [];
  }
}

function classifyTransferHeadline(title: string, summary: string, category: string): { type: 'Confirmed' | 'Rumour'; fee?: string } {
  const combined = `${title} ${summary}`.toLowerCase();
  const confirmedPattern = /\b(official|confirmed|signs|signed|completes|completed|agrees permanent|unveiled|announces signing|announced signing|done deal|joins|permanent move)\b/i;
  const rumourPattern = /\b(rumour|rumor|linked|talks|interest|interested|bid|offer|target|wants|eyes|monitoring|considering|close to|chasing|race for|could leave|set to|loan)\b/i;

  const feeMatch = `${title} ${summary}`.match(/(£\s?\d+(?:\.\d+)?\s?(?:m|million|k)|€\s?\d+(?:\.\d+)?\s?(?:m|million|k)|\$\s?\d+(?:\.\d+)?\s?(?:m|million|k)|free transfer|loan deal)/i);
  const fee = feeMatch ? feeMatch[0].replace(/\s+/g, '') : undefined;

  if (confirmedPattern.test(combined) && !rumourPattern.test(title.toLowerCase())) {
    return { type: 'Confirmed', fee };
  }
  if (category.toLowerCase().includes('confirmed')) {
    return { type: 'Confirmed', fee };
  }
  return { type: 'Rumour', fee };
}

function extractTransferClubs(title: string): { from?: string; to?: string } {
  const knownClubs = [
    'Arsenal', 'Aston Villa', 'Barcelona', 'Real Madrid', 'Atletico Madrid',
    'Liverpool', 'Manchester City', 'Man City', 'Manchester United', 'Man Utd', 'Man United',
    'Chelsea', 'Tottenham', 'Spurs', 'Newcastle', 'West Ham', 'Brighton', 'Everton',
    'Bayern Munich', 'Bayern', 'Borussia Dortmund', 'Dortmund', 'Bayer Leverkusen', 'Leverkusen',
    'Juventus', 'AC Milan', 'Inter Milan', 'Inter', 'Napoli', 'Roma', 'PSG',
    'Crystal Palace', 'Fulham', 'Brentford', 'Bournemouth', 'Wolves', 'Nottingham Forest',
    'Al Hilal', 'Al Nassr', 'Inter Miami', 'Sporting', 'Benfica', 'Porto', 'Ajax'
  ];

  const found: string[] = [];
  const lower = title.toLowerCase();
  for (const club of knownClubs) {
    if (lower.includes(club.toLowerCase())) {
      const canonical =
        club === 'Man Utd' || club === 'Man United' ? 'Manchester United' :
        club === 'Man City' ? 'Manchester City' :
        club === 'Spurs' ? 'Tottenham' :
        club === 'Dortmund' ? 'Borussia Dortmund' :
        club === 'Leverkusen' ? 'Bayer Leverkusen' :
        club === 'Bayern' ? 'Bayern Munich' : club;
      if (!found.includes(canonical)) found.push(canonical);
    }
  }
  return {
    to: found[0],
    from: found[1],
  };
}

export async function getTransfers(): Promise<Transfer[]> {
  const cacheKey = `transfers_latest_v2`;
  const cached = getCached<Transfer[]>(cacheKey);
  if (cached) return cached;

  const transfers: Transfer[] = [];
  const seenIds = new Set<string>();

  // 1. Live Transfer News & Deals from InsForge published articles
  try {
    const admin = getInsforgeAdmin();
    const { data } = await admin.database
      .from('articles')
      .select('id, title, summary, content, category, author_name, image_url, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100);

    const transferKeywords = /\b(transfer|transfers|sign|signing|signed|deal|loan|bid|contract|move|target|linked|rumour|rumor|window|free agent|release clause|unveil|joins)\b/i;

    for (const row of data || []) {
      const pubTs = Number(row.published_at || 0);
      if (!isFreshNewsTimestamp(pubTs)) continue;

      const cat = String(row.category || '');
      const title = String(row.title || '');
      const summary = String(row.summary || '');
      const isTransferStory = cat.toLowerCase().includes('transfer') || transferKeywords.test(title) || transferKeywords.test(summary);
      if (!isTransferStory) continue;

      const { type, fee } = classifyTransferHeadline(title, summary, cat);
      const clubs = extractTransferClubs(title);
      const id = `art_${row.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      transfers.push({
        id,
        date: pubTs,
        type,
        player: { id: id, name: title.split(/[:\-–|]/)[0].trim() || title },
        fromTeam: clubs.from ? { id: clubs.from.toLowerCase().replace(/\s+/g, '_'), name: clubs.from } : undefined,
        toTeam: clubs.to ? { id: clubs.to.toLowerCase().replace(/\s+/g, '_'), name: clubs.to } : undefined,
        fee,
        title,
        summary: summary || (row.content ? String(row.content).slice(0, 160) : ''),
        source: row.author_name || 'Sports Desk',
        articleId: row.id,
        league: cat || 'Transfers',
        imageUrl: row.image_url || undefined,
      });
    }
  } catch (dbErr) {
    console.warn('Transfer tracker DB scan notice:', dbErr);
  }

  // 2. Supplement with API-Sports transfers if key is configured
  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";
  if (apiKey) {
    try {
      const res = await fetch(`${apiUrl}/transfers?team=39`, { headers: { "x-apisports-key": apiKey }});
      const data = await res.json();
      if (Array.isArray(data.response)) {
        data.response.slice(0, 8).forEach((item: any) => {
          (item.transfers || []).slice(0, 2).forEach((t: any) => {
            const ts = new Date(t.date).getTime();
            if (!isFreshNewsTimestamp(ts)) return;
            const id = `api_${item.player.id}_${t.date}`;
            if (seenIds.has(id)) return;
            seenIds.add(id);
            transfers.push({
              id,
              date: ts,
              type: String(t.type || '').toLowerCase().includes("loan") ? 'Rumour' : 'Confirmed',
              player: { id: String(item.player.id), name: item.player.name },
              fromTeam: t.teams?.out ? { id: String(t.teams.out.id), name: t.teams.out.name, logoUrl: t.teams.out.logo } : undefined,
              toTeam: t.teams?.in ? { id: String(t.teams.in.id), name: t.teams.in.name, logoUrl: t.teams.in.logo } : undefined,
              fee: t.type || undefined,
              source: 'API-Football',
              league: 'Transfer Window',
            });
          });
        });
      }
    } catch (error) {
      handleApiErrorResponse(error);
    }
  }

  transfers.sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
  setCache(cacheKey, transfers, 5 * 60 * 1000);
  return transfers;
}

export async function getCompetitionResults(competitionId: string): Promise<Match[]> {
  const cacheKey = `comp_results_${competitionId}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const matches = await getUpcomingMatches(); // reuse mock structure
    return (matches || []).map((m, i) => ({
      ...m,
      id: `res-${m.id}`,
      competitionId,
      status: 'finished',
      homeScore: Math.floor(Math.random() * 4),
      awayScore: Math.floor(Math.random() * 4),
      startTime: Date.now() - (i + 1) * 86400000,
    }));
  }

  try {
    const season = new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const res = await fetch(`${apiUrl}/fixtures?league=${competitionId}&season=${season}&last=20`, { headers: { "x-apisports-key": apiKey }});
    const data = await res.json();
    if (!data.response) return [];

    const matches: Match[] = data.response.map((item: any) => ({
      id: String(item.fixture.id),
      competitionId: String(item.league.id),
      competitionName: item.league.name,
      competitionCountry: item.league.country,
      competitionLogo: item.league.logo,
      homeTeam: { 
        id: String(item.teams.home.id), 
        name: item.teams.home.name, 
        shortName: item.teams.home.name.substring(0, 3).toUpperCase(),
        logoUrl: item.teams.home.logo
      },
      awayTeam: { 
        id: String(item.teams.away.id), 
        name: item.teams.away.name, 
        shortName: item.teams.away.name.substring(0, 3).toUpperCase(),
        logoUrl: item.teams.away.logo
      },
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      status: "finished",
      startTime: new Date(item.fixture.date).getTime(),
      isMock: false
    }));

    setCache(cacheKey, matches, CACHE_TTL_REGULAR);
    return matches;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return [];
  }
}

export async function getCompetitionFixtures(competitionId: string): Promise<Match[]> {
  const cacheKey = `comp_fixtures_${competitionId}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const matches = await getUpcomingMatches();
    return (matches || []).map(m => ({
      ...m,
      competitionId
    }));
  }

  try {
    const season = new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const res = await fetch(`${apiUrl}/fixtures?league=${competitionId}&season=${season}&next=20`, { headers: { "x-apisports-key": apiKey }});
    const data = await res.json();
    if (!data.response) return [];

    const matches: Match[] = data.response.map((item: any) => ({
      id: String(item.fixture.id),
      competitionId: String(item.league.id),
      competitionName: item.league.name,
      competitionCountry: item.league.country,
      competitionLogo: item.league.logo,
      homeTeam: { 
        id: String(item.teams.home.id), 
        name: item.teams.home.name, 
        shortName: item.teams.home.name.substring(0, 3).toUpperCase(),
        logoUrl: item.teams.home.logo
      },
      awayTeam: { 
        id: String(item.teams.away.id), 
        name: item.teams.away.name, 
        shortName: item.teams.away.name.substring(0, 3).toUpperCase(),
        logoUrl: item.teams.away.logo
      },
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      startTime: new Date(item.fixture.date).getTime(),
      isMock: false
    }));

    setCache(cacheKey, matches, CACHE_TTL_REGULAR);
    return matches;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return [];
  }
}

export async function getCompetitionTeams(competitionId: string): Promise<Team[]> {
  const standings = await getStandings(competitionId);
  return (standings || []).map(s => s.team);
}

export async function getCompetitionTopScorers(competitionId: string): Promise<any[]> {
  const cacheKey = `comp_topscorers_${competitionId}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    return [
      { id: '1', name: 'Erling Haaland', team: { id: '33', name: 'Man City' }, goals: 25, assists: 5, played: 26 },
      { id: '2', name: 'Mohamed Salah', team: { id: '34', name: 'Liverpool' }, goals: 18, assists: 9, played: 25 },
      { id: '3', name: 'Ollie Watkins', team: { id: '66', name: 'Aston Villa' }, goals: 16, assists: 10, played: 27 },
      { id: '4', name: 'Bukayo Saka', team: { id: '42', name: 'Arsenal' }, goals: 13, assists: 8, played: 26 },
      { id: '5', name: 'Son Heung-min', team: { id: '47', name: 'Tottenham' }, goals: 13, assists: 6, played: 23 },
    ];
  }

  try {
    const season = new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const res = await fetch(`${apiUrl}/players/topscorers?league=${competitionId}&season=${season}`, { headers: { "x-apisports-key": apiKey }});
    const data = await res.json();
    if (!data.response || data.response.length === 0) return [];

    const scorers = data.response.slice(0, 20).map((item: any) => ({
      id: String(item.player.id),
      name: item.player.name,
      photoUrl: item.player.photo,
      team: {
        id: String(item.statistics[0].team.id),
        name: item.statistics[0].team.name,
        logoUrl: item.statistics[0].team.logo
      },
      goals: item.statistics[0].goals.total || 0,
      assists: item.statistics[0].goals.assists || 0,
      played: item.statistics[0].games.appearences || 0
    }));

    setCache(cacheKey, scorers, CACHE_TTL_LONG);
    return scorers;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return [];
  }
}

export async function getCompetitionStatistics(competitionId: string): Promise<any> {
  const standings = await getStandings(competitionId);
  
  if (!standings || standings.length === 0) {
    return {
      goalsPerMatch: 0,
      totalGoals: 0,
      yellowCards: 'N/A',
      redCards: 'N/A',
      topCleanSheets: []
    };
  }

  let totalGoals = 0;
  let totalMatches = 0;

  standings.forEach(team => {
    // team.played, team.goalsFor
    totalGoals += team.goalsFor;
    totalMatches += team.played;
  });

  // Since each match involves 2 teams, total actual matches = totalMatches / 2
  const actualMatches = totalMatches > 0 ? totalMatches / 2 : 1;
  const goalsPerMatch = (totalGoals / actualMatches).toFixed(2);

  // Clean sheets not directly available from standings in API-Football without detailed stats, 
  // we'll approximate top defensive teams by fewest goals conceded
  const sortedByDefense = [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 5);
  const topCleanSheets = sortedByDefense.map(team => ({
    team: team.team,
    cleanSheets: `${team.goalsAgainst} GA` // Show Goals Against instead
  }));

  return {
    goalsPerMatch: Number(goalsPerMatch),
    totalGoals,
    yellowCards: 'N/A',
    redCards: 'N/A',
    topCleanSheets
  };
}

export async function getRecentMatches(): Promise<Match[]> {
  const cacheKey = "recent_matches";
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const data = await getGlobalRecentMatchesFallback();
    setCache(cacheKey, data, CACHE_TTL_REGULAR);
    return data;
  }

  try {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    const dateString = pastDate.toISOString().split('T')[0];
    
    // Fetch some recent matches from top leagues
    const response = await fetch(`${apiUrl}/fixtures?date=${dateString}&status=FT`, {
      headers: { "x-apisports-key": apiKey }
    });
    
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    
    if (!data.response) return [];
    
    const matches: Match[] = data.response.slice(0, 20).map((item: any) => ({
      id: String(item.fixture.id),
      competitionId: String(item.league.id),
      competitionName: item.league.name,
      competitionCountry: item.league.country,
      competitionLogo: item.league.logo,
      homeTeam: { 
        id: String(item.teams.home.id), 
        name: item.teams.home.name, 
        shortName: item.teams.home.name.substring(0, 3).toUpperCase(),
        logoUrl: item.teams.home.logo 
      },
      awayTeam: { 
        id: String(item.teams.away.id), 
        name: item.teams.away.name, 
        shortName: item.teams.away.name.substring(0, 3).toUpperCase(),
        logoUrl: item.teams.away.logo 
      },
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      status: "finished",
      startTime: new Date(item.fixture.date).getTime(),
      isMock: false
    }));

    setCache(cacheKey, matches, CACHE_TTL_REGULAR);
    return matches;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return [];
  }
}

export async function searchTeams(query: string): Promise<any[]> {
  if (!query || query.length < 2) return [];
  const cacheKey = `search_teams_${query.toLowerCase()}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    // Mock response for search
    const mockTeams = [
      { id: 'team_42', name: 'Arsenal' },
      { id: 'team_33', name: 'Manchester United' },
      { id: 'team_81', name: 'Barcelona' }
    ].filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
    
    return mockTeams.map(t => ({
      ...t,
      logoUrl: `https://media.api-sports.io/football/teams/${t.id.replace('team_', '')}.png`
    }));
  }

  try {
    const response = await fetch(`${apiUrl}/teams?search=${encodeURIComponent(query)}`, {
      headers: { "x-apisports-key": apiKey }
    });
    
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    
    if (!data.response) return [];
    
    const teams = data.response.slice(0, 15).map((item: any) => ({
      id: `team_${item.team.id}`,
      name: item.team.name,
      country: item.team.country,
      logoUrl: item.team.logo
    }));

    setCache(cacheKey, teams, CACHE_TTL_REGULAR);
    return teams;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return [];
  }
}

export async function getFavoriteFixtures(teamIds: string[]): Promise<Match[]> {
  if (!teamIds || teamIds.length === 0) return [];
  const cacheKey = `fav_fixtures_${teamIds.join('_')}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    return await getGlobalUpcomingMatchesFallback();
  }

  try {
    const allMatches: Match[] = [];
    for (const id of teamIds) {
      const cleanId = id.replace('team_', '');
      const res = await fetch(`${apiUrl}/fixtures?team=${cleanId}&next=3`, {
        headers: { "x-apisports-key": apiKey }
      });
      const data = await res.json();
      if (data.response) {
        const matches: Match[] = data.response.map((item: any) => ({
          id: String(item.fixture.id),
          competitionId: String(item.league.id),
          competitionName: item.league.name,
          competitionCountry: item.league.country,
          competitionLogo: item.league.logo,
          homeTeam: { 
            id: String(item.teams.home.id), 
            name: item.teams.home.name, 
            shortName: item.teams.home.name.substring(0, 3).toUpperCase(),
            logoUrl: item.teams.home.logo
          },
          awayTeam: { 
            id: String(item.teams.away.id), 
            name: item.teams.away.name, 
            shortName: item.teams.away.name.substring(0, 3).toUpperCase(),
            logoUrl: item.teams.away.logo
          },
          homeScore: null,
          awayScore: null,
          status: item.fixture.status.short === "FT" ? "finished" : item.fixture.status.short === "NS" ? "scheduled" : "live",
          startTime: new Date(item.fixture.date).getTime(),
          matchMinute: item.fixture.status.elapsed ? `${item.fixture.status.elapsed}'` : undefined,
        }));
        allMatches.push(...matches);
      }
    }
    
    // Sort by start time and deduplicate
    const uniqueMap = new Map();
    allMatches.forEach(m => uniqueMap.set(m.id, m));
    const sortedUnique = Array.from(uniqueMap.values()).sort((a, b) => a.startTime - b.startTime);
    
    setCache(cacheKey, sortedUnique, CACHE_TTL_REGULAR);
    return sortedUnique;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return [];
  }
}

export async function searchAll(query: string): Promise<any> {
  if (!query || query.length < 2) return { teams: [], players: [], competitions: [] };
  const cacheKey = `search_all_${query.toLowerCase()}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const qLower = query.toLowerCase();
    const res = await getGlobalMatches();
    const teamMap = new Map<string, any>();
    const compMap = new Map<string, any>();

    for (const m of res.matches) {
      for (const t of [m.homeTeam, m.awayTeam]) {
        if (t.name.toLowerCase().includes(qLower) && !teamMap.has(String(t.id))) {
          teamMap.set(String(t.id), {
            id: `team_${t.id}`,
            name: t.name,
            country: m.competition.name,
            logoUrl: t.crest,
            type: 'team',
          });
        }
      }
      if (m.competition.name.toLowerCase().includes(qLower) && !compMap.has(String(m.competition.id))) {
        compMap.set(String(m.competition.id), {
          id: `competition_${m.competition.id}`,
          name: m.competition.name,
          country: m.competition.type === 'CUP' ? 'Tournament' : 'League',
          logoUrl: m.competition.emblem,
          type: 'competition',
        });
      }
    }

    return {
      teams: Array.from(teamMap.values()).slice(0, 8),
      players: [],
      competitions: Array.from(compMap.values()).slice(0, 8),
    };
  }

  try {
    const q = encodeURIComponent(query);
    const [teamsRes, playersRes, compsRes] = await Promise.all([
      fetch(`${apiUrl}/teams?search=${q}`, { headers: { "x-apisports-key": apiKey } }),
      fetch(`${apiUrl}/players/profiles?search=${q}`, { headers: { "x-apisports-key": apiKey } }),
      fetch(`${apiUrl}/leagues?search=${q}`, { headers: { "x-apisports-key": apiKey } })
    ]);

    const [teamsData, playersData, compsData] = await Promise.all([
      teamsRes.json(),
      playersRes.json(),
      compsRes.json()
    ]);

    const teams = (teamsData.response || []).slice(0, 5).map((item: any) => ({
      id: `team_${item.team.id}`,
      name: item.team.name,
      country: item.team.country,
      logoUrl: item.team.logo,
      type: 'team'
    }));

    const players = (playersData.response || []).slice(0, 5).map((item: any) => ({
      id: `player_${item.player.id}`,
      name: item.player.name,
      country: item.player.nationality,
      logoUrl: item.player.photo,
      type: 'player'
    }));

    const competitions = (compsData.response || []).slice(0, 5).map((item: any) => ({
      id: `competition_${item.league.id}`,
      name: item.league.name,
      country: item.country.name,
      logoUrl: item.league.logo,
      type: 'competition'
    }));

    const result = { teams, players, competitions };
    setCache(cacheKey, result, CACHE_TTL_REGULAR);
    return result;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return { teams: [], players: [], competitions: [] };
  }
}
