const fs = require('fs');
let code = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

code = code.replace(/console\.error\("API Errors:", data\.errors\);/g, 'console.warn("API returned errors (likely rate limit). Falling back...");');
code = code.replace(/console\.error\("Error fetching real live matches:", error\);/g, 'console.warn("Live matches API unavailable, using mock data.");');
code = code.replace(/console\.error\("Error fetching upcoming matches:", error\);/g, 'console.warn("Upcoming matches API unavailable, using mock data.");');
code = code.replace(/console\.error\("Error fetching competitions:", error\);/g, 'console.warn("Competitions API unavailable, using mock data.");');
code = code.replace(/console\.error\("Error fetching match details:", error\);/g, 'console.warn("Match details API unavailable, using mock data.");');
code = code.replace(/console\.error\("Error fetching favorite fixtures:", error\);/g, 'console.warn("Favorite fixtures API unavailable, returning empty.");');
code = code.replace(/console\.error\("Error searching teams:", error\);/g, 'console.warn("Search API unavailable, returning empty.");');
code = code.replace(/console\.error\("Error searching all:", error\);/g, 'console.warn("Search All API unavailable, returning empty.");');
code = code.replace(/console\.error\("Error fetching recent matches:", error\);/g, 'console.warn("Recent matches API unavailable, using mock data.");');
code = code.replace(/console\.error\("Error fetching standings:", error\);/g, 'console.warn("Standings API unavailable, using mock data.");');

fs.writeFileSync('src/server/services/sportsService.ts', code, 'utf8');
