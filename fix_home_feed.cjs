const fs = require('fs');

let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

code = code.replace(
  'return liveMatches.filter(m => isFavorite(m.homeTeam.id) || isFavorite(m.awayTeam.id));',
  'return liveMatches.filter(m => isFavorite(`team_${m.homeTeam.id}`) || isFavorite(`team_${m.awayTeam.id}`) || isFavorite(m.homeTeam.id) || isFavorite(m.awayTeam.id) || favorites.some(f => f.name === m.homeTeam.name || f.name === m.awayTeam.name));'
);

code = code.replace(
  'return upcomingMatches.filter(m => isFavorite(m.homeTeam.id) || isFavorite(m.awayTeam.id));',
  'return upcomingMatches.filter(m => isFavorite(`team_${m.homeTeam.id}`) || isFavorite(`team_${m.awayTeam.id}`) || isFavorite(m.homeTeam.id) || isFavorite(m.awayTeam.id) || favorites.some(f => f.name === m.homeTeam.name || f.name === m.awayTeam.name));'
);

code = code.replace(
  'filter(m => favorites.length === 0 || (!isFavorite(m.homeTeam.id) && !isFavorite(m.awayTeam.id)))',
  'filter(m => favorites.length === 0 || (!isFavorite(`team_${m.homeTeam.id}`) && !isFavorite(`team_${m.awayTeam.id}`) && !isFavorite(m.homeTeam.id) && !isFavorite(m.awayTeam.id) && !favorites.some(f => f.name === m.homeTeam.name || f.name === m.awayTeam.name)))'
);

fs.writeFileSync('src/pages/Home.tsx', code, 'utf8');
