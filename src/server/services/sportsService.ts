import { Match, Competition, Team, MatchDetail, TeamDetail, PlayerDetail, MatchEvent, MatchStats, MatchLineup, Standing, Transfer, ApiFootballResponse, LeagueResponse } from "../../types/sports.js";

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
  const apiKey = process.env.SPORTS_API_KEY || "278254bf84a897c55de3a7f518d15f2e";
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

// Generate Mock Data as requested by Stage 4/5 fallback requirement
function getMockLiveMatches(): Match[] {
  return [
    {
      id: "mock_1",
      competitionId: "39",
      competitionName: "Premier League",
      competitionCountry: "England",
      competitionLogo: "https://media.api-sports.io/football/leagues/39.png",
      homeTeam: { id: "42", name: "Arsenal", shortName: "ARS", logoUrl: "https://media.api-sports.io/football/teams/42.png" },
      awayTeam: { id: "49", name: "Chelsea", shortName: "CHE", logoUrl: "https://media.api-sports.io/football/teams/49.png" },
      homeScore: 2,
      awayScore: 1,
      status: "live",
      startTime: Date.now() - 67 * 60 * 1000,
      matchMinute: "67'",
      isMock: true,
    },
    {
      id: "mock_2",
      competitionId: "140",
      competitionName: "La Liga",
      competitionCountry: "Spain",
      competitionLogo: "https://media.api-sports.io/football/leagues/140.png",
      homeTeam: { id: "541", name: "Real Madrid", shortName: "RMA", logoUrl: "https://media.api-sports.io/football/teams/541.png" },
      awayTeam: { id: "529", name: "Barcelona", shortName: "FCB", logoUrl: "https://media.api-sports.io/football/teams/529.png" },
      homeScore: 0,
      awayScore: 0,
      status: "live",
      startTime: Date.now() - 22 * 60 * 1000,
      matchMinute: "22'",
      isMock: true,
    }
  ];
}

function getMockUpcomingMatches(): Match[] {
  const now = Date.now();
  return [
    {
      id: "match_pl_1",
      competitionId: "39",
      competitionName: "Premier League",
      competitionCountry: "England",
      competitionLogo: "https://media.api-sports.io/football/leagues/39.png",
      homeTeam: { id: "40", name: "Liverpool", shortName: "LIV", logoUrl: "https://media.api-sports.io/football/teams/40.png" },
      awayTeam: { id: "50", name: "Manchester City", shortName: "MCI", logoUrl: "https://media.api-sports.io/football/teams/50.png" },
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      startTime: now + 3 * 3600 * 1000,
      isMock: true,
    },
    {
      id: "match_ll_1",
      competitionId: "140",
      competitionName: "La Liga",
      competitionCountry: "Spain",
      competitionLogo: "https://media.api-sports.io/football/leagues/140.png",
      homeTeam: { id: "541", name: "Real Madrid", shortName: "RMA", logoUrl: "https://media.api-sports.io/football/teams/541.png" },
      awayTeam: { id: "530", name: "Atletico Madrid", shortName: "ATM", logoUrl: "https://media.api-sports.io/football/teams/530.png" },
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      startTime: now + 5 * 3600 * 1000,
      isMock: true,
    },
    {
      id: "match_pl_2",
      competitionId: "39",
      competitionName: "Premier League",
      competitionCountry: "England",
      competitionLogo: "https://media.api-sports.io/football/leagues/39.png",
      homeTeam: { id: "42", name: "Arsenal", shortName: "ARS", logoUrl: "https://media.api-sports.io/football/teams/42.png" },
      awayTeam: { id: "33", name: "Manchester United", shortName: "MUN", logoUrl: "https://media.api-sports.io/football/teams/33.png" },
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      startTime: now + 7 * 3600 * 1000,
      isMock: true,
    },
    {
      id: "match_sa_1",
      competitionId: "135",
      competitionName: "Serie A",
      competitionCountry: "Italy",
      competitionLogo: "https://media.api-sports.io/football/leagues/135.png",
      homeTeam: { id: "505", name: "Inter Milan", shortName: "INT", logoUrl: "https://media.api-sports.io/football/teams/505.png" },
      awayTeam: { id: "496", name: "Juventus", shortName: "JUV", logoUrl: "https://media.api-sports.io/football/teams/496.png" },
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      startTime: now + 9 * 3600 * 1000,
      isMock: true,
    },
    {
      id: "match_bl_1",
      competitionId: "78",
      competitionName: "Bundesliga",
      competitionCountry: "Germany",
      competitionLogo: "https://media.api-sports.io/football/leagues/78.png",
      homeTeam: { id: "157", name: "Bayern Munich", shortName: "BAY", logoUrl: "https://media.api-sports.io/football/teams/157.png" },
      awayTeam: { id: "165", name: "Borussia Dortmund", shortName: "BVB", logoUrl: "https://media.api-sports.io/football/teams/165.png" },
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      startTime: now + 24 * 3600 * 1000,
      isMock: true,
    },
    {
      id: "match_ucl_1",
      competitionId: "2",
      competitionName: "Champions League",
      competitionCountry: "World",
      competitionLogo: "https://media.api-sports.io/football/leagues/2.png",
      homeTeam: { id: "529", name: "Barcelona", shortName: "FCB", logoUrl: "https://media.api-sports.io/football/teams/529.png" },
      awayTeam: { id: "85", name: "Paris Saint Germain", shortName: "PSG", logoUrl: "https://media.api-sports.io/football/teams/85.png" },
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      startTime: now + 28 * 3600 * 1000,
      isMock: true,
    }
  ];
}

