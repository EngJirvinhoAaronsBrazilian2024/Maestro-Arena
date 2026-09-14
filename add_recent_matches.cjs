const fs = require('fs');
let serviceCode = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

const recentMatchesFn = `
export async function getRecentMatches(): Promise<Match[]> {
  const cacheKey = "recent_matches";
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.SPORTS_API_KEY;
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
    const response = await fetch(\`\${apiUrl}/fixtures?date=\${dateString}&status=FT\`, {
      headers: { "x-apisports-key": apiKey }
    });
    
    if (!response.ok) throw new Error(\`API returned \${response.status}\`);
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
    console.error("Error fetching recent matches:", error);
    return [];
  }
}
`;

serviceCode += recentMatchesFn;
fs.writeFileSync('src/server/services/sportsService.ts', serviceCode, 'utf8');

// Update sportsRoutes.ts
let routesCode = fs.readFileSync('src/server/routes/sportsRoutes.ts', 'utf8');
routesCode = routesCode.replace(
  'getUpcomingMatches,',
  'getUpcomingMatches,\n  getRecentMatches,'
);

const recentRoute = `
router.get("/recent", async (req, res) => {
  try {
    const matches = await getRecentMatches();
    res.json(matches);
  } catch (error) {
    console.error("Error fetching recent matches:", error);
    res.status(500).json({ error: "Failed to fetch recent matches" });
  }
});
`;

routesCode = routesCode.replace(
  'router.get("/upcoming",',
  recentRoute + '\nrouter.get("/upcoming",'
);

fs.writeFileSync('src/server/routes/sportsRoutes.ts', routesCode, 'utf8');

// Update hooks.ts
let hooksCode = fs.readFileSync('src/services/sports/hooks.ts', 'utf8');

const recentHook = `
export function useRecentMatches() {
  const { data, error, isLoading } = useSWR<Match[]>(
    \`\${API_BASE_URL}/recent\`,
    fetcher,
    { refreshInterval: 300000, dedupingInterval: 60000 }
  );
  return {
    matches: data,
    isLoading,
    isError: error
  };
}
`;

hooksCode += recentHook;
fs.writeFileSync('src/services/sports/hooks.ts', hooksCode, 'utf8');

