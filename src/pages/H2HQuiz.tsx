import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createH2HMatch,
  joinH2HMatch,
  quickMatchmake,
  setH2HReady,
  startH2HMatch,
  submitH2HAnswer,
  leaveH2HMatch,
  fetchH2HMatchState,
  fetchPublicMatches,
  fetchUserH2HHistory,
  subscribeToH2HMatch,
  getSynchronizedServerTime
} from '../services/h2hService';
import { H2HMatch, H2HMatchSettings, H2HHistoryItem } from '../types/h2h';
import { QuizCategory, QuizDifficulty } from '../types/quiz';
import {
  Swords,
  Users,
  Trophy,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Flame,
  Award,
  Timer,
  ChevronRight,
  LogIn,
  Zap,
  Globe,
  Lock,
  Layers,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/Card';
import { toast } from 'sonner';

const CATEGORIES: { label: string; value: QuizCategory | 'All' }[] = [
  { label: 'All Football Trivia', value: 'All' },
  { label: 'FIFA World Cup', value: 'FIFA World Cup' },
  { label: 'UEFA Champions League', value: 'UEFA Champions League' },
  { label: 'Premier League', value: 'Premier League' },
  { label: 'La Liga', value: 'La Liga' },
  { label: 'Serie A', value: 'Serie A' },
  { label: 'Bundesliga', value: 'Bundesliga' },
  { label: 'African Football (AFCON)', value: 'African Football' },
  { label: 'World Football', value: 'World Football' },
  { label: 'Famous Managers', value: 'Famous Managers' },
  { label: 'Football Rules & VAR', value: 'Football Rules' },
  { label: 'Football Records & Stats', value: 'Football Records' }
];

const DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];
const QUESTION_COUNTS = [5, 10, 15, 20];
const TIME_LIMITS = [15, 30, 45, 60];

