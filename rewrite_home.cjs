const fs = require('fs');

const homeContent = `import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Trophy, Clock, Star, AlertCircle, ArrowRight, X, Check, ChevronDown, ChevronUp, Search, Calendar, History } from 'lucide-react';
import MatchCard from '../components/sports/MatchCard';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useArticles } from '../hooks/useNews';
import { useLiveMatches, useUpcomingMatches, useRecentMatches } from '../services/sports/hooks';
import heroImage from '../assets/hero_bg.png';
import imgCel1 from '../assets/img_cel1.jpg';
import imgTrophy1 from '../assets/img_trophy1.jpg';
import imgCel2 from '../assets/img_cel2.jpg';
import imgTrophy2 from '../assets/img_trophy2.jpg';
import imgCel3 from '../assets/img_cel3.jpg';
import imgTrophy3 from '../assets/img_trophy3.jpg';
import imgCel4 from '../assets/img_cel4.jpg';

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

export default function Home() {
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
  const myFeedLive = useMemo(() => {
    if (!liveMatches || favorites.length === 0) return [];
    return liveMatches.filter(m => isFavorite(m.homeTeam.id) || isFavorite(m.awayTeam.id));
  }, [liveMatches, favorites]);

  const myFeedUpcoming = useMemo(() => {
    if (!upcomingMatches || favorites.length === 0) return [];
    return upcomingMatches.filter(m => isFavorite(m.homeTeam.id) || isFavorite(m.awayTeam.id));
  }, [upcomingMatches, favorites]);

  const featuredLive = useMemo(() => {
    if (!liveMatches) return [];
    // Only show live matches NOT in myFeedLive to avoid duplication if user has favorites
    return [...liveMatches]
      .filter(m => favorites.length === 0 || (!isFavorite(m.homeTeam.id) && !isFavorite(m.awayTeam.id)))
      .sort((a, b) => {
        const pA = getLeaguePriority({ id: a.competitionId, name: a.competitionName, country: a.competitionCountry });
        const pB = getLeaguePriority({ id: b.competitionId, name: b.competitionName, country: b.competitionCountry });
        return pA - pB;
      }).slice(0, 4);
  }, [liveMatches, favorites]);

  const topNews = articles?.slice(0, 4) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Premium Hero Section */}
      <div className="relative w-full overflow-hidden rounded-[32px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col items-center min-h-[450px] group p-6 sm:p-8 md:p-12 lg:p-16 pt-10 sm:pt-12 gap-8">
        
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50/60 via-transparent to-transparent z-0 pointer-events-none"></div>

        {userData && (
          <div className="relative z-10 w-full flex justify-center md:justify-start mb-2">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold tracking-wide animate-in fade-in slide-in-from-top-4">
              <span>👋</span>
              <span>Welcome back, {userData.displayName}!</span>
            </div>
          </div>
        )}

        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 flex-1">
          {/* Text Content */}
        <div className="relative z-10 w-full md:w-[50%] flex flex-col justify-center text-center md:text-left order-2 md:order-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm mb-6 mx-auto md:mx-0 w-max">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">The World's Best</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-5 leading-[1.15]">
            Football <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">Lives Here</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 mb-8 max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
            Follow the stars. Track every match. Test your football knowledge.
          </p>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Link 
              to="/livescore"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.25)] hover:-translate-y-0.5"
            >
              Live Scores
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/quiz"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
            >
              Play Quiz
            </Link>
          </div>
        </div>

        {/* Dynamic Image Collage Grid */}
        <div className="relative z-10 w-full md:w-[45%] aspect-[4/3] rounded-[24px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-white/50 order-1 md:order-2">
            {slides.map((src, index) => (
              <div 
                key={index}
                className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
                style={{ opacity: currentSlide === index ? 1 : 0 }}
              >
                <img 
                  src={src}
                  alt="Football action"
                  className="w-full h-full object-cover transform scale-105 transition-transform duration-[10000ms] ease-out"
                  style={{ transform: currentSlide === index ? 'scale(1)' : 'scale(1.05)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 mix-blend-overlay"></div>
              </div>
            ))}
            
            {/* Overlay Badge */}
            <div className="absolute bottom-6 right-6 inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
               <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Action</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content: Feed & Live) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personalized "My Feed" (Only shows if favorites exist) */}
          {favorites.length > 0 && (
            <Card className="border-blue-100 shadow-[0_4px_20px_rgba(59,130,246,0.05)] bg-gradient-to-br from-white to-blue-50/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <CardHeader className="pb-3 border-b border-blue-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-500 fill-blue-500" />
                  My Feed
                </CardTitle>
                <p className="text-sm text-slate-500">Live & upcoming matches for your teams</p>
              </CardHeader>
              <CardContent className="pt-4">
                {(myFeedLive.length === 0 && myFeedUpcoming.length === 0) ? (
                   <div className="py-6 text-center text-slate-500 text-sm">
                     No matches currently scheduled for your teams.
                   </div>
                ) : (
                  <div className="space-y-6">
                    {myFeedLive.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Live Now
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {myFeedLive.map(match => <MatchCard key={match.id} match={match} />)}
                        </div>
                      </div>
                    )}
                    {myFeedUpcoming.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          Upcoming
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {myFeedUpcoming.slice(0, 4).map(match => <MatchCard key={match.id} match={match} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* General Live & Upcoming */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-500" />
                World Football
              </CardTitle>
              <Link to="/livescore" className="text-sm font-medium text-blue-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              {featuredLive.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  {featuredLive.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-slate-500 border-b border-slate-100">
                  <p>No featured live matches right now.</p>
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Upcoming Highlights
                </h3>
                {isLoadingUpcoming ? (
                  <div className="grid gap-3 sm:grid-cols-2"><div className="h-20 animate-pulse rounded-lg bg-slate-100"></div></div>
                ) : upcomingMatches && upcomingMatches.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {upcomingMatches.slice(0, 4).map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No upcoming matches today.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Results */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-slate-600" />
                Recent Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoadingRecent ? (
                <div className="grid gap-3 sm:grid-cols-2"><div className="h-20 animate-pulse rounded-lg bg-slate-100"></div></div>
              ) : recentMatches && recentMatches.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recentMatches.slice(0, 4).map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent matches found.</p>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column (Sidebar: Team Browser, Standings, News) */}
        <div className="space-y-6">
          
          {/* Favorites Widget / Team Browser */}
          <Card className="relative overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                  <Star className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                  Your Teams
                </CardTitle>
                <button 
                  onClick={() => setShowTeamBrowser(!showTeamBrowser)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm transition-all hover:border-blue-200 hover:shadow"
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
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredLeagues.length > 0 ? filteredLeagues.map(league => (
                      <div key={league.name} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <button 
                          onClick={() => setExpandedLeague(expandedLeague === league.name ? null : league.name)}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <span className="font-bold text-slate-800 text-sm">{league.name}</span>
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
                                  className={\`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all \${
                                    isSelected 
                                      ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                                      : 'border-transparent hover:bg-slate-50'
                                  }\`}
                                >
                                  <span className={\`text-sm font-medium \${isSelected ? 'text-blue-900' : 'text-slate-700'}\`}>
                                    {team.name}
                                  </span>
                                  {isSelected && <Check className="h-4 w-4 text-blue-500" />}
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
                    <div key={team.id} className="group flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-full transition-all">
                      <span className="text-xs font-bold text-slate-800">{team.name}</span>
                      <button 
                        onClick={() => toggleFavorite(team)}
                        className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Star className="h-6 w-6 text-slate-400 mb-1" />
                    <p className="font-semibold text-slate-700 text-sm">No teams added</p>
                    <button 
                      onClick={() => setShowTeamBrowser(true)}
                      className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full transition-colors"
                    >
                      Browse Teams
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top News Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Latest Stories
              </CardTitle>
              <Link to="/news" className="text-xs font-medium text-blue-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {isLoadingNews ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                </div>
              ) : topNews.length > 0 ? (
                topNews.map((article, index) => (
                  <React.Fragment key={article.id}>
                    <div className="space-y-1 group">
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                        {article.category || 'News'}
                      </p>
                      <Link to={\`/news/\${article.id}\`}>
                        <h4 className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
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
`;

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
