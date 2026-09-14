const fs = require('fs');

let service = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

const mockLogic = `
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
`;

// replace `return { teams: [], players: [], competitions: [] };` under `if (!apiKey) {` with the mockLogic.
service = service.replace(
  /if \(!apiKey\) {\s*return \{ teams: \[\], players: \[\], competitions: \[\] \};\s*}/,
  `if (!apiKey) { ${mockLogic} }`
);

service = service.replace(
  /console\.warn\("Search fallback triggered for search all:"\);\s*return \{ teams: \[\], players: \[\], competitions: \[\] \};/,
  `console.warn("Search fallback triggered for search all:"); ${mockLogic}`
);

fs.writeFileSync('src/server/services/sportsService.ts', service, 'utf8');
