import { getMatches } from '../../src/server/services/footballDataService.js';

export const handler = async (event: any) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const forceRefresh = event.queryStringParameters?.refresh === 'true' || event.queryStringParameters?.refresh === '1';
    const statusFilter = event.queryStringParameters?.status?.toUpperCase();
    const competitionFilter = event.queryStringParameters?.competition;

    const data = await getMatches({ forceRefresh });
    let filteredMatches = data.matches;

    if (statusFilter) {
      if (statusFilter === 'LIVE') {
        filteredMatches = filteredMatches.filter(m => m.isLive);
      } else if (statusFilter === 'UPCOMING' || statusFilter === 'SCHEDULED') {
        filteredMatches = filteredMatches.filter(m => m.status === 'UPCOMING');
      } else if (statusFilter === 'FINISHED') {
        filteredMatches = filteredMatches.filter(m => m.status === 'FINISHED');
      }
    }

    if (competitionFilter) {
      const compCodes = competitionFilter.split(',').map(c => c.trim().toUpperCase());
      filteredMatches = filteredMatches.filter(m => 
        compCodes.includes(m.competition.code.toUpperCase()) || 
        compCodes.includes(String(m.competition.id))
      );
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': data.liveCount > 0 ? 'public, max-age=60' : 'public, max-age=180',
      },
      body: JSON.stringify({
        ...data,
        count: filteredMatches.length,
        matches: filteredMatches,
      }),
    };
  } catch (error: any) {
    console.error('[Netlify Function /matches] Error:', error);
    return {
      statusCode: error.status || 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to retrieve match data',
      }),
    };
  }
};