export async function getMatchDetails(id: string): Promise<MatchDetail | null> {
  const cacheKey = `match_details_${id}`;
  const cached = getCached<MatchDetail>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  // Fallback to normalized match provider
  if (!apiKey) {
    const mockLive = getMockLiveMatches().find(m => m.id === id);
    const mockUpcoming = getMockUpcomingMatches().find(m => m.id === id);
    const baseMatch = mockLive || mockUpcoming;
    if (baseMatch) {
      const mockDetail: MatchDetail = {
        ...baseMatch,
        events: [
          { time: { elapsed: 15 }, team: baseMatch.homeTeam, player: { id: "p1", name: "Striker 9" }, type: "Goal", detail: "Normal Goal" },
          { time: { elapsed: 45 }, team: baseMatch.awayTeam, player: { id: "p2", name: "Defender 4" }, type: "Card", detail: "Yellow Card" }
        ],
        statistics: [
          { team: baseMatch.homeTeam, statistics: [{ type: "Ball Possession", value: "60%" }, { type: "Total Shots", value: 12 }] },
          { team: baseMatch.awayTeam, statistics: [{ type: "Ball Possession", value: "40%" }, { type: "Total Shots", value: 5 }] }
        ]
      };
      setCache(cacheKey, mockDetail, CACHE_TTL_LIVE);
      return mockDetail;
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
    const data = getMockLiveMatches();
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
      return stale || getMockLiveMatches();
    }
    
    const data = await response.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      handleApiErrorResponse(data.errors);
      const stale = getStaleCache<any>(cacheKey);
      const fallback = stale || getMockLiveMatches();
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

    setCache(cacheKey, matches, CACHE_TTL_LIVE);
    return matches;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return getMockLiveMatches();
  }
}

export async function getUpcomingMatches(): Promise<Match[]> {
  const cacheKey = "upcoming_matches";
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const data = getMockUpcomingMatches();
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
          const TOP_LEAGUE_IDS = [39, 140, 135, 78, 61, 2];
          const sorted = [...data.response]
            .filter((item: any) => item.fixture?.status?.short === "NS")
            .sort((a: any, b: any) => {
              const aIsTop = TOP_LEAGUE_IDS.includes(Number(a.league?.id)) ? 0 : 1;
              const bIsTop = TOP_LEAGUE_IDS.includes(Number(b.league?.id)) ? 0 : 1;
              return aIsTop - bIsTop;
            });

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

    const fallback = getMockUpcomingMatches();
    setCache(cacheKey, fallback, CACHE_TTL_REGULAR);
    return fallback;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return getMockUpcomingMatches();
  }
}

export async function getCompetitions(): Promise<Competition[]> {
  const cacheKey = "competitions_current";
  const cached = getCached<Competition[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  const TOP_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 848, 94, 88];

  const mockCompetitions: Competition[] = [
    { id: "39", name: "Premier League", country: "England", logoUrl: "https://media.api-sports.io/football/leagues/39.png", countryFlag: "https://media.api-sports.io/flags/gb.svg", type: "League" },
    { id: "140", name: "La Liga", country: "Spain", logoUrl: "https://media.api-sports.io/football/leagues/140.png", countryFlag: "https://media.api-sports.io/flags/es.svg", type: "League" },
    { id: "135", name: "Serie A", country: "Italy", logoUrl: "https://media.api-sports.io/football/leagues/135.png", countryFlag: "https://media.api-sports.io/flags/it.svg", type: "League" },
    { id: "78", name: "Bundesliga", country: "Germany", logoUrl: "https://media.api-sports.io/football/leagues/78.png", countryFlag: "https://media.api-sports.io/flags/de.svg", type: "League" },
    { id: "61", name: "Ligue 1", country: "France", logoUrl: "https://media.api-sports.io/football/leagues/61.png", countryFlag: "https://media.api-sports.io/flags/fr.svg", type: "League" }
  ];

  if (!apiKey) {
    setCache(cacheKey, mockCompetitions, CACHE_TTL_LONG);
    return mockCompetitions;
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
      return stale || mockCompetitions;
    }

    const data: ApiFootballResponse<LeagueResponse> = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      handleApiErrorResponse(data.errors);
      setCache(cacheKey, mockCompetitions, CACHE_TTL_LONG);
      return mockCompetitions;
    }

    const competitions: Competition[] = (data.response || [])
      .filter((item) => TOP_LEAGUES.includes(item.league.id))
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
    return stale || mockCompetitions;
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

