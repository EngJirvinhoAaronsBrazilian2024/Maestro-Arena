const fs = require('fs');
let code = fs.readFileSync('src/services/sports/hooks.ts', 'utf8');

const hookCode = `
export function useSearchAll(query: string) {
  const { data, error, isLoading } = useSWR<any>(
    query && query.length > 1 ? \`\${API_BASE_URL}/search?q=\${encodeURIComponent(query)}\` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    results: data || { teams: [], players: [], competitions: [] },
    isLoading,
    isError: error
  };
}
`;
if (!code.includes('useSearchAll')) {
  code += hookCode;
  fs.writeFileSync('src/services/sports/hooks.ts', code, 'utf8');
}
