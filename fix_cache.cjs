const fs = require('fs');
let code = fs.readFileSync('src/server/services/sportsService.ts', 'utf8');

const getStaleCacheFn = `
function getStaleCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached) {
    return cached.data as T;
  }
  return null;
}
`;

if (!code.includes('function getStaleCache')) {
  code = code.replace(/function getCached[\s\S]*?return null;\n}/, `function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  return null;
}
${getStaleCacheFn}`);
}

code = code.replace(/catch \(error\) \{([\s\S]*?)return (getMock.*?|\[\]|\{.*?\}|null);/g, (match, p1, p2) => {
    return `catch (error) {${p1}const stale = getStaleCache<any>(cacheKey);\n    if (stale) return stale;\n    return ${p2};`;
});

code = code.replace(/catch \(error\) \{([\s\S]*?)throw error;/g, (match, p1) => {
    return `catch (error) {${p1}const stale = getStaleCache<any>(cacheKey);\n    if (stale) return stale;\n    throw error;`;
});

code = code.replace(/const CACHE_TTL_LIVE = 60 \* 1000;/, 'const CACHE_TTL_LIVE = 120 * 1000;');
code = code.replace(/const CACHE_TTL_REGULAR = 5 \* 60 \* 1000;/, 'const CACHE_TTL_REGULAR = 30 * 60 * 1000;');

fs.writeFileSync('src/server/services/sportsService.ts', code, 'utf8');
