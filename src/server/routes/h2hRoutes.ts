import { Router } from 'express';
import {
  createMatch,
  joinMatch,
  togglePlayerReady,
  startMatch,
  submitAnswer,
  leaveMatch,
  getOrLoadMatch,
  sanitizeMatchForUser,
  getPublicWaitingMatches,
  getUserMatchHistory
} from '../services/h2hManager.js';

const router = Router();

// Create match room
router.post('/create', async (req, res) => {
  try {
    const { userId, displayName, avatarUrl, settings } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const match = await createMatch(
      { id: userId, displayName, avatarUrl },
      settings || {}
    );
    res.json({ success: true, match: sanitizeMatchForUser(match, userId) });
  } catch (err: any) {
    console.error('Error in /api/h2h/create:', err);
    res.status(500).json({ error: err.message || 'Failed to create match' });
  }
});

// Join match by room code or ID
router.post('/join', async (req, res) => {
  try {
    const { userId, displayName, avatarUrl, roomCode } = req.body;
    if (!userId || !roomCode) {
      return res.status(400).json({ error: 'User ID and room code are required' });
    }

    const match = await joinMatch(
      { id: userId, displayName, avatarUrl },
      roomCode
    );
    res.json({ success: true, match: sanitizeMatchForUser(match, userId) });
  } catch (err: any) {
    console.error('Error in /api/h2h/join:', err);
    res.status(400).json({ error: err.message || 'Failed to join match' });
  }
});

// Quick match / public matchmaking
router.post('/quick-match', async (req, res) => {
  try {
    const { userId, displayName, avatarUrl, category, difficulty } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Try finding an open public room
    const publicRooms = await getPublicWaitingMatches();
    const candidate = publicRooms.find(r => 
      r.player1.uid !== userId && 
      (category === 'All' || r.settings.category === category || r.settings.category === 'All') &&
      (!difficulty || r.settings.difficulty === difficulty)
    );

    if (candidate) {
      const match = await joinMatch({ id: userId, displayName, avatarUrl }, candidate.id);
      return res.json({ success: true, match: sanitizeMatchForUser(match, userId), joinedExisting: true });
    }

    // Otherwise create a new public room
    const newMatch = await createMatch(
      { id: userId, displayName, avatarUrl },
      {
        category: category || 'All',
        difficulty: difficulty || 'Medium',
        isPrivate: false,
        questionCount: 5,
        timePerQuestion: 15
      }
    );
    res.json({ success: true, match: sanitizeMatchForUser(newMatch, userId), joinedExisting: false });
  } catch (err: any) {
    console.error('Error in /api/h2h/quick-match:', err);
    res.status(500).json({ error: err.message || 'Matchmaking error' });
  }
});

// Toggle readiness
router.post('/ready', async (req, res) => {
  try {
    const { userId, matchId, isReady } = req.body;
    if (!userId || !matchId) {
      return res.status(400).json({ error: 'User ID and matchId are required' });
    }

    const match = await togglePlayerReady(userId, matchId, Boolean(isReady));
    res.json({ success: true, match: sanitizeMatchForUser(match, userId) });
  } catch (err: any) {
    console.error('Error in /api/h2h/ready:', err);
    res.status(400).json({ error: err.message });
  }
});

// Start match (host only)
router.post('/start', async (req, res) => {
  try {
    const { userId, matchId } = req.body;
    if (!userId || !matchId) {
      return res.status(400).json({ error: 'User ID and matchId are required' });
    }

    const match = await startMatch(userId, matchId);
    res.json({ success: true, match: sanitizeMatchForUser(match, userId) });
  } catch (err: any) {
    console.error('Error in /api/h2h/start:', err);
    res.status(400).json({ error: err.message });
  }
});

// Submit answer for current round
router.post('/answer', async (req, res) => {
  try {
    const { userId, matchId, roundIndex, selectedOption } = req.body;
    if (!userId || !matchId || roundIndex === undefined || !selectedOption) {
      return res.status(400).json({ error: 'Missing answer submission parameters' });
    }

    const result = await submitAnswer(userId, matchId, Number(roundIndex), String(selectedOption));
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/h2h/answer:', err);
    res.status(400).json({ error: err.message });
  }
});

// Leave or cancel match
router.post('/leave', async (req, res) => {
  try {
    const { userId, matchId } = req.body;
    if (!userId || !matchId) {
      return res.status(400).json({ error: 'User ID and matchId are required' });
    }

    await leaveMatch(userId, matchId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/h2h/leave:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get match state (for polling or reconnect sync)
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.query.userId as string;

    const match = await getOrLoadMatch(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({
      match: sanitizeMatchForUser(match, userId),
      serverTime: Date.now()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get open public waiting rooms
router.get('/public', async (req, res) => {
  try {
    const rooms = await getPublicWaitingMatches();
    res.json(rooms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's multiplayer match history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await getUserMatchHistory(userId);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