export async function getTransfers(): Promise<Transfer[]> {
  const cacheKey = `transfers_latest`;
  const cached = getCached<Transfer[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getEffectiveSportsApiKey();
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    const mockTransfers: Transfer[] = [
      { id: "t1", date: Date.now() - 86400000, type: 'Confirmed', player: { id: "p1", name: "Kylian Mbappé" }, fromTeam: { id: "psg", name: "PSG" }, toTeam: { id: "rma", name: "Real Madrid" }, fee: "Free Transfer" },
      { id: "t2", date: Date.now() - 172800000, type: 'Rumour', player: { id: "p2", name: "Jude Bellingham" }, fromTeam: { id: "rma", name: "Real Madrid" }, toTeam: { id: "mci", name: "Manchester City" }, fee: "€150m" }
    ];
    setCache(cacheKey, mockTransfers, CACHE_TTL_LONG);
    return mockTransfers;
  }

  try {
    // API-sports transfers endpoint is /transfers. It's heavily paginated, so we just get a recent general fetch if possible,
    // or fallback to mocks. We'll use mock transfers even with API key for simplicity here if endpoint complex, 
    // but we can try to fetch team transfers. For global, we might just return mock.
    // For now, let's return a basic real API call mapping if possible, otherwise just mock.
    const res = await fetch(`${apiUrl}/transfers?team=39`, { headers: { "x-apisports-key": apiKey }});
    const data = await res.json();
    if (!data.response || data.response.length === 0) return [];

    let transfers: Transfer[] = [];
    data.response.forEach((item: any) => {
      item.transfers.slice(0, 5).forEach((t: any) => {
        transfers.push({
          id: `${item.player.id}_${t.date}`,
          date: new Date(t.date).getTime(),
          type: t.type.includes("Loan") ? 'Rumour' : 'Confirmed', // rough mapping
          player: { id: String(item.player.id), name: item.player.name },
          fromTeam: { id: String(t.teams.out.id), name: t.teams.out.name, logoUrl: t.teams.out.logo },
          toTeam: { id: String(t.teams.in.id), name: t.teams.in.name, logoUrl: t.teams.in.logo },
        });
      });
    });

    setCache(cacheKey, transfers, CACHE_TTL_LONG);
    return transfers;
  } catch (error) {
    handleApiErrorResponse(error);
    const stale = getStaleCache<any>(cacheKey);
    if (stale) return stale;
    return [];
  }
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
    // Generate some mock recent matches
    const data: Match[] = [
      {
        id: "rec_1",
        competitionId: "39",
        competitionName: "Premier League",
        competitionCountry: "England",
        homeTeam: { id: "team_42", name: "Arsenal", shortName: "ARS" },
        awayTeam: { id: "team_49", name: "Chelsea", shortName: "CHE" },
        homeScore: 3,
        awayScore: 1,
        status: "finished",
        startTime: Date.now() - 86400000,
        isMock: true
      },
      {
        id: "rec_2",
        competitionId: "140",
        competitionName: "La Liga",
        competitionCountry: "Spain",
        homeTeam: { id: "team_86", name: "Real Madrid", shortName: "RMA" },
        awayTeam: { id: "team_81", name: "Barcelona", shortName: "BAR" },
        homeScore: 2,
        awayScore: 2,
        status: "finished",
        startTime: Date.now() - 172800000,
        isMock: true
      },
      {
        id: "rec_3",
        competitionId: "135",
        competitionName: "Serie A",
        competitionCountry: "Italy",
        homeTeam: { id: "team_109", name: "Juventus", shortName: "JUV" },
        awayTeam: { id: "team_113", name: "AC Milan", shortName: "MIL" },
        homeScore: 1,
        awayScore: 0,
        status: "finished",
        startTime: Date.now() - 259200000,
        isMock: true
      }
    ];
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
    return getMockUpcomingMatches();
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
    const mockTeams = [
      { id: 'team_42', name: 'Arsenal', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/42.png', type: 'team' },
      { id: 'team_33', name: 'Manchester United', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/33.png', type: 'team' },
      { id: 'team_81', name: 'Barcelona', country: 'Spain', logoUrl: 'https://media.api-sports.io/football/teams/81.png', type: 'team' }
    ].filter(t => t.name.toLowerCase().includes(query.toLowerCase()));

    const mockPlayers = [
      { id: 'player_874', name: 'Cristiano Ronaldo', country: 'Portugal', logoUrl: 'https://media.api-sports.io/football/players/874.png', type: 'player' },
      { id: 'player_154', name: 'Lionel Messi', country: 'Argentina', logoUrl: 'https://media.api-sports.io/football/players/154.png', type: 'player' }
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

    const mockComps = [
      { id: 'competition_39', name: 'Premier League', country: 'England', logoUrl: 'https://media.api-sports.io/football/leagues/39.png', type: 'competition' },
      { id: 'competition_140', name: 'La Liga', country: 'Spain', logoUrl: 'https://media.api-sports.io/football/leagues/140.png', type: 'competition' }
    ].filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

    return { teams: mockTeams, players: mockPlayers, competitions: mockComps };
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
