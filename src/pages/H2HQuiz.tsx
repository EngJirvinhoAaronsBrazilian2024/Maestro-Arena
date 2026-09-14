import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuizCategory, QuizDifficulty } from '../types/quiz';
import { H2HMatch, H2HPlayer } from '../types/h2h';
import { findOrCreateMatch, subscribeToMatch, updatePlayerProgress, updateMatchStatus, cancelMatch } from '../services/h2hService';
import { Users, Trophy, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES: QuizCategory[] = [
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'UEFA Champions League', 'World Football'
];
const DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];

export function H2HQuiz() {
  const { user } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchState, setMatchState] = useState<H2HMatch | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty>('Medium');
  const [findingMatch, setFindingMatch] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    const unsubscribe = subscribeToMatch(matchId, (match) => {
      setMatchState(match);
      if (match.status === 'finished') {
        setSelectedAnswer(null); // Reset selection
      }
    });
    return () => unsubscribe();
  }, [matchId]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Users className="h-16 w-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h2>
        <p className="text-slate-600 mb-6">You must be logged in to play Head-to-Head Quizzes.</p>
        <Link to="/login" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  const handleFindMatch = async () => {
    setFindingMatch(true);
    try {
      const id = await findOrCreateMatch(user.id, user.displayName || 'Player', selectedCategory, selectedDifficulty);
      setMatchId(id);
    } catch (error) {
      console.error('Error finding match:', error);
      alert('Failed to find a match. Please try again.');
    } finally {
      setFindingMatch(false);
    }
  };

  const handleCancelMatch = async () => {
    if (matchId && matchState?.status === 'waiting') {
      await cancelMatch(matchId);
      setMatchId(null);
      setMatchState(null);
    }
  };

  const getMyPlayerState = (): H2HPlayer | null => {
    if (!matchState) return null;
    if (matchState.player1.uid === user.id) return matchState.player1;
    if (matchState.player2?.uid === user.id) return matchState.player2;
    return null;
  };

  const getOpponentState = (): H2HPlayer | null => {
    if (!matchState) return null;
    if (matchState.player1.uid === user.id) return matchState.player2 || null;
    if (matchState.player2?.uid === user.id) return matchState.player1;
    return null;
  };

  const handleAnswer = async (answer: string) => {
    if (!matchState || !matchId) return;
    const myState = getMyPlayerState();
    if (!myState || myState.hasFinished) return;

    setSelectedAnswer(answer);
    
    const question = matchState.questions[myState.currentQuestionIndex];
    const isCorrect = answer === question.correctAnswer;
    const playerNum = matchState.player1.uid === user.id ? 1 : 2;

    const newIndex = myState.currentQuestionIndex + 1;
    const hasFinished = newIndex >= matchState.questions.length;
    const newScore = isCorrect ? myState.score + 10 : myState.score;

    await updatePlayerProgress(matchId, playerNum, {
      score: newScore,
      currentQuestionIndex: newIndex,
      hasFinished,
      answers: [...myState.answers, isCorrect]
    });

    setTimeout(() => {
      setSelectedAnswer(null);
    }, 1000);
  };

  // Check if both finished
  useEffect(() => {
    if (!matchState || !matchId) return;
    if (matchState.status === 'playing' || matchState.status === 'starting') {
      if (matchState.player1.hasFinished && matchState.player2?.hasFinished) {
        let winnerUid = null;
        if (matchState.player1.score > matchState.player2.score) {
          winnerUid = matchState.player1.uid;
        } else if (matchState.player2.score > matchState.player1.score) {
          winnerUid = matchState.player2.uid;
        }
        updateMatchStatus(matchId, 'finished', winnerUid);
      } else if (matchState.status === 'starting' && matchState.player2) {
        updateMatchStatus(matchId, 'playing');
      }
    }
  }, [matchState, matchId]);

  if (!user) return <div className="p-12 text-center text-slate-500 font-bold">Please log in to play Head-to-Head.</div>;
  if (!matchId || !matchState) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            Head-to-Head Trivia
          </h1>
          <p className="text-slate-600 mt-2">Challenge players worldwide in real-time!</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value as QuizCategory | 'All')}
                className="w-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">Any Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
              <select 
                value={selectedDifficulty} 
                onChange={e => setSelectedDifficulty(e.target.value as QuizDifficulty)}
                className="w-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <button 
              onClick={handleFindMatch}
              disabled={findingMatch}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {findingMatch ? <><Loader2 className="animate-spin h-5 w-5" /> Finding Opponent...</> : 'Find Match'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (matchState.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <h2 className="text-2xl font-bold text-slate-900">Waiting for opponent...</h2>
        <p className="text-slate-500">Category: {matchState.category} • Difficulty: {matchState.difficulty}</p>
        <button onClick={handleCancelMatch} className="text-red-500 hover:text-red-600 font-medium">Cancel Match</button>
      </div>
    );
  }

  const myState = getMyPlayerState();
  const opponentState = getOpponentState();

  if (!myState || !opponentState) return <div>Loading player states...</div>;

  if (matchState.status === 'finished') {
    const isWinner = matchState.winnerUid === user.id;
    const isDraw = matchState.winnerUid === null;

    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 bg-white rounded-xl p-8 shadow-sm">
        <Trophy className={`h-20 w-20 mx-auto ${isWinner ? 'text-yellow-500' : isDraw ? 'text-slate-400' : 'text-red-500'}`} />
        <h1 className="text-4xl font-bold text-slate-900">
          {isWinner ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat!'}
        </h1>
        
        <div className="flex items-center justify-center gap-8 py-6">
          <div className="text-center">
            <p className="text-lg font-medium text-slate-600">You</p>
            <p className="text-4xl font-bold text-blue-600">{myState.score}</p>
          </div>
          <div className="text-3xl font-bold text-slate-300">VS</div>
          <div className="text-center">
            <p className="text-lg font-medium text-slate-600">{opponentState.displayName}</p>
            <p className="text-4xl font-bold text-red-600">{opponentState.score}</p>
          </div>
        </div>

        <button 
          onClick={() => { setMatchId(null); setMatchState(null); }}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  const currentQuestion = matchState.questions[myState.currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Scoreboard */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-green-100 text-blue-600 rounded-full flex items-center justify-center font-bold">You</div>
          <div>
            <p className="font-bold text-slate-900">{myState.score} pts</p>
            <p className="text-xs text-slate-500">Q: {myState.currentQuestionIndex + 1}/{matchState.questions.length}</p>
          </div>
        </div>
        
        <div className="text-xl font-bold text-slate-300">VS</div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="font-bold text-slate-900">{opponentState.score} pts</p>
            <p className="text-xs text-slate-500">Q: {opponentState.currentQuestionIndex + 1}/{matchState.questions.length}</p>
          </div>
          <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
            {opponentState.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {myState.hasFinished ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Waiting for opponent to finish...</h2>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-blue-800 mb-6">
            {currentQuestion.category} • {currentQuestion.difficulty}
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-8">{currentQuestion.question}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              
              let btnClass = "bg-slate-50  hover:bg-slate-100 border-slate-200  text-slate-800 ";
              
              if (selectedAnswer) {
                if (isSelected) {
                  btnClass = isCorrect 
                    ? "bg-green-100 border-green-500 text-green-800  " 
                    : "bg-red-100 border-red-500 text-red-800  ";
                } else if (isCorrect) {
                  btnClass = "bg-green-100 border-green-500 text-green-800  ";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={`p-4 rounded-xl border-2 font-medium transition-all ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
