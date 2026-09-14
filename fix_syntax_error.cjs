const fs = require('fs');
let code = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

code = code.replace(
  /if \(!data\.response \|\| data\.response\.length === 0\) const stale = getStaleCache<any>\(cacheKey\);\s*if \(stale\) return stale;\s*return \[\];/,
  `if (!data.response || data.response.length === 0) {
      const stale = getStaleCache<any>(cacheKey);
      if (stale) return stale;
      return [];
    }`
);

fs.writeFileSync('src/server/services/sportsService.ts', code, 'utf8');
