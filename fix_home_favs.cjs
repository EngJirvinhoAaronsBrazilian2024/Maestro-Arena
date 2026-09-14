const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldFavs = `<img src={\`https://media.api-sports.io/football/teams/\${team.id.replace('team_', '').replace('_fr', '')}.png\`} alt={team.name} className="w-5 h-5 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />`;
const newFavs = `{team.logo ? <img src={team.logo} alt={team.name} className="w-5 h-5 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <img src={\`https://media.api-sports.io/football/teams/\${team.id.replace('team_', '').replace('_fr', '')}.png\`} alt={team.name} className="w-5 h-5 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />}`;

code = code.replace(oldFavs, newFavs);
fs.writeFileSync('src/pages/Home.tsx', code, 'utf8');
