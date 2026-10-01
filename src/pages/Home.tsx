import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Trophy, Clock, Star, AlertCircle, ArrowRight, X, Check, ChevronDown, ChevronUp, Search, Calendar, History, Activity, Radio, RotateCw, Tv } from 'lucide-react';
import { MatchCard } from '../components/sports/MatchCard';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useArticles } from '../services/news/hooks';
import { useLiveMatches, useUpcomingMatches, useRecentMatches, useFavoriteFixtures } from '../services/sports/hooks';
import { insforge } from '../lib/insforge';
import { toast } from 'sonner';
import heroImage from '../assets/images/football_stars_hero_2026_1788809874968.jpg';
import madridTrioHero from '../assets/images/madrid_trio_hero_1789305202373.jpg';
import premiumHeroAlt from '../assets/images/premium_hero_players_alt_1789403921046.jpg';
import nextgenStars2027 from '../assets/images/nextgen_stars_2027_1790182919231.jpg';
import starsEra2027 from '../assets/images/stars_era_2027_1790182517204.jpg';
import uclStars2027 from '../assets/images/ucl_stars_2027_1790182533293.jpg';
import stadiumBg from '../assets/images/stadium_atmosphere_1789303106987.jpg';
import premiumTexture from '../assets/images/premium_football_texture_1789303121778.jpg';
import imgCel1 from '../assets/images/player_celebration_1_1788810962003.jpg';
import imgTrophy1 from '../assets/images/team_lifting_trophy_1_1788810980124.jpg';
import imgCel2 from '../assets/images/player_celebration_2_1788810996405.jpg';
import imgTrophy2 from '../assets/images/team_lifting_trophy_2_1788811011169.jpg';
import imgCel3 from '../assets/images/player_celebration_3_1788811026045.jpg';
import imgTrophy3 from '../assets/images/team_lifting_trophy_3_1788811040761.jpg';
import imgCel4 from '../assets/images/player_celebration_4_1788811055901.jpg';

const getLeaguePriority = (competition: any) => {
  const name = (competition.name || '').toLowerCase();
  const country = (competition.country || '').toLowerCase();
  if (name.includes('premier league') && country === 'england') return 1;
  if (name.includes('la liga') || name.includes('primera division')) return 2;
  if (name.includes('champions league')) return 3;
  if (name.includes('serie a') && country === 'italy') return 4;
  if (name.includes('bundesliga') && country === 'germany') return 5;
  if (name.includes('ligue 1') && country === 'france') return 6;
  return 100;
};

