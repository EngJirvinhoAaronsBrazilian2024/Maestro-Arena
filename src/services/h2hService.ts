import { insforge } from '../lib/insforge';
import { H2HMatch, H2HPlayer } from '../types/h2h';
import { QuizCategory, QuizDifficulty } from '../types/quiz';
import { getQuizQuestions } from './quizService';

export async function findOrCreateMatch(
  uid: string, 
  displayName: string, 
  category: QuizCategory | 'All', 
  difficulty: QuizDifficulty
): Promise<string> {
  // Try to find a waiting match
  const { data: waitingMatches } = await insforge.database
    .from('h2h_matches')
    .select('*')
    .eq('status', 'waiting')
    .eq('category', category)
    .eq('difficulty', difficulty)
    .order('created_at', { ascending: true })
    .limit(1);

  if (waitingMatches && waitingMatches.length > 0) {
    const matchDoc = waitingMatches[0];
    const matchData = { id: matchDoc.id, ...matchDoc } as any;
    
    // Don't join own match
    if (matchData.player1.uid !== uid) {
      const { error } = await insforge.database
        .from('h2h_matches')
        .update({
          status: 'starting',
          player2: {
            uid,
            displayName,
            score: 0,
            currentQuestionIndex: 0,
            isReady: true,
            hasFinished: false,
            answers: []
          }
        })
        .eq('id', matchDoc.id);
      
      if (!error) return matchDoc.id;
    }
  }

  // Create new match if none found or only own match found
  const questions = await getQuizQuestions(category, difficulty, 5); // 5 questions for fast H2H

  const { data: newDoc, error } = await insforge.database
    .from('h2h_matches')
    .insert([{
      status: 'waiting',
      category,
      difficulty,
      questions,
      created_at: Date.now(),
      player1: {
        uid,
        displayName,
        score: 0,
        currentQuestionIndex: 0,
        isReady: true,
        hasFinished: false,
        answers: []
      }
    }])
    .select()
    .single();

  if (error) throw error;
  return newDoc.id;
}

export function subscribeToMatch(matchId: string, callback: (match: H2HMatch) => void) {
  const channelName = `match:${matchId}`;
  
  // Connect and subscribe
  insforge.realtime.connect().then(() => {
    insforge.realtime.subscribe(channelName).catch(console.error);
  });

  const handler = (payload: any) => {
    if (payload && payload.id) {
      // payload represents the updated row data
      callback({ id: payload.id, ...payload } as H2HMatch);
    }
  };

  insforge.realtime.on('match_updated', handler);
    
  return () => {
    insforge.realtime.off('match_updated', handler);
    insforge.realtime.unsubscribe(channelName);
  };
}

export async function updatePlayerProgress(
  matchId: string, 
  playerNum: 1 | 2, 
  updates: Partial<H2HPlayer>
) {
  // First we need to get the current state because of JSONB
  const { data } = await insforge.database
    .from('h2h_matches')
    .select(`player${playerNum}`)
    .eq('id', matchId)
    .single();
    
  if (data) {
    const playerKey = `player${playerNum}`;
    const currentPlayer = data[playerKey] || {};
    
    await insforge.database
      .from('h2h_matches')
      .update({
        [playerKey]: { ...currentPlayer, ...updates }
      })
      .eq('id', matchId);
  }
}

export async function updateMatchStatus(matchId: string, status: H2HMatch['status'], winnerUid?: string | null) {
  const updates: any = { status };
  if (winnerUid !== undefined) updates.winner_uid = winnerUid;
  
  await insforge.database.from('h2h_matches').update(updates).eq('id', matchId);
}

export async function cancelMatch(matchId: string) {
  await insforge.database.from('h2h_matches').delete().eq('id', matchId);
}
