import { H2HMatch, H2HMatchSettings, H2HHistoryItem } from '../types/h2h';

export interface H2HUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

/**
 * Create a new multiplayer match room
 */
export async function createH2HMatch(
  user: H2HUser,
  settings: Partial<H2HMatchSettings>
): Promise<H2HMatch> {
  const res = await fetch('/api/h2h/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      settings
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create match');
  }
  return data.match;
}

/**
 * Join an existing match room by room code or ID
 */
export async function joinH2HMatch(
  user: H2HUser,
  roomCode: string
): Promise<H2HMatch> {
  const res = await fetch('/api/h2h/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      roomCode: roomCode.trim()
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to join match');
  }
  return data.match;
}

/**
 * Quick Matchmaking / Public Lobby
 */
export async function quickMatchmake(
  user: H2HUser,
  category?: string,
  difficulty?: string
): Promise<{ match: H2HMatch; joinedExisting: boolean }> {
  const res = await fetch('/api/h2h/quick-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      category,
      difficulty
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Quick match failed');
  }
  return data;
}

/**
 * Toggle readiness status in the waiting lobby
 */
export async function setH2HReady(
  userId: string,
  matchId: string,
  isReady: boolean
): Promise<H2HMatch> {
  const res = await fetch('/api/h2h/ready', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, matchId, isReady })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update ready state');
  }
  return data.match;
}

/**
 * Start the match (Host only)
 */
export async function startH2HMatch(
  userId: string,
  matchId: string
): Promise<H2HMatch> {
  const res = await fetch('/api/h2h/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, matchId })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to start match');
  }
  return data.match;
}

/**
 * Submit answer for the active round
 */
export async function submitH2HAnswer(
  userId: string,
  matchId: string,
  roundIndex: number,
  selectedOption: string
): Promise<{ success: boolean; match: H2HMatch }> {
  const res = await fetch('/api/h2h/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, matchId, roundIndex, selectedOption })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit answer');
  }
  return data;
}

/**
 * Leave or cancel match
 */
export async function leaveH2HMatch(
  userId: string,
  matchId: string
): Promise<void> {
  try {
    await fetch('/api/h2h/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, matchId })
    });
  } catch (e) {
    console.warn('Error leaving match:', e);
  }
}

/**
 * Fetch the latest authoritative match state
 */
export async function fetchH2HMatchState(
  matchId: string,
  userId?: string
): Promise<{ match: H2HMatch; serverTime: number }> {
  const res = await fetch(`/api/h2h/match/${matchId}${userId ? `?userId=${userId}` : ''}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch match');
  }
  return data;
}

/**
 * Fetch open public matches
 */
export async function fetchPublicMatches(): Promise<H2HMatch[]> {
  try {
    const res = await fetch('/api/h2h/public');
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

/**
 * Fetch user's previous multiplayer match history
 */
export async function fetchUserH2HHistory(userId: string): Promise<H2HHistoryItem[]> {
  try {
    const res = await fetch(`/api/h2h/history/${userId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

/**
 * Real-time subscription with WebSocket + polling failover
 */
export function subscribeToH2HMatch(
  matchId: string,
  userId: string,
  onEvent: (event: string, data: any) => void
): () => void {
  let ws: WebSocket | null = null;
  let isClosed = false;
  let pollTimer: any = null;

  // 1. Setup WebSocket connection
  try {
    const isHttps = window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss:' : 'ws:';
    const wsUrl = `${wsProto}//${window.location.host}/ws/h2h?matchId=${encodeURIComponent(matchId)}&userId=${encodeURIComponent(userId)}`;
    
    ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      if (isClosed) return;
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event) {
          onEvent(parsed.event, parsed.data);
        }
      } catch (err) {
        console.warn('WebSocket message parse error:', err);
      }
    };

    ws.onerror = (err) => {
      // Silently fall back to polling if WebSocket fails
      console.log('H2H WebSocket connecting via polling fallback');
    };
  } catch (err) {
    console.warn('WebSocket init exception:', err);
  }

  // 2. Intelligent HTTP polling fallback (every 2.5s) to guarantee synchronization
  pollTimer = setInterval(async () => {
    if (isClosed) return;
    try {
      const { match, serverTime } = await fetchH2HMatchState(matchId, userId);
      onEvent('poll_sync', { match, serverTime });
    } catch (e) {
      // Ignore transient errors
    }
  }, 2500);

  // Return unsubscribe cleanup function
  return () => {
    isClosed = true;
    if (pollTimer) clearInterval(pollTimer);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}
