const fs = require('fs');
let code = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

code = code.replace(/console\.error\("Error fetching /g, 'console.warn("API fallback triggered for: Error fetching ');
code = code.replace(/console\.error\("API Errors:"/g, 'console.warn("API Rate Limit or API Errors:"');
code = code.replace(/console\.error\("Error searching teams:"/g, 'console.warn("Search fallback triggered for teams:"');
code = code.replace(/console\.error\("Error searching all:"/g, 'console.warn("Search fallback triggered for search all:"');

fs.writeFileSync('src/server/services/sportsService.ts', code, 'utf8');