export function Home() {
  const { user, userData } = useAuth() as any;
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [showTeamBrowser, setShowTeamBrowser] = useState(false);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const topLeagues = [
    {
      name: 'Premier League',
      teams: [
        { id: 'team_42', type: 'team' as const, name: 'Arsenal' },
        { id: 'team_58', type: 'team' as const, name: 'Aston Villa' },
        { id: 'team_35', type: 'team' as const, name: 'Bournemouth' },
        { id: 'team_55', type: 'team' as const, name: 'Brentford' },
        { id: 'team_51', type: 'team' as const, name: 'Brighton' },
        { id: 'team_49', type: 'team' as const, name: 'Chelsea' },
        { id: 'team_52', type: 'team' as const, name: 'Crystal Palace' },
        { id: 'team_45', type: 'team' as const, name: 'Everton' },
        { id: 'team_36', type: 'team' as const, name: 'Fulham' },
        { id: 'team_40', type: 'team' as const, name: 'Liverpool' },
        { id: 'team_62', type: 'team' as const, name: 'Luton Town' },
        { id: 'team_50', type: 'team' as const, name: 'Manchester City' },
        { id: 'team_33', type: 'team' as const, name: 'Manchester United' },
        { id: 'team_34', type: 'team' as const, name: 'Newcastle' },
        { id: 'team_65', type: 'team' as const, name: 'Nottingham Forest' },
        { id: 'team_61', type: 'team' as const, name: 'Sheffield United' },
        { id: 'team_47', type: 'team' as const, name: 'Tottenham' },
        { id: 'team_48', type: 'team' as const, name: 'West Ham' },
        { id: 'team_39', type: 'team' as const, name: 'Wolves' },
        { id: 'team_44', type: 'team' as const, name: 'Burnley' },
      ].sort((a, b) => a.name.localeCompare(b.name))
    },
    {
      name: 'La Liga',
      teams: [
        { id: 'team_77', type: 'team' as const, name: 'Athletic Club' },
        { id: 'team_78', type: 'team' as const, name: 'Atletico Madrid' },
        { id: 'team_81', type: 'team' as const, name: 'Barcelona' },
        { id: 'team_86', type: 'team' as const, name: 'Real Madrid' },
        { id: 'team_90', type: 'team' as const, name: 'Real Betis' },
        { id: 'team_92', type: 'team' as const, name: 'Real Sociedad' },
        { id: 'team_80', type: 'team' as const, name: 'Sevilla' },
        { id: 'team_94', type: 'team' as const, name: 'Villarreal' },
        { id: 'team_95', type: 'team' as const, name: 'Valencia' },
        { id: 'team_83', type: 'team' as const, name: 'Granada' },
        { id: 'team_82', type: 'team' as const, name: 'Getafe' },
        { id: 'team_79', type: 'team' as const, name: 'Osasuna' },
        { id: 'team_88', type: 'team' as const, name: 'Levante' },
        { id: 'team_89', type: 'team' as const, name: 'Mallorca' },
        { id: 'team_87', type: 'team' as const, name: 'Rayo Vallecano' },
        { id: 'team_91', type: 'team' as const, name: 'Celta Vigo' },
        { id: 'team_93', type: 'team' as const, name: 'Almeria' },
        { id: 'team_84', type: 'team' as const, name: 'Girona' },
        { id: 'team_97', type: 'team' as const, name: 'Las Palmas' },
        { id: 'team_98', type: 'team' as const, name: 'Alaves' },
      ].sort((a, b) => a.name.localeCompare(b.name))
    },
    {
      name: 'Serie A',
      teams: [
        { id: 'team_109', type: 'team' as const, name: 'Juventus' },
        { id: 'team_113', type: 'team' as const, name: 'AC Milan' },
        { id: 'team_108', type: 'team' as const, name: 'Inter Milan' },
        { id: 'team_111', type: 'team' as const, name: 'Roma' },
        { id: 'team_110', type: 'team' as const, name: 'Lazio' },
        { id: 'team_114', type: 'team' as const, name: 'Napoli' },
        { id: 'team_102', type: 'team' as const, name: 'Atalanta' },
        { id: 'team_103', type: 'team' as const, name: 'Bologna' },
        { id: 'team_104', type: 'team' as const, name: 'Cagliari' },
        { id: 'team_105', type: 'team' as const, name: 'Empoli' },
        { id: 'team_106', type: 'team' as const, name: 'Fiorentina' },
        { id: 'team_107', type: 'team' as const, name: 'Frosinone' },
        { id: 'team_112', type: 'team' as const, name: 'Genoa' },
        { id: 'team_115', type: 'team' as const, name: 'Lecce' },
        { id: 'team_116', type: 'team' as const, name: 'Monza' },
        { id: 'team_117', type: 'team' as const, name: 'Salernitana' },
        { id: 'team_118', type: 'team' as const, name: 'Sassuolo' },
        { id: 'team_119', type: 'team' as const, name: 'Torino' },
        { id: 'team_120', type: 'team' as const, name: 'Udinese' },
        { id: 'team_121', type: 'team' as const, name: 'Verona' },
      ].sort((a, b) => a.name.localeCompare(b.name))
    },
    {
      name: 'Bundesliga',
      teams: [
        { id: 'team_5', type: 'team' as const, name: 'Bayern Munich' },
        { id: 'team_4', type: 'team' as const, name: 'Borussia Dortmund' },
        { id: 'team_11', type: 'team' as const, name: 'Bayer Leverkusen' },
        { id: 'team_1', type: 'team' as const, name: 'RB Leipzig' },
        { id: 'team_3', type: 'team' as const, name: 'Eintracht Frankfurt' },
        { id: 'team_9', type: 'team' as const, name: 'Wolfsburg' },
        { id: 'team_6', type: 'team' as const, name: 'B. Monchengladbach' },
        { id: 'team_12', type: 'team' as const, name: 'Werder Bremen' },
        { id: 'team_7', type: 'team' as const, name: 'Stuttgart' },
        { id: 'team_8', type: 'team' as const, name: 'Freiburg' },
        { id: 'team_10', type: 'team' as const, name: 'Hoffenheim' },
        { id: 'team_2', type: 'team' as const, name: 'Union Berlin' },
        { id: 'team_13', type: 'team' as const, name: 'Mainz 05' },
        { id: 'team_14', type: 'team' as const, name: 'Augsburg' },
        { id: 'team_15', type: 'team' as const, name: 'Bochum' },
        { id: 'team_16', type: 'team' as const, name: 'FC Koln' },
        { id: 'team_17', type: 'team' as const, name: 'Darmstadt' },
        { id: 'team_18', type: 'team' as const, name: 'Heidenheim' },
      ].sort((a, b) => a.name.localeCompare(b.name))
    },
    {
      name: 'Ligue 1',
      teams: [
        { id: 'team_85', type: 'team' as const, name: 'PSG' },
        { id: 'team_71', type: 'team' as const, name: 'Marseille' },
        { id: 'team_72', type: 'team' as const, name: 'Monaco' },
        { id: 'team_66', type: 'team' as const, name: 'Lyon' },
        { id: 'team_70', type: 'team' as const, name: 'Lille' },
        { id: 'team_68', type: 'team' as const, name: 'Rennes' },
        { id: 'team_67', type: 'team' as const, name: 'Nice' },
        { id: 'team_69', type: 'team' as const, name: 'Lens' },
        { id: 'team_73', type: 'team' as const, name: 'Montpellier' },
        { id: 'team_74', type: 'team' as const, name: 'Nantes' },
        { id: 'team_75', type: 'team' as const, name: 'Strasbourg' },
        { id: 'team_76', type: 'team' as const, name: 'Reims' },
        { id: 'team_60', type: 'team' as const, name: 'Toulouse' },
        { id: 'team_61_fr', type: 'team' as const, name: 'Brest' },
        { id: 'team_62_fr', type: 'team' as const, name: 'Lorient' },
        { id: 'team_63', type: 'team' as const, name: 'Clermont' },
        { id: 'team_64', type: 'team' as const, name: 'Metz' },
        { id: 'team_65_fr', type: 'team' as const, name: 'Le Havre' },
      ].sort((a, b) => a.name.localeCompare(b.name))
    }
  ];

  const filteredLeagues = useMemo(() => {
    if (!searchQuery) return topLeagues;
    const lowerQ = searchQuery.toLowerCase();
    
    return topLeagues.map(league => {
      const filteredTeams = league.teams.filter(t => t.name.toLowerCase().includes(lowerQ));
      return { ...league, teams: filteredTeams };
    }).filter(league => league.teams.length > 0);
  }, [searchQuery]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [polls, setPolls] = useState<any[]>([]);
  const [votedPolls, setVotedPolls] = useState<Record<string, number>>({});

  const HERO_PRESETS = [
    {
      id: 'stars-2027',
      name: '2027 Superstars',
      subtitle: 'Yamal · Mbappé · Haaland · Bellingham',
      image: starsEra2027,
    },
    {
      id: 'nextgen-2027',
      name: 'Next-Gen Stars',
      subtitle: 'Vinicius Jr · Bukayo Saka · Jamal Musiala',
      image: nextgenStars2027,
    },
    {
      id: 'ucl-clash',
      name: 'Champions Arena',
      subtitle: 'Yamal vs Bellingham European Duel',
      image: uclStars2027,
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

  const { matches: liveMatches, isLoading: isLoadingLive } = useLiveMatches();
  const { matches: upcomingMatchesRaw, isLoading: isLoadingUpcoming } = useUpcomingMatches();
  const { matches: recentMatchesRaw, isLoading: isLoadingRecent } = useRecentMatches();
  const { articles, isLoading: isLoadingNews } = useArticles('published');

  const upcomingMatches = useMemo(() => {
    if (!upcomingMatchesRaw) return [];
    return [...upcomingMatchesRaw].sort((a, b) => {
      const pA = getLeaguePriority({ id: a.competitionId, name: a.competitionName, country: a.competitionCountry });
      const pB = getLeaguePriority({ id: b.competitionId, name: b.competitionName, country: b.competitionCountry });
      return pA - pB;
    });
  }, [upcomingMatchesRaw]);
  
  const recentMatches = useMemo(() => {
    if (!recentMatchesRaw) return [];
    return [...recentMatchesRaw].sort((a, b) => {
      const pA = getLeaguePriority({ id: a.competitionId, name: a.competitionName, country: a.competitionCountry });
      const pB = getLeaguePriority({ id: b.competitionId, name: b.competitionName, country: b.competitionCountry });
      return pA - pB;
    });
  }, [recentMatchesRaw]);

  // Personalized Feed
  

  
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
  

  const featuredLive = useMemo(() => {
    if (!liveMatches) return [];
    // Only show live matches NOT in myFeedLive to avoid duplication if user has favorites
    return [...liveMatches]
      .filter(m => favorites.length === 0 || (!isFavorite(`team_${m.homeTeam.id}`) && !isFavorite(`team_${m.awayTeam.id}`) && !isFavorite(m.homeTeam.id) && !isFavorite(m.awayTeam.id) && !favorites.some(f => f.name === m.homeTeam.name || f.name === m.awayTeam.name)))
      .sort((a, b) => {
        const pA = getLeaguePriority({ id: a.competitionId, name: a.competitionName, country: a.competitionCountry });
        const pB = getLeaguePriority({ id: b.competitionId, name: b.competitionName, country: b.competitionCountry });
        return pA - pB;
      }).slice(0, 4);
  }, [liveMatches, favorites]);

  const topNews = articles?.slice(0, 4) || [];

  const [isHomeIframeLoading, setIsHomeIframeLoading] = useState<boolean>(true);
  const [homeIframeKey, setHomeIframeKey] = useState<number>(0);

  const handleHomeRefresh = () => {
    setIsHomeIframeLoading(true);
    setHomeIframeKey((prev) => prev + 1);
  };

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
        </div>

        {/* Content Box (Comfortable padding on mobile, smooth overlay on desktop) */}
        <div className="relative z-10 w-full md:w-[70%] flex flex-col items-start justify-end p-5 sm:p-7 md:p-12 lg:p-16 md:mt-auto">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50/90 backdrop-blur-md border border-cyan-200/80 mb-4 md:mb-6 w-max shadow-2xs animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-cyan-800">
              Live Arena
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3 md:mb-4 leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="text-slate-950">The </span>
            <span className="text-rose-600 relative inline-block">
              Beautiful
              <svg className="absolute -bottom-1 md:-bottom-2 w-full h-2 md:h-3 text-rose-200 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15 Q 50 0 100 15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/></svg>
            </span>
            <span className="text-slate-950"> Game <br className="hidden md:block" /></span>
            <span className="bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent font-extrabold italic pr-1"> Unites </span>
            <span className="text-slate-950">Us</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-700 font-medium mb-6 md:mb-8 max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 drop-shadow-xs">
            Follow live matches, explore competitions, play quizzes and get the latest football updates all in one place.
          </p>

          <div className="flex flex-wrap gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 w-full sm:w-auto">
            <Link 
              to="/livescore"
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-cyan-600/25 hover:from-cyan-500 hover:to-teal-500 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              Explore Matches
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/quiz"
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-rose-600/25 hover:from-rose-500 hover:to-red-500 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              Enter Arena
            </Link>
          </div>
        </div>
      </div>

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

      {/* Bento Grid Layout */}
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
        
        {/* Left Column (Main Content: Feed & Live) */}
        <div className="space-y-6 w-full">
          
          {/* Real-Time Live Matches & Upcoming Highlights from ScoreBat */}
          <Card className="border border-white/80 bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <CardTitle className="text-lg font-black text-slate-950 flex items-center gap-2">
                  World Football
                </CardTitle>
                <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                  Real-time
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleHomeRefresh}
                  title="Reload Live Feed"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isHomeIframeLoading ? 'animate-spin text-cyan-600' : ''}`} />
                </button>

                <Link to="/livescore" className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-1">
                  View All →
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="relative w-full overflow-hidden bg-white" style={{ height: '620px' }}>
                {isHomeIframeLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs">
                    <div className="relative flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full border-4 border-slate-200"></div>
                      <div className="absolute h-10 w-10 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-700">Loading real-time matches...</p>
                  </div>
                )}

                <iframe
                  key={homeIframeKey}
                  src="https://www.scorebat.com/embed/livescore/"
                  title="Real-Time World Football Matches"
                  frameBorder="0"
                  width="100%"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  onLoad={() => setIsHomeIframeLoading(false)}
                  className="w-full border-0 block"
                  style={{
                    width: '100%',
                    marginTop: '-54px',
                    height: 'calc(100% + 54px)',
                    border: 'none',
                    display: 'block',
                    opacity: isHomeIframeLoading ? 0 : 1,
                    transition: 'opacity 0.25s ease-in-out',
                  }}
                />
              </div>
            </CardContent>
          </Card>
          

        </div>

        {/* Right Column (Sidebar: Team Browser, Standings, News) */}
        <div className="space-y-6">
          
          {/* Favorites Widget / Team Browser */}
          <Card className="relative overflow-hidden bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Your Teams
                </CardTitle>
                <button 
                  onClick={() => setShowTeamBrowser(!showTeamBrowser)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-all hover:border-rose-200 hover:bg-rose-50/50 cursor-pointer"
                >
                  {showTeamBrowser ? 'Done' : 'Edit Teams'}
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {showTeamBrowser ? (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search teams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredLeagues.length > 0 ? filteredLeagues.map(league => (
                      <div key={league.name} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <button 
                          onClick={() => setExpandedLeague(expandedLeague === league.name ? null : league.name)}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <span className="font-bold text-slate-900 text-sm">{league.name}</span>
                          {expandedLeague === league.name || searchQuery ? (
                            <ChevronUp className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          )}
                        </button>
                        
                        {(expandedLeague === league.name || searchQuery) && (
                          <div className="p-2 grid grid-cols-1 gap-1.5 bg-white border-t border-slate-100 animate-in fade-in">
                            {league.teams.map(team => {
                              const isSelected = isFavorite(team.id);
                              return (
                                <button
                                  key={team.id}
                                  onClick={() => toggleFavorite(team)}
                                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'border-rose-400 bg-rose-50/70 shadow-2xs' 
                                      : 'border-transparent hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <img src={`https://media.api-sports.io/football/teams/${team.id.replace('team_', '').replace('_fr', '')}.png`} alt={team.name} className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    <span className={`text-sm font-bold ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>
                                      {team.name}
                                    </span>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 text-rose-600" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-center py-4 text-sm text-slate-500">No teams found matching "{searchQuery}"</div>
                    )}
                  </div>
                </div>
              ) : favorites.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {favorites.map(team => (
                    <div key={team.id} className="group flex items-center gap-2 bg-white hover:bg-rose-50/40 border border-slate-200/90 pl-2 pr-1.5 py-1.5 rounded-full shadow-2xs transition-all">
                      {team.logo ? <img src={team.logo} alt={team.name} className="w-5 h-5 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <img src={`https://media.api-sports.io/football/teams/${team.id.replace('team_', '').replace('_fr', '')}.png`} alt={team.name} className="w-5 h-5 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                      <span className="text-xs font-bold text-slate-900">{team.name}</span>
                      <button 
                        onClick={() => toggleFavorite(team)}
                        className="p-1 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Star className="h-6 w-6 text-amber-400 mb-1" />
                    <p className="font-bold text-slate-800 text-sm">No teams added</p>
                    <button 
                      onClick={() => setShowTeamBrowser(true)}
                      className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/70 px-4 py-2 rounded-full transition-colors cursor-pointer"
                    >
                      Browse Teams
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
