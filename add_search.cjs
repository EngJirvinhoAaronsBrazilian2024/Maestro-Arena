const fs = require('fs');

let serviceCode = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

const searchTeamsFn = `
export async function searchTeams(query: string): Promise<any[]> {
  if (!query || query.length < 2) return [];
  const cacheKey = \`search_teams_\${query.toLowerCase()}\`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.SPORTS_API_KEY;
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
      logoUrl: \`https://media.api-sports.io/football/teams/\${t.id.replace('team_', '')}.png\`
    }));
  }

  try {
    const response = await fetch(\`\${apiUrl}/teams?search=\${encodeURIComponent(query)}\`, {
      headers: { "x-apisports-key": apiKey }
    });
    
    if (!response.ok) throw new Error(\`API returned \${response.status}\`);
    const data = await response.json();
    
    if (!data.response) return [];
    
    const teams = data.response.slice(0, 15).map((item: any) => ({
      id: \`team_\${item.team.id}\`,
      name: item.team.name,
      country: item.team.country,
      logoUrl: item.team.logo
    }));

    setCache(cacheKey, teams, CACHE_TTL_REGULAR);
    return teams;
  } catch (error) {
    console.error("Error searching teams:", error);
    return [];
  }
}
`;

if (!serviceCode.includes('searchTeams')) {
  serviceCode += searchTeamsFn;
  fs.writeFileSync('src/server/services/sportsService.ts', serviceCode, 'utf8');
}

let routesCode = fs.readFileSync('src/server/routes/sportsRoutes.ts', 'utf8');

if (!routesCode.includes('searchTeams')) {
  routesCode = routesCode.replace(
    'getCompetitionStatistics',
    'getCompetitionStatistics,\n  searchTeams'
  );

  const searchRoute = `
router.get("/teams/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const teams = await searchTeams(q);
    res.json(teams);
  } catch (error) {
    console.error("Error searching teams:", error);
    res.status(500).json({ error: "Failed to search teams" });
  }
});
`;

  routesCode = routesCode.replace(
    'router.get("/teams/:id",',
    searchRoute + '\nrouter.get("/teams/:id",'
  );

  fs.writeFileSync('src/server/routes/sportsRoutes.ts', routesCode, 'utf8');
}
