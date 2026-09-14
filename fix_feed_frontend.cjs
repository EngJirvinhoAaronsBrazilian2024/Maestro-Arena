const fs = require('fs');

let hooksCode = fs.readFileSync('src/services/sports/hooks.ts', 'utf8');
const favHooksFn = `
export function useFavoriteFixtures(teamIds: string[]) {
  const query = teamIds.length > 0 ? teamIds.join(',') : '';
  const { data, error, isLoading } = useSWR<any[]>(
    query ? \`\${API_BASE_URL}/favorites/fixtures?teams=\${query}\` : null,
    fetcher
  );
  return {
    fixtures: data || [],
    isLoading,
    isError: error
  };
}
`;
if (!hooksCode.includes('useFavoriteFixtures')) {
  hooksCode += favHooksFn;
  fs.writeFileSync('src/services/sports/hooks.ts', hooksCode, 'utf8');
}

let homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');
if (!homeCode.includes('useFavoriteFixtures')) {
  homeCode = homeCode.replace('import { useLiveMatches, useUpcomingMatches, useSearchTeams }', 'import { useLiveMatches, useUpcomingMatches, useSearchTeams, useFavoriteFixtures }');
  
  // replace myFeedUpcoming logic
  const myFeedUpcomingRegex = /const myFeedUpcoming = useMemo\(\(\) => \{[\s\S]*?\}, \[upcomingMatches, favorites\]\);/;
  const newMyFeedUpcoming = `
  const favoriteTeamIds = useMemo(() => favorites.filter(f => f.type === 'team').map(f => f.id.replace('team_', '')), [favorites]);
  const { fixtures: favoriteFixtures } = useFavoriteFixtures(favoriteTeamIds);
  
  const myFeedUpcoming = useMemo(() => {
    if (!favoriteFixtures || favoriteFixtures.length === 0) return [];
    return favoriteFixtures.filter((m: any) => m.status === 'scheduled');
  }, [favoriteFixtures]);
  
  const myFeedLive = useMemo(() => {
    if (!favoriteFixtures || favoriteFixtures.length === 0) return [];
    return favoriteFixtures.filter((m: any) => m.status === 'live');
  }, [favoriteFixtures]);
  `;
  
  homeCode = homeCode.replace(myFeedUpcomingRegex, newMyFeedUpcoming);
  
  // replace myFeedLive old definition
  const myFeedLiveRegex = /const myFeedLive = useMemo\(\(\) => \{[\s\S]*?\}, \[liveMatches, favorites\]\);/;
  homeCode = homeCode.replace(myFeedLiveRegex, '');
  
  fs.writeFileSync('src/pages/Home.tsx', homeCode, 'utf8');
}

let myFeedCode = fs.readFileSync('src/pages/MyFeed.tsx', 'utf8');
if (!myFeedCode.includes('useFavoriteFixtures')) {
  myFeedCode = myFeedCode.replace('import { useLiveMatches, useUpcomingMatches }', 'import { useLiveMatches, useUpcomingMatches, useFavoriteFixtures }');
  
  const favoriteMatchesRegex = /const favoriteMatches = useMemo\(\(\) => \{[\s\S]*?\}, \[liveMatches, upcomingMatches, isFavorite, favorites\]\);/;
  const newFavoriteMatches = `
  const favoriteTeamIds = useMemo(() => favorites.filter(f => f.type === 'team').map(f => f.id.replace('team_', '')), [favorites]);
  const { fixtures: favoriteFixtures } = useFavoriteFixtures(favoriteTeamIds);
  
  const favoriteMatches = favoriteFixtures || [];
  `;
  
  myFeedCode = myFeedCode.replace(favoriteMatchesRegex, newFavoriteMatches);
  
  fs.writeFileSync('src/pages/MyFeed.tsx', myFeedCode, 'utf8');
}
