const fs = require('fs');

let service = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

const searchAllFn = `
export async function searchAll(query: string): Promise<any> {
  if (!query || query.length < 2) return { teams: [], players: [], competitions: [] };
  const cacheKey = \`search_all_\${query.toLowerCase()}\`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.SPORTS_API_KEY;
  const apiUrl = process.env.SPORTS_API_URL || "https://v3.football.api-sports.io";

  if (!apiKey) {
    return { teams: [], players: [], competitions: [] };
  }

  try {
    const q = encodeURIComponent(query);
    const [teamsRes, playersRes, compsRes] = await Promise.all([
      fetch(\`\${apiUrl}/teams?search=\${q}\`, { headers: { "x-apisports-key": apiKey } }),
      fetch(\`\${apiUrl}/players/profiles?search=\${q}\`, { headers: { "x-apisports-key": apiKey } }),
      fetch(\`\${apiUrl}/leagues?search=\${q}\`, { headers: { "x-apisports-key": apiKey } })
    ]);

    const [teamsData, playersData, compsData] = await Promise.all([
      teamsRes.json(),
      playersRes.json(),
      compsRes.json()
    ]);

    const teams = (teamsData.response || []).slice(0, 5).map((item: any) => ({
      id: \`team_\${item.team.id}\`,
      name: item.team.name,
      country: item.team.country,
      logoUrl: item.team.logo,
      type: 'team'
    }));

    const players = (playersData.response || []).slice(0, 5).map((item: any) => ({
      id: \`player_\${item.player.id}\`,
      name: item.player.name,
      country: item.player.nationality,
      logoUrl: item.player.photo,
      type: 'player'
    }));

    const competitions = (compsData.response || []).slice(0, 5).map((item: any) => ({
      id: \`competition_\${item.league.id}\`,
      name: item.league.name,
      country: item.country.name,
      logoUrl: item.league.logo,
      type: 'competition'
    }));

    const result = { teams, players, competitions };
    setCache(cacheKey, result, CACHE_TTL_REGULAR);
    return result;
  } catch (error) {
    console.error("Error searching all:", error);
    return { teams: [], players: [], competitions: [] };
  }
}
`;

if (!service.includes('searchAll(')) {
  service += searchAllFn;
  fs.writeFileSync('src/server/services/sportsService.ts', service, 'utf8');
}

let routes = fs.readFileSync('src/server/routes/sportsRoutes.ts', 'utf8');
if (!routes.includes('searchAll')) {
  routes = routes.replace('searchTeams,', 'searchTeams,\n  searchAll,');
  const searchRoute = `
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ teams: [], players: [], competitions: [] });
    const results = await searchAll(q);
    res.json(results);
  } catch (error) {
    console.error("Error searching all:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});
`;
  routes += searchRoute;
  fs.writeFileSync('src/server/routes/sportsRoutes.ts', routes, 'utf8');
}