export function H2HQuiz() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Match & Room State
  const [match, setMatch] = useState<H2HMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Lobby lists
  const [publicRooms, setPublicRooms] = useState<H2HMatch[]>([]);
  const [history, setHistory] = useState<H2HHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Create match modal state (Default time per question is 60s / 1 min)
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configCategory, setConfigCategory] = useState<QuizCategory | 'All'>('All');
  const [configDifficulty, setConfigDifficulty] = useState<QuizDifficulty>('Medium');
  const [configCount, setConfigCount] = useState<number>(5);
  const [configTime, setConfigTime] = useState<number>(60);
  const [configPrivate, setConfigPrivate] = useState<boolean>(true);

  // Active round state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [opponentHasAnswered, setOpponentHasAnswered] = useState<boolean>(false);
  const [startingCountdown, setStartingCountdown] = useState<number>(3);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const currentUserId = useMemo(() => {
    if (user?.id) return user.id;
    if ((user as any)?.uid) return (user as any).uid;
    if (userData?.id) return userData.id;
    let stored = localStorage.getItem('maestro_h2h_uid');
    if (!stored) {
      stored = 'player_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('maestro_h2h_uid', stored);
    }
    return stored;
  }, [user, userData]);

  const currentUserDisplayName = useMemo(() => {
    return (
      userData?.displayName ||
      user?.displayName ||
      user?.email?.split('@')[0] ||
      localStorage.getItem('maestro_player_name') ||
      'Trivia Maestro'
    );
  }, [userData, user]);

  // 1. Check for Room Code in URL query (e.g. ?room=ABCD12 or ?join=ABCD12)
  useEffect(() => {
    const code = searchParams.get('room') || searchParams.get('join');
    if (code) {
      setRoomCodeInput(code.toUpperCase());
    }
  }, [searchParams]);

  // 2. Load Public Rooms & User History on mount
  useEffect(() => {
    loadLobbyData();
    const lobbyInterval = setInterval(loadLobbyData, 10000);
    return () => clearInterval(lobbyInterval);
  }, [currentUserId]);

  const loadLobbyData = async () => {
    fetchPublicMatches().then(setPublicRooms).catch(() => {});
    if (currentUserId) {
      setHistoryLoading(true);
      fetchUserH2HHistory(currentUserId)
        .then(setHistory)
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
  };

  // 3. Subscribe to Real-time events when match is active
  useEffect(() => {
    if (!match?.id || !currentUserId) return;

    // Clean up any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsub = subscribeToH2HMatch(match.id, currentUserId, (event, data) => {
      handleMatchEvent(event, data);
    });
    unsubscribeRef.current = unsub;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [match?.id, currentUserId]);

  // Handle incoming real-time match events
  const handleMatchEvent = (event: string, data: any) => {
    if (data?.match) {
      setMatch(data.match);
    }

    switch (event) {
      case 'init_sync':
        // Fresh state synchronized from server
        break;
      case 'player_joined':
        toast.success(`${data.joinedPlayer?.displayName || 'An opponent'} joined the room!`);
        break;
      case 'match_starting':
        // Synchronized countdown starting for both players simultaneously
        setStartingCountdown(3);
        setSelectedOption(null);
        setHasSubmitted(false);
        setOpponentHasAnswered(false);
        break;
      case 'match_started':
        toast.info("Match is live! Question 1 revealed!", { duration: 1500 });
        setSelectedOption(null);
        setHasSubmitted(false);
        setOpponentHasAnswered(false);
        break;
      case 'next_question':
        setSelectedOption(null);
        setHasSubmitted(false);
        setOpponentHasAnswered(false);
        break;
      case 'answer_submitted':
        // Immediate real-time reflection when opponent locks in their answer
        if (data.userId && data.userId !== currentUserId) {
          setOpponentHasAnswered(true);
        }
        break;
      case 'round_complete':
        break;
      case 'match_finished':
        toast.success("Match complete! Calculating results...");
        break;
      case 'player_left':
        toast.warning("Opponent has left or disconnected.");
        break;
      case 'match_cancelled':
        toast.error(data.reason || "Match was cancelled.");
        setMatch(null);
        break;
    }
  };

  // 4. Synchronized starting countdown timer
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    if (match?.status === 'starting' && match.countdownDeadline) {
      const updateCountdown = () => {
        const now = getSynchronizedServerTime();
        const diffMs = match.countdownDeadline! - now;
        const secs = Math.max(0, Math.ceil(diffMs / 1000));
        setStartingCountdown(secs);
      };
      updateCountdown();
      countdownIntervalRef.current = setInterval(updateCountdown, 100);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [match?.status, match?.countdownDeadline]);

  // 5. Client countdown timer synced with authoritative roundDeadline
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (match?.status === 'playing' && match.roundDeadline) {
      const updateTimer = () => {
        const now = getSynchronizedServerTime();
        const remaining = Math.max(0, Math.ceil((match.roundDeadline! - now) / 1000));
        setTimeLeft(remaining);
      };
      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 200);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [match?.status, match?.roundDeadline, match?.currentRound]);

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------

  const handleCreateRoom = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to create a multiplayer room.");
      return;
    }

    setLoading(true);
    try {
      const created = await createH2HMatch(
        { id: currentUserId, displayName: currentUserDisplayName },
        {
          category: configCategory,
          difficulty: configDifficulty,
          questionCount: configCount,
          timePerQuestion: configTime,
          isPrivate: configPrivate
        }
      );
      setMatch(created);
      setIsConfigOpen(false);
      toast.success(`Room created! Room Code: ${created.roomCode}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create match");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUserId) {
      toast.error("Please sign in to join a multiplayer room.");
      return;
    }
    if (!roomCodeInput.trim()) {
      toast.error("Please enter a 6-letter room code.");
      return;
    }

    setLoading(true);
    try {
      const joined = await joinH2HMatch(
        { id: currentUserId, displayName: currentUserDisplayName },
        roomCodeInput.trim()
      );
      setMatch(joined);
      toast.success("Joined match room successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMatch = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to find a match.");
      return;
    }

    setLoading(true);
    try {
      const res = await quickMatchmake(
        { id: currentUserId, displayName: currentUserDisplayName },
        'All',
        'Medium'
      );
      setMatch(res.match);
      if (res.joinedExisting) {
        toast.success("Found an open match! Opponent is ready.");
      } else {
        toast.info("Created public room. Waiting for an opponent to join...");
      }
    } catch (err: any) {
      toast.error(err.message || "Quick match failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReady = async () => {
    if (!match || !currentUserId) return;
    const isPlayer1 = match.player1.uid === currentUserId;
    const currentReady = isPlayer1 ? match.player1.isReady : match.player2?.isReady;

    try {
      const updated = await setH2HReady(currentUserId, match.id, !currentReady);
      setMatch(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle ready status");
    }
  };

  const handleStartMatch = async () => {
    if (!match || !currentUserId) return;
    try {
      const started = await startH2HMatch(currentUserId, match.id);
      setMatch(started);
    } catch (err: any) {
      toast.error(err.message || "Failed to start match");
    }
  };

  const handleSelectAnswer = async (option: string) => {
    if (!match || !currentUserId || hasSubmitted || match.status !== 'playing') return;

    setSelectedOption(option);
    setHasSubmitted(true);

    try {
      const result = await submitH2HAnswer(
        currentUserId,
        match.id,
        match.currentRound,
        option
      );
      if (result.match) {
        setMatch(result.match);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit answer");
      setHasSubmitted(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!match || !currentUserId) return;
    if (confirm("Are you sure you want to leave this match?")) {
      await leaveH2HMatch(currentUserId, match.id);
      setMatch(null);
      setSelectedOption(null);
      setHasSubmitted(false);
      loadLobbyData();
    }
  };

  const handleCopyCode = () => {
    if (!match?.roomCode) return;
    navigator.clipboard.writeText(match.roomCode);
    setCopiedCode(true);
    toast.success("Room code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = () => {
    if (!match?.roomCode) return;
    const url = `${window.location.origin}/quiz/h2h?room=${match.roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my Football Quiz on Maestro Arena!',
        text: `Use room code ${match.roomCode} to challenge me in a 1v1 Head-to-Head Football Trivia battle!`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Invitation link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Helper variables
  const isHost = match?.player1.uid === currentUserId;
  const isPlayer1 = match?.player1.uid === currentUserId;
  const opponent = isPlayer1 ? match?.player2 : match?.player1;
  const myPlayer = isPlayer1 ? match?.player1 : match?.player2;
  const currentQ = match?.questions[match.currentRound];
  const currentRoundResult = match?.roundResults.find(r => r.roundIndex === match.currentRound);
  const mySubmission = currentRoundResult && currentUserId ? currentRoundResult.submissions[currentUserId] : null;
  const oppSubmission = currentRoundResult && opponent ? currentRoundResult.submissions[opponent.uid] : null;

  // -------------------------------------------------------------
  // RENDER: NOT AUTHENTICATED
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 mb-3 shadow-2xs">
            <Swords className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Multiplayer Arena</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">Head-to-Head Multi Quiz</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Challenge your friends or football fans worldwide in live, real-time 1v1 football trivia battles.
          </p>
        </div>

        <Card className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50/50 via-white to-red-50/40 p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/30">
            <Swords className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight mb-2">Authentication Required</h2>
          <p className="mx-auto max-w-md text-xs sm:text-sm text-slate-600 font-medium mb-6">
            You must be signed in to your Maestro Arena account to create rooms, join live matches, and record your multiplayer stats.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3 text-sm font-black text-white shadow-md shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              Sign In to Play
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              Create Free Account
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SYNCHRONIZED COUNTDOWN (STATUS: 'starting')
  // -------------------------------------------------------------
  if (match && match.status === 'starting') {
    return (
      <div className="mx-auto max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300 py-12 px-4">
        <div className="rounded-3xl border-2 border-rose-300 bg-white p-8 text-center shadow-xl shadow-rose-600/10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-spin" />
            Synchronizing Both Players
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Match Starting!
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Both players will reveal Question 1 simultaneously.
            </p>
          </div>

          <div className="py-4">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-600 to-red-600 text-white font-black text-6xl shadow-2xl shadow-rose-600/35 animate-bounce">
              {startingCountdown > 0 ? startingCountdown : "GO!"}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-around text-xs font-bold text-slate-600">
            <span className="font-black text-slate-900">{match.player1.displayName}</span>
            <span className="text-rose-600 font-black">VS</span>
            <span className="font-black text-slate-900">{match.player2?.displayName || 'Opponent'}</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: ACTIVE MATCH PLAYING OR ROUND REVIEW
  // -------------------------------------------------------------
  if (match && (match.status === 'playing' || match.status === 'round_review') && currentQ) {
    const isReview = match.status === 'round_review';
    const totalQ = match.questions.length;

    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-300 pb-16">
        {/* MATCH HEADER & LIVE SCOREBOARD */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-rose-700">
                <Flame size={12} className="text-rose-600" />
                Round {match.currentRound + 1} of {totalQ}
              </span>
              <span>•</span>
              <span>{match.settings.category}</span>
            </div>

            {/* authoritative countdown */}
            <div className="flex flex-col items-end gap-1">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs transition-colors",
                timeLeft <= 10 ? "bg-red-50 text-red-600 animate-pulse border border-red-200" :
                timeLeft <= 25 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                "bg-slate-100 text-slate-700"
              )}>
                <Timer size={14} className={timeLeft <= 10 ? "animate-spin text-red-600" : ""} />
                <span>{timeLeft >= 60 ? `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s` : `${timeLeft}s`}</span>
              </div>
            </div>
          </div>

          {/* Visual Timer Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                timeLeft <= 10 ? "bg-red-500" : timeLeft <= 25 ? "bg-amber-500" : "bg-rose-600"
              )}
              style={{
                width: `${Math.min(100, Math.max(0, (timeLeft / (match.settings.timePerQuestion || 60)) * 100))}%`
              }}
            />
          </div>

          {/* 1v1 LIVE SCORE STRIP */}
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Player 1 */}
            <div className={cn(
              "p-3.5 rounded-2xl border transition-all flex items-center gap-3",
              isPlayer1 ? "bg-rose-50/50 border-rose-300" : "bg-slate-50/70 border-slate-200"
            )}>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {match.player1.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                      {match.player1.displayName}
                    </span>
                    {isPlayer1 && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-md">You</span>
                    )}
                  </div>
                  {/* Status Indicator */}
                  {isPlayer1 ? (
                    hasSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                        <CheckCheck size={10} /> Locked
                      </span>
                    ) : null
                  ) : (
                    (opponentHasAnswered || currentRoundResult?.submissions?.[match.player1.uid]) ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 shrink-0 animate-pulse">
                        <CheckCheck size={10} /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 shrink-0">
                        <Clock size={10} /> Thinking
                      </span>
                    )
                  )}
                </div>
                <div className="text-base sm:text-lg font-black text-rose-600">
                  {match.player1.score.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">pts</span>
                </div>
              </div>
            </div>

            {/* Player 2 */}
            <div className={cn(
              "p-3.5 rounded-2xl border transition-all flex items-center gap-3",
              !isPlayer1 ? "bg-rose-50/50 border-rose-300" : "bg-slate-50/70 border-slate-200"
            )}>
              <div className="h-10 w-10 rounded-xl bg-slate-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {match.player2?.displayName.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                      {match.player2?.displayName || 'Opponent'}
                    </span>
                    {!isPlayer1 && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-md">You</span>
                    )}
                  </div>
                  {/* Status Indicator */}
                  {!isPlayer1 ? (
                    hasSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                        <CheckCheck size={10} /> Locked
                      </span>
                    ) : null
                  ) : (
                    (opponentHasAnswered || (match.player2 && currentRoundResult?.submissions?.[match.player2.uid])) ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 shrink-0 animate-pulse">
                        <CheckCheck size={10} /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 shrink-0">
                        <Clock size={10} /> Thinking
                      </span>
                    )
                  )}
                </div>
                <div className="text-base sm:text-lg font-black text-slate-700">
                  {match.player2?.score.toLocaleString() || 0} <span className="text-[10px] font-bold text-slate-400">pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE QUESTION CARD */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Difficulty: <strong className="text-slate-700">{currentQ.difficulty}</strong></span>
              {hasSubmitted && !isReview && (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCheck size={14} /> Answer locked. Waiting for opponent...
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* ANSWER OPTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectAnswer = isReview && currentQ.correctAnswer && option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
              const isWrongSelection = isReview && isSelected && !isCorrectAnswer;

              return (
                <button
                  key={idx}
                  disabled={hasSubmitted || isReview}
                  onClick={() => handleSelectAnswer(option)}
                  className={cn(
                    "p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between cursor-pointer",
                    // Default state
                    !isSelected && !isReview && "border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-rose-50/50 hover:border-rose-300",
                    // Selected state while waiting
                    isSelected && !isReview && "border-rose-500 bg-rose-50 text-rose-900 shadow-sm",
                    // Review states
                    isCorrectAnswer && "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20",
                    isWrongSelection && "border-red-400 bg-red-50 text-red-950",
                    isReview && !isCorrectAnswer && !isWrongSelection && "opacity-40 border-slate-200 bg-slate-50 text-slate-500",
                    (hasSubmitted && !isReview) && "cursor-default"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black shrink-0",
                      isCorrectAnswer ? "bg-emerald-600 text-white" :
                      isWrongSelection ? "bg-red-600 text-white" :
                      isSelected ? "bg-rose-600 text-white" : "bg-slate-200/80 text-slate-600"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {isCorrectAnswer && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                  {isWrongSelection && <XCircle className="h-5 w-5 text-red-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* ROUND REVIEW INSIGHT */}
          {isReview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Round Summary
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {mySubmission?.isCorrect ? (
                    <span className="text-emerald-600 font-black">+{mySubmission.pointsAwarded} pts!</span>
                  ) : (
                    <span className="text-red-500 font-semibold">0 pts</span>
                  )}
                </span>
              </div>
              {currentQ.explanation && (
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {currentQ.explanation}
                </p>
              )}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Opponent: {oppSubmission?.isCorrect ? '✅ Correct' : oppSubmission?.selectedOption ? '❌ Incorrect' : '⏱️ Missed'}</span>
                <span>Next question loading...</span>
              </div>
            </motion.div>
          )}

          {/* LEAVE MATCH LINK */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleLeaveMatch}
              className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              Forfeit / Exit Match
            </button>
            <span className="text-xs font-semibold text-slate-400">
              Room: <strong className="font-mono text-slate-600">{match.roomCode}</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MATCH FINISHED / RESULTS SCREEN
  // -------------------------------------------------------------
  if (match && match.status === 'finished') {
    const isWinner = match.winnerUid === currentUserId;
    const isDraw = !match.winnerUid;
    const isDefeat = !isWinner && !isDraw;
    const totalQ = match.questions.length;
    const myScore = myPlayer?.score || 0;
    const oppScore = opponent?.score || 0;
    const myCorrectCount = myPlayer?.answers.filter(Boolean).length || 0;
    const accuracy = totalQ > 0 ? Math.round((myCorrectCount / totalQ) * 100) : 0;

    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-500 pb-16">
        <Card className={cn(
          "rounded-3xl border p-8 sm:p-10 text-center relative overflow-hidden shadow-md",
          isWinner ? "border-amber-300 bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5" :
          isDraw ? "border-blue-300 bg-gradient-to-b from-blue-500/10 via-white to-blue-500/5" :
          "border-slate-200 bg-white"
        )}>
          {/* Trophy Header */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-xl shadow-rose-600/30">
            <Trophy className="h-10 w-10 text-amber-300" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-black uppercase tracking-wider mb-2">
            Match Completed
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mb-2">
            {isWinner ? "Victory! You Won!" : isDraw ? "Honours Even! It's a Draw!" : "Defeat! Better Luck Next Time"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-medium mb-8">
            {match.settings.category} • {match.settings.difficulty} • {totalQ} Questions
          </p>

          {/* FINAL 1v1 SCOREBOARD */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className={cn(
              "p-4 rounded-2xl border text-center",
              isWinner ? "bg-amber-50 border-amber-300 shadow-xs" : "bg-slate-50 border-slate-200"
            )}>
              <span className="text-xs font-black text-slate-500 uppercase">{myPlayer?.displayName || 'You'}</span>
              <div className="text-3xl font-black text-rose-600 mt-1">{myScore.toLocaleString()}</div>
              <span className="text-[11px] font-bold text-slate-400">{myCorrectCount}/{totalQ} correct</span>
            </div>

            <div className={cn(
              "p-4 rounded-2xl border text-center",
              !isWinner && !isDraw ? "bg-amber-50 border-amber-300 shadow-xs" : "bg-slate-50 border-slate-200"
            )}>
              <span className="text-xs font-black text-slate-500 uppercase">{opponent?.displayName || 'Opponent'}</span>
              <div className="text-3xl font-black text-slate-700 mt-1">{oppScore.toLocaleString()}</div>
              <span className="text-[11px] font-bold text-slate-400">{opponent?.answers.filter(Boolean).length || 0}/{totalQ} correct</span>
            </div>
          </div>

          {/* PERFORMANCE METRICS */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8 pt-4 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Accuracy</span>
              <div className="text-lg font-black text-slate-800">{accuracy}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Questions</span>
              <div className="text-lg font-black text-slate-800">{totalQ}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Room Code</span>
              <div className="text-lg font-black font-mono text-slate-800">{match.roomCode}</div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setMatch(null);
                setIsConfigOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3 text-sm font-black text-white shadow-md shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 transition-all cursor-pointer"
            >
              <Swords className="h-4 w-4" />
              Rematch / New Battle
            </button>
            <button
              onClick={() => {
                setMatch(null);
                loadLobbyData();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              Return to Lobby
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: WAITING LOBBY (WAITING FOR OPPONENT OR START)
  // -------------------------------------------------------------
  if (match && (match.status === 'waiting' || match.status === 'ready')) {
    const isBothReady = match.player1.isReady && match.player2?.isReady;
    const canStart = isHost && Boolean(match.player2) && isBothReady;

    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-300 pb-16">
        <div>
          <button
            onClick={handleLeaveMatch}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft size={14} /> Exit Lobby
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-1">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Waiting Room</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">Match Lobby</h1>
            </div>

            {/* Room Code Badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Room Code</div>
                <div className="text-lg font-black font-mono tracking-widest text-slate-900">{match.roomCode}</div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
                  title="Copy Code"
                >
                  {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={handleShareLink}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
                  title="Share Invitation Link"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PLAYERS SLOTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Host Card */}
          <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-3 left-3 text-[10px] font-black uppercase px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
              Host
            </div>
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-rose-600/20 mb-3 mt-2">
              {match.player1.displayName.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-black text-slate-900 text-base">{match.player1.displayName}</h3>
            <span className="text-xs text-slate-400 font-semibold mb-4">
              {match.player1.uid === currentUserId ? 'You (Host)' : 'Host'}
            </span>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
              match.player1.isReady ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            )}>
              {match.player1.isReady ? <CheckCircle2 size={14} /> : <Clock size={14} />}
              {match.player1.isReady ? 'Ready' : 'Not Ready'}
            </div>
          </Card>

          {/* Opponent Card */}
          <Card className={cn(
            "rounded-3xl border p-6 flex flex-col items-center text-center relative overflow-hidden shadow-sm transition-all",
            match.player2 ? "border-slate-200/80 bg-white" : "border-dashed border-slate-300 bg-slate-50/60"
          )}>
            <div className="absolute top-3 left-3 text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
              Challenger
            </div>
            {match.player2 ? (
              <>
                <div className="h-16 w-16 rounded-2xl bg-slate-800 text-white font-black text-2xl flex items-center justify-center shadow-md mb-3 mt-2">
                  {match.player2.displayName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-black text-slate-900 text-base">{match.player2.displayName}</h3>
                <span className="text-xs text-slate-400 font-semibold mb-4">
                  {match.player2.uid === currentUserId ? 'You (Challenger)' : 'Challenger'}
                </span>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                  match.player2.isReady ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                )}>
                  {match.player2.isReady ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {match.player2.isReady ? 'Ready' : 'Not Ready'}
                </div>
              </>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 mb-3">
                  <Users size={24} />
                </div>
                <h3 className="font-black text-slate-700 text-sm mb-1">Waiting for opponent...</h3>
                <p className="text-xs text-slate-400 max-w-[200px] mb-3">
                  Share the room code or invitation link with a friend to join!
                </p>
                <button
                  onClick={handleShareLink}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  <Share2 size={12} /> Invite Friend
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* MATCH CONFIG SUMMARY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Category</span>
            <div className="text-xs font-black text-slate-800 truncate">{match.settings.category}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Difficulty</span>
            <div className="text-xs font-black text-slate-800">{match.settings.difficulty}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Questions</span>
            <div className="text-xs font-black text-slate-800">{match.settings.questionCount} Questions</div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Time / Round</span>
            <div className="text-xs font-black text-slate-800">
              {match.settings.timePerQuestion >= 60 ? '1 min (60s)' : `${match.settings.timePerQuestion}s`}
            </div>
          </div>
        </div>

        {/* ACTION CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Toggle Ready Button */}
          <button
            onClick={handleToggleReady}
            className={cn(
              "w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer shadow-2xs",
              myPlayer?.isReady
                ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            )}
          >
            {myPlayer?.isReady ? 'Mark as Not Ready' : 'Mark as Ready!'}
          </button>

          {/* Host Start Match Button */}
          {isHost ? (
            <button
              onClick={handleStartMatch}
              disabled={!canStart}
              className={cn(
                "w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black text-sm text-white transition-all shadow-md",
                canStart
                  ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25 cursor-pointer hover:-translate-y-0.5"
                  : "bg-slate-300 opacity-60 cursor-not-allowed shadow-none"
              )}
            >
              <Play className="h-4 w-4 fill-white" />
              Start Match Now
            </button>
          ) : (
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Clock size={14} /> Waiting for host to start match...
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN LOBBY SCREEN (CREATE, JOIN, QUICK MATCH, HISTORY)
  // -------------------------------------------------------------
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 mb-3 shadow-2xs">
            <Swords className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Live 1v1 Arena</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">Head-to-Head Multi Quiz</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time multiplayer football quiz battle with synchronized rounds, live scoreboard, and validated scoring.
          </p>
        </div>

        <button
          onClick={loadLobbyData}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading || historyLoading ? "animate-spin" : ""} />
          Refresh Lobby
        </button>
      </div>

      {/* THREE MAIN ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Quick Match */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-all hover:shadow-md">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/20">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Quick Match</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Find an open public match or create one instantly. Jump straight into the battle!
            </p>
          </div>
          <button
            onClick={handleQuickMatch}
            disabled={loading}
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-white" />
            Find Opponent
          </button>
        </Card>

        {/* 2. Create Private Room */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-all hover:shadow-md">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Create Private Room</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Customize categories, difficulty, question count, and invite a friend with a room code.
            </p>
          </div>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs sm:text-sm font-black text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Swords className="h-4 w-4" />
            Configure Match
          </button>
        </Card>

        {/* 3. Join with Code */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-all hover:shadow-md">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
              <LogIn className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Join with Room Code</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Have a 6-letter room code from a friend? Enter it below to join their lobby directly.
            </p>
          </div>
          <form onSubmit={handleJoinByCode} className="mt-4 space-y-2.5">
            <input
              type="text"
              maxLength={6}
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. AB12CD"
              className="w-full text-center font-mono font-black text-base tracking-widest uppercase rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
            />
            <button
              type="submit"
              disabled={loading || !roomCodeInput.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-black transition-colors cursor-pointer disabled:opacity-50"
            >
              Enter Room
            </button>
          </form>
        </Card>
      </div>

      {/* OPEN PUBLIC MATCHES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Globe className="text-rose-600" size={18} />
            Open Public Challenges ({publicRooms.length})
          </h2>
          <span className="text-xs text-slate-400 font-semibold">Live match requests</span>
        </div>

        {publicRooms.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No public rooms currently waiting</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Be the first to create one or challenge a friend using a private code!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-rose-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      {room.settings.difficulty}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      Code: {room.roomCode}
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-slate-900 truncate">
                    Host: {room.player1.displayName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {room.settings.category} • {room.settings.questionCount} Questions
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRoomCodeInput(room.roomCode);
                    joinH2HMatch({ id: currentUserId, displayName: currentUserDisplayName }, room.roomCode)
                      .then(setMatch)
                      .catch((e) => toast.error(e.message));
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-black hover:from-rose-500 hover:to-red-500 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Swords size={13} />
                  Accept Challenge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PLAYER'S MULTIPLAYER HISTORY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Trophy className="text-amber-500" size={18} />
            Your Multiplayer Battle History ({history.length})
          </h2>
          <span className="text-xs text-slate-400 font-semibold">Past Results</span>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
            <Trophy className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No multiplayer battles recorded yet</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Complete your first 1v1 football trivia quiz to build your Head-to-Head record!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-w-[500px]">
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Result</th>
                  <th className="px-5 py-3.5">Opponent</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        item.result === 'VICTORY' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        item.result === 'DEFEAT' ? "bg-red-50 text-red-700 border border-red-200" :
                        "bg-blue-50 text-blue-700 border border-blue-200"
                      )}>
                        {item.result}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{item.opponentName}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{item.category}</td>
                    <td className="px-5 py-3.5 font-bold font-mono">
                      <span className="text-rose-600 font-black">{item.myScore}</span>
                      <span className="text-slate-400 mx-1">-</span>
                      <span className="text-slate-600">{item.opponentScore}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-right">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MATCH CONFIGURATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 mb-2">
                  <Swords className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Custom Match</span>
                </div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">Configure 1v1 Quiz</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Set the rules and question pool for your battle.</p>
              </div>

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Quiz Category</label>
                  <select
                    value={configCategory}
                    onChange={(e) => setConfigCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs sm:text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Difficulty Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setConfigDifficulty(d)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                          configDifficulty === d
                            ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Number of Questions</label>
                  <div className="grid grid-cols-4 gap-2">
                    {QUESTION_COUNTS.map((cnt) => (
                      <button
                        type="button"
                        key={cnt}
                        onClick={() => setConfigCount(cnt)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                          configCount === cnt
                            ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {cnt} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Limit */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Time per Question</label>
                    <span className="text-[11px] font-semibold text-rose-600">Max 1 minute (60s)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_LIMITS.map((sec) => (
                      <button
                        type="button"
                        key={sec}
                        onClick={() => setConfigTime(sec)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                          configTime === sec
                            ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {sec === 60 ? '1 min (60s)' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                    {configTime === 60
                      ? 'Questions remain active for up to 1 full minute to allow ample time to think before expiring.'
                      : `Questions remain active for up to ${configTime} seconds before timing out.`}
                  </p>
                </div>

                {/* Privacy */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configPrivate}
                      onChange={(e) => setConfigPrivate(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Private Match (requires room code or link to join)</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateRoom}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
                  Create Room
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
