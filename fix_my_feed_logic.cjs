const fs = require('fs');
let code = fs.readFileSync('src/pages/MyFeed.tsx', 'utf8');

const oldFilter = `return all.filter(m => 
      isFavorite(\`team_\${m.homeTeam.id}\`) || 
      isFavorite(\`team_\${m.awayTeam.id}\`) || 
      isFavorite(\`competition_\${m.competitionId}\`) ||
      favorites.some(f => f.name === m.homeTeam.name || f.name === m.awayTeam.name || f.name === m.competitionName)
    );`;

const newFilter = `return all.filter(m => 
      isFavorite(\`team_\${m.homeTeam.id}\`) || 
      isFavorite(\`team_\${m.awayTeam.id}\`) || 
      isFavorite(m.homeTeam.id) || 
      isFavorite(m.awayTeam.id) || 
      isFavorite(\`competition_\${m.competitionId}\`) ||
      favorites.some(f => f.name === m.homeTeam.name || f.name === m.awayTeam.name || f.name === m.competitionName)
    );`;

code = code.replace(oldFilter, newFilter);
fs.writeFileSync('src/pages/MyFeed.tsx', code, 'utf8');
