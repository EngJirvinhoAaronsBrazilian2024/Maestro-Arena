import {
  Trophy,
  Target,
  Users,
  Globe,
  Shield,
  BookOpen,
  Flag,
  Flame,
  Sparkles,
  Award,
} from 'lucide-react';
import { QuizCategory, QuizDifficulty } from '../../types/quiz';

export interface CategoryMeta {
  id: QuizCategory | 'All';
  title: string;
  subtitle: string;
  tag: string;
  group: 'all' | 'leagues' | 'tournaments' | 'players' | 'history';
  icon: any;
  ovrRating: number;
  futCode: string;
}

export type CategoryGroupFilter = 'all' | 'leagues' | 'tournaments' | 'players' | 'history';

export const DIFFICULTIES: QuizDifficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];

export const DIFFICULTY_TIMES: Record<QuizDifficulty, number> = {
  Easy: 30,
  Medium: 25,
  Hard: 20,
  Expert: 15,
};

export const DIFFICULTY_CONFIG: Record<
  QuizDifficulty,
  {
    label: string;
    time: number;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    dotColor: string;
  }
> = {
  Easy: {
    label: 'Easy',
    time: 30,
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  Medium: {
    label: 'Medium',
    time: 25,
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  Hard: {
    label: 'Hard',
    time: 20,
    badgeBg: 'bg-orange-50',
    badgeBorder: 'border-orange-200',
    badgeText: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  Expert: {
    label: 'Expert',
    time: 15,
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-700',
    dotColor: 'bg-rose-600',
  },
};

export const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20, 25, 50];

export const CATEGORY_ITEMS: CategoryMeta[] = [
  { id: 'All', title: 'Mixed Arena', subtitle: 'Random questions across all football themes', tag: 'All Themes', group: 'all', icon: Sparkles, ovrRating: 94, futCode: 'ALL' },
  { id: 'Premier League', title: 'Premier League', subtitle: 'English giants, drama, history & goals', tag: 'England', group: 'leagues', icon: Shield, ovrRating: 96, futCode: 'EPL' },
  { id: 'UEFA Champions League', title: 'Champions League', subtitle: "Europe's supreme club crown & nights", tag: 'Europe', group: 'tournaments', icon: Trophy, ovrRating: 99, futCode: 'UCL' },
  { id: 'FIFA World Cup', title: 'World Cup', subtitle: 'Global legends, iconic finals & heroes', tag: 'World', group: 'tournaments', icon: Globe, ovrRating: 98, futCode: 'WCP' },
  { id: 'African Cup of Nations', title: 'AFCON', subtitle: 'Total African glory, goals & champions', tag: 'Africa', group: 'tournaments', icon: Trophy, ovrRating: 95, futCode: 'CAF' },
  { id: 'Football Players', title: 'Legends', subtitle: "Ballon d'Or icons, stats & all-time greats", tag: 'Icons', group: 'players', icon: Award, ovrRating: 97, futCode: 'LEG' },
  { id: 'La Liga', title: 'La Liga', subtitle: 'Spanish royalty, El Clásico & magicians', tag: 'Spain', group: 'leagues', icon: Shield, ovrRating: 93, futCode: 'ESP' },
  { id: 'Serie A', title: 'Serie A', subtitle: 'Tactical masters, scudetto & legends', tag: 'Italy', group: 'leagues', icon: Shield, ovrRating: 92, futCode: 'ITA' },
  { id: 'Bundesliga', title: 'Bundesliga', subtitle: 'High-octane attack, records & derbies', tag: 'Germany', group: 'leagues', icon: Shield, ovrRating: 91, futCode: 'GER' },
  { id: 'Football Clubs', title: 'Football Clubs', subtitle: 'Historic stadiums, badges & anthems', tag: 'Clubs', group: 'leagues', icon: Shield, ovrRating: 90, futCode: 'CLB' },
  { id: 'African Football', title: 'African Football', subtitle: 'Continental powerhouses & superstars', tag: 'Africa', group: 'leagues', icon: Flag, ovrRating: 89, futCode: 'AFR' },
  { id: 'UEFA Europa League', title: 'Europa League', subtitle: 'Thrilling European knockout showdowns', tag: 'Europe', group: 'tournaments', icon: Award, ovrRating: 88, futCode: 'UEL' },
  { id: 'Football History', title: 'Football History', subtitle: 'Foundations, vintage moments & classic eras', tag: 'History', group: 'history', icon: BookOpen, ovrRating: 87, futCode: 'HIS' },
  { id: 'Football Records', title: 'Football Records', subtitle: 'Unbelievable milestones, hat-tricks & totals', tag: 'Records', group: 'history', icon: Flame, ovrRating: 89, futCode: 'REC' },
  { id: 'Football Rules', title: 'Rules & VAR', subtitle: 'Laws of the pitch, refereeing & penalties', tag: 'Tactics', group: 'history', icon: Target, ovrRating: 86, futCode: 'LAW' },
  { id: 'Famous Managers', title: 'Famous Managers', subtitle: 'Tactical masterminds, dynasties & silver', tag: 'Tactics', group: 'players', icon: Users, ovrRating: 92, futCode: 'MGR' },
  { id: 'World Football', title: 'World Football', subtitle: 'International clashes, nations & continental cups', tag: 'Global', group: 'all', icon: Globe, ovrRating: 90, futCode: 'WLD' },
];
