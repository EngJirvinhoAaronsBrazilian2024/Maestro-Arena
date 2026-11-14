import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Trophy, Star, ArrowRight, Check, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../services/news/hooks';
import { insforge } from '../lib/insforge';
import { toast } from 'sonner';
import { LiveScoresSection } from '../components/sports/LiveScoresSection';
import { MatchdayCountdownWidget } from '../components/sports/MatchdayCountdownWidget';
import { FavoriteTeamsBar } from '../components/sports/FavoriteTeamsBar';
import { JirvinhoAdBanner } from '../components/ads/JirvinhoAdBanner';
import heroEliteStrikers from '../assets/images/hero_elite_strikers_1793101072833.jpg';
import heroMatchdayGoal from '../assets/images/hero_matchday_goal_1793101085530.jpg';
import headerStarsDuel from '../assets/images/header_stars_duel_1793196097607.jpg';
import headerStadiumRoar from '../assets/images/header_stadium_roar_1793196109962.jpg';
import headerTrophyLift from '../assets/images/header_trophy_lift_1793196123407.jpg';
import heroImage from '../assets/images/football_stars_hero_2026_1788809874968.jpg';
import madridTrioHero from '../assets/images/madrid_trio_hero_1789305202373.jpg';
import premiumHeroAlt from '../assets/images/premium_hero_players_alt_1789403921046.jpg';
import stadiumBg from '../assets/images/stadium_atmosphere_1789303106987.jpg';
import premiumTexture from '../assets/images/premium_football_texture_1789303121778.jpg';
import imgCel1 from '../assets/images/player_celebration_1_1788810962003.jpg';
import imgTrophy1 from '../assets/images/team_lifting_trophy_1_1788810980124.jpg';
import imgCel2 from '../assets/images/player_celebration_2_1788810996405.jpg';
import imgTrophy2 from '../assets/images/team_lifting_trophy_2_1788811011169.jpg';
import imgCel3 from '../assets/images/player_celebration_3_1788811026045.jpg';
import imgTrophy3 from '../assets/images/team_lifting_trophy_3_1788811040761.jpg';
import imgCel4 from '../assets/images/player_celebration_4_1788811055901.jpg';

