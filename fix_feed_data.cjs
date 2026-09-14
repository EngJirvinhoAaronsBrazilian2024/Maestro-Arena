const fs = require('fs');

let serviceCode = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

const favoriteFixturesFn = `
export async function getFavoriteFixtures(teamIds: string[]): Promise<Match[]> {
  if (!teamIds || teamIds.length === 0) return [];
  const cacheKey = \`fav_fixtures_\${teamIds.join('_')}\`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.SPORTS_API_KEY;
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    return getMockUpcomingMatches();
  }

  try {
    const allMatches: Match[] = [];
    for (const id of teamIds) {
      const cleanId = id.replace('team_', '');
      const res = await fetch(\`\${apiUrl}/fixtures?team=\${cleanId}&next=3\`, {
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
          matchMinute: item.fixture.status.elapsed ? \`\${item.fixture.status.elapsed}'\` : undefined,
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
    console.error("Error fetching favorite fixtures:", error);
    return [];
  }
}
`;

if (!serviceCode.includes('getFavoriteFixtures')) {
  serviceCode += favoriteFixturesFn;
  fs.writeFileSync('src/server/services/sportsService.ts', serviceCode, 'utf8');
}

let routesCode = fs.readFileSync('src/server/routes/sportsRoutes.ts', 'utf8');
if (!routesCode.includes('getFavoriteFixtures')) {
  routesCode = routesCode.replace('searchTeams', 'searchTeams,\n  getFavoriteFixtures');
  const favRoute = `
router.get("/favorites/fixtures", async (req, res) => {
  try {
    const teamsStr = req.query.teams as string;
    if (!teamsStr) return res.json([]);
    const teams = teamsStr.split(',');
    const fixtures = await getFavoriteFixtures(teams);
    res.json(fixtures);
  } catch (error) {
    console.error("Error fetching favorite fixtures:", error);
    res.status(500).json({ error: "Failed to fetch favorite fixtures" });
  }
});
`;
  routesCode += favRoute;
  fs.writeFileSync('src/server/routes/sportsRoutes.ts', routesCode, 'utf8');
}
