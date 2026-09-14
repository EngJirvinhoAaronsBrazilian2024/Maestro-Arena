const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFavorites.ts', 'utf8');
code = code.replace("type: 'team' | 'competition';", "type: 'team' | 'competition' | 'player';");
fs.writeFileSync('src/hooks/useFavorites.ts', code, 'utf8');
