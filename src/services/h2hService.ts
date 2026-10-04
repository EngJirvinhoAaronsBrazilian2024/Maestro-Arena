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

  if (!res.ok) {
    let errMessage = 'Failed to create match';
    try {
      const data = await res.json();
      errMessage = data.error || errMessage;
    } catch {
      errMessage = `Server returned status ${res.status}`;
    }
    throw new Error(errMessage);
  }

  const data = await res.json();
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
      roomCode: roomCode.trim().toUpperCase()
    })
  });

  if (!res.ok) {
    let errMessage = 'Failed to join match';
    try {
      const data = await res.json();
      errMessage = data.error || errMessage;
    } catch {
      errMessage = `Server returned status ${res.status}`;
    }
    throw new Error(errMessage);
  }

  const data = await res.json();
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

// Active socket reference and clock synchronization offset
let currentH2HSocket: WebSocket | null = null;
export let serverTimeOffset = 0;

export function getSynchronizedServerTime(): number {
  return Date.now() + serverTimeOffset;
}

export function sendH2HSocketMessage(action: string, payload: Record<string, any>): boolean {
  if (currentH2HSocket && currentH2HSocket.readyState === WebSocket.OPEN) {
    try {
      currentH2HSocket.send(JSON.stringify({ action, ...payload }));
      return true;
    } catch (e) {
      console.warn('Failed to send H2H socket message:', e);
    }
  }
  return false;
}

/**
 * Submit answer for the active round with dual-channel high-speed dispatch
 */
export async function submitH2HAnswer(
  userId: string,
  matchId: string,
  roundIndex: number,
  selectedOption: string
): Promise<{ success: boolean; match?: H2HMatch }> {
  // 1. High-speed WebSocket fast-path (< 5ms transmission)
  const sentViaWs = sendH2HSocketMessage('answer', {
    userId,
    matchId,
    roundIndex,
    selectedOption
  });

  // 2. Dual-channel HTTP fallback
  try {
    const res = await fetch('/api/h2h/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, matchId, roundIndex, selectedOption })
    });

    const data = await res.json();
    if (!res.ok && !sentViaWs) {
      throw new Error(data.error || 'Failed to submit answer');
    }
    return data;
  } catch (err) {
    if (sentViaWs) {
      return { success: true };
    }
    throw err;
  }
}

/**
 * Leave or cancel match
 */
export async function leaveH2HMatch(
  userId: string,
  matchId: string
): Promise<void> {
  sendH2HSocketMessage('leave', { userId, matchId });
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
 * Real-time subscription with WebSocket + adaptive fast polling failover
 */
export function subscribeToH2HMatch(
  matchId: string,
  userId: string,
  onEvent: (event: string, data: any) => void
): () => void {
  let ws: WebSocket | null = null;
  let isClosed = false;
  let pollTimer: any = null;
  let pingTimer: any = null;
  let reconnectTimer: any = null;

  const connectWebSocket = () => {
    if (isClosed) return;
    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProto = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProto}//${window.location.host}/ws/h2h?matchId=${encodeURIComponent(matchId)}&userId=${encodeURIComponent(userId)}`;
      
      ws = new WebSocket(wsUrl);
      currentH2HSocket = ws;

      ws.onopen = () => {
        // Ping immediately on connection to sync server time
        try {
          ws?.send(JSON.stringify({ action: 'ping', clientTime: Date.now() }));
        } catch (e) {}
      };

      ws.onmessage = (event) => {
        if (isClosed) return;
        try {
          const parsed = JSON.parse(event.data);
          
          // Calculate server time offset
          if (parsed.data?.serverTime) {
            serverTimeOffset = parsed.data.serverTime - Date.now();
          }

          if (parsed.event === 'pong') {
            return; // Heartbeat response handled
          }

          if (parsed.event) {
            onEvent(parsed.event, parsed.data);
          }
        } catch (err) {
          console.warn('WebSocket message parse error:', err);
        }
      };

      ws.onclose = () => {
        if (currentH2HSocket === ws) {
          currentH2HSocket = null;
        }
        // Auto-reconnect after 1.5s if not closed by user
        if (!isClosed) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectWebSocket, 1500);
        }
      };

      ws.onerror = () => {
        if (currentH2HSocket === ws) {
          currentH2HSocket = null;
        }
      };
    } catch (err) {
      console.warn('WebSocket init exception:', err);
    }
  };

  connectWebSocket();

  // Keepalive and clock sync ping every 8 seconds
  pingTimer = setInterval(() => {
    if (isClosed) return;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ action: 'ping', clientTime: Date.now() }));
      } catch (e) {}
    }
  }, 8000);

  // Dynamic adaptive HTTP polling fallback:
  // - 5000ms safety net when WebSocket is connected and healthy
  // - 800ms ultra-fast polling if WebSocket is disconnected/connecting so gameplay never drops a beat
  let isPollingRunning = false;
  const runPoll = async () => {
    if (isClosed || isPollingRunning) return;
    isPollingRunning = true;
    try {
      const { match, serverTime } = await fetchH2HMatchState(matchId, userId);
      if (serverTime) {
        serverTimeOffset = serverTime - Date.now();
      }
      onEvent('poll_sync', { match, serverTime });
    } catch (e) {
      // Ignore transient errors
    } finally {
      isPollingRunning = false;
      if (!isClosed) {
        const isWsHealthy = ws && ws.readyState === WebSocket.OPEN;
        const nextInterval = isWsHealthy ? 4000 : 800;
        pollTimer = setTimeout(runPoll, nextInterval);
      }
    }
  };

  pollTimer = setTimeout(runPoll, 1000);

  // Return unsubscribe cleanup function
  return () => {
    isClosed = true;
    if (pollTimer) clearTimeout(pollTimer);
    if (pingTimer) clearInterval(pingTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (currentH2HSocket === ws) {
      currentH2HSocket = null;
    }
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}