export function Home() {
  const { user } = useAuth() as any;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [polls, setPolls] = useState<any[]>([]);
  const [votedPolls, setVotedPolls] = useState<Record<string, number>>({});

  const HERO_PRESETS = [
    {
      id: 'elite-strikers-2027',
      name: 'Global Football Elite',
      subtitle: 'Mbappé · Haaland · Kane · Vinicius Jr',
      image: heroEliteStrikers,
    },
    {
      id: 'matchday-voltage',
      name: 'Matchday Voltage',
      subtitle: 'Live Drama · Stadium Atmosphere · Thrilling Goals',
      image: heroMatchdayGoal,
    },
    {
      id: 'stars-duel',
      name: 'Clash of Titans',
      subtitle: 'European Championship Duel · Floodlit Arena',
      image: headerStarsDuel,
    },
    {
      id: 'stadium-roar',
      name: 'Matchday Victory',
      subtitle: 'Team Glory · Roaring Stadium · Decisive Goals',
      image: headerStadiumRoar,
    },
    {
      id: 'trophy-glory',
      name: 'Champions Glory',
      subtitle: 'Silverware Triumph · Confetti & Celebration',
      image: headerTrophyLift,
    },
  ];
  const [activeHeroPreset, setActiveHeroPreset] = useState(0);

  // Auto-scroll images every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroPreset(prev => (prev + 1) % HERO_PRESETS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [HERO_PRESETS.length]);

  useEffect(() => {
    const loadPolls = async () => {
      try {
        const { data } = await insforge.database
          .from('polls')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        if (data) setPolls(data);
      } catch (e) {}
    };
    loadPolls();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadVotes = async () => {
      try {
        const { data } = await insforge.database
          .from('poll_votes')
          .select('poll_id, option_index')
          .eq('user_id', user.id);
        if (data) {
          const votes: Record<string, number> = {};
          data.forEach((v: any) => votes[v.poll_id] = v.option_index);
          setVotedPolls(votes);
        }
      } catch (e) {}
    };
    loadVotes();
  }, [user]);

  const submitVote = async (pollId: string, optionIndex: number) => {
    if (!user) return toast.error('Please login to vote');
    try {
      await insforge.database.from('poll_votes').insert([{ poll_id: pollId, user_id: user.id, option_index: optionIndex }]);
      setVotedPolls(prev => ({ ...prev, [pollId]: optionIndex }));
      toast.success('Vote cast successfully!');
    } catch (e) {
      toast.error('You already voted on this poll');
    }
  };
  
  const slides = [
    heroImage, imgCel1, imgTrophy1, imgCel2, imgTrophy2, imgCel3, imgTrophy3, imgCel4
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const { articles, isLoading: isLoadingNews } = useArticles('published');
  const topNews = articles?.slice(0, 4) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Premium Hero Section - Fully Responsive Across All Devices */}
      <div className="relative w-full overflow-hidden rounded-[24px] shadow-sm border border-slate-200 flex flex-col md:min-h-[550px] group mb-10 bg-white">
        
        {/* Full Image Container:
            - On Mobile (< md): Displays in natural 16:9 widescreen so ALL players are 100% visible edge-to-edge
            - On Desktop (md:): Spans background with smooth crossfades and subtle bottom-left gradient */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] md:aspect-auto md:absolute md:inset-0 z-0 bg-slate-900 overflow-hidden">
           {HERO_PRESETS.map((preset, idx) => (
             <img 
               key={preset.id}
               src={preset.image} 
               alt="SportsHub Football Arena"
               referrerPolicy="no-referrer"
               className={cn(
                 "absolute inset-0 w-full h-full object-cover object-center md:object-[right_top] transition-opacity duration-1000 ease-in-out",
                 activeHeroPreset === idx ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
               )} 
             />
           ))}
           
           {/* Desktop Gradients: Subtle fade in bottom-left corner targeting only where text sits */}
           <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent h-[60%] top-auto bottom-0 hidden md:block pointer-events-none"></div>
           <div className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-white/95 via-white/40 to-transparent hidden md:block pointer-events-none"></div>
           
           {/* Mobile Bottom Blend: Clean gradient transition into the content below */}
           <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent md:hidden pointer-events-none"></div>

           {/* Mobile Slide Indicator Pill */}
           <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold md:hidden shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>{HERO_PRESETS[activeHeroPreset]?.name || 'Matchday Arena'}</span>
           </div>
        </div>

        {/* Content Box (Comfortable padding on mobile, smooth overlay on desktop) */}
        <div className="relative z-10 w-full md:w-[70%] flex flex-col items-start justify-end p-4 sm:p-6 md:p-12 lg:p-16 md:mt-auto">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50/90 backdrop-blur-md border border-rose-200/80 mb-3 md:mb-6 w-max shadow-2xs animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-rose-800">
              Live Arena
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-2.5 md:mb-4 leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="text-slate-900">The </span>
            <span className="text-rose-600 relative inline-block">
              Beautiful
              <svg className="absolute -bottom-1 md:-bottom-2 w-full h-2 md:h-3 text-rose-200 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15 Q 50 0 100 15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/></svg>
            </span>
            <span className="text-slate-900"> Game <br className="hidden md:block" /></span>
            <span className="bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent font-extrabold italic pr-1"> Unites </span>
            <span className="text-slate-900">Us</span>
          </h1>
          
          <p className="text-xs sm:text-base md:text-lg text-slate-600 font-medium mb-4 md:mb-8 max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Follow live matches, explore competitions, play quizzes and get verified football updates all in one place.
          </p>

          {/* MOBILE-ONLY NEW POSITIONING: High-Impact Twin Action Command Deck */}
          <div className="grid grid-cols-2 gap-2.5 w-full md:hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link 
              to="/livescore"
              className="flex flex-col justify-between p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all relative overflow-hidden group border border-blue-400/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  Live
                </span>
                <div className="p-1.5 rounded-xl bg-white/15 text-white">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black tracking-tight leading-tight flex items-center justify-between">
                  <span>Explore Matches</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-90 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </p>
                <p className="text-[11px] text-blue-100/90 font-medium mt-0.5">Scores & Fixtures</p>
              </div>
            </Link>

            <Link 
              to="/quiz"
              className="flex flex-col justify-between p-3.5 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/20 active:scale-[0.98] transition-all relative overflow-hidden group border border-red-400/40"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/20 border border-white/30 text-[10px] font-black uppercase tracking-wider text-white">
                  <Trophy className="w-2.5 h-2.5 text-amber-300" />
                  Arena
                </span>
                <div className="p-1.5 rounded-xl bg-white/15 text-white">
                  <Trophy className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black tracking-tight leading-tight flex items-center justify-between text-white">
                  <span>Play Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/90 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </p>
                <p className="text-[11px] text-red-100 font-medium mt-0.5">Trivia & Rewards</p>
              </div>
            </Link>
          </div>

          {/* DESKTOP BUTTONS: Elegant horizontal layout on md+ */}
          <div className="hidden md:flex flex-wrap gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 w-full sm:w-auto">
            <Link 
              to="/livescore"
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-600 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              Explore Matches
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/quiz"
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-red-600/25 hover:from-red-500 hover:to-rose-600 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer border border-red-500/40"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              Play Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Marquee Fixture / Derby Countdown */}
      <MatchdayCountdownWidget />

      {/* Sleek Sponsor Banner Under Match Countdown */}
      <div className="w-full max-w-4xl mx-auto my-2">
        <JirvinhoAdBanner variant="featured" badgeText="Official Matchday & Technology Partner" />
      </div>

      {/* Personalized Favorite Teams & Competitions Quick-Filter Bar */}
      <FavoriteTeamsBar showMyFeedLink={true} showInlineFeed={true} />

      {/* Live Football Scores & Real-Time Matches */}
      <LiveScoresSection />

      {polls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto">
          {polls.map(poll => (
            <div key={poll.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-rose-200/80 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Star size={64} className="text-amber-500" />
              </div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-cyan-700">Live Fan Poll</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 relative z-10 leading-tight">{poll.question}</h3>
              
              <div className="space-y-2 relative z-10">
                {poll.options.map((opt: string, i: number) => {
                  const hasVoted = votedPolls[poll.id] !== undefined;
                  const isSelected = votedPolls[poll.id] === i;
                  return (
                    <button
                      key={i}
                      disabled={hasVoted}
                      onClick={() => submitVote(poll.id, i)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border text-sm font-bold transition-all flex justify-between items-center cursor-pointer",
                        hasVoted
                          ? isSelected 
                            ? "bg-rose-50 border-rose-300 text-rose-800 shadow-2xs" 
                            : "bg-slate-50 border-slate-100 text-slate-500"
                          : "bg-white/90 border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 text-slate-800"
                      )}
                    >
                      {opt}
                      {isSelected && <Check size={16} className="text-rose-600" />}
                    </button>
                  );
                })}
              </div>
              {votedPolls[poll.id] !== undefined && (
                <p className="text-xs text-center text-rose-600 mt-4 font-bold uppercase tracking-wider">Vote Recorded</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Home Sections: Latest Stories */}
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Top News Widget */}
          <Card className="border border-white/80 bg-white/75 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/70 border-b border-slate-100">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Trophy className="h-4 w-4 text-amber-500" />
                Latest Stories
              </CardTitle>
              <Link to="/news" className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {isLoadingNews ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-600 border-t-transparent"></div>
                </div>
              ) : topNews.length > 0 ? (
                topNews.map((article, index) => (
                  <React.Fragment key={article.id}>
                    <div className="space-y-1 group">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-rose-600 font-black uppercase tracking-wider">
                          {article.category || 'News'}
                        </span>
                        <span className="text-slate-400 font-bold">
                          By {article.authorName || 'Jirvinho Brazilian sports maestro'}
                        </span>
                      </div>
                      <Link to={`/news/${article.id}`}>
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h4>
                      </Link>
                    </div>
                    {index < topNews.length - 1 && <div className="h-px bg-slate-100" />}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-sm text-slate-500">No recent news.</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
