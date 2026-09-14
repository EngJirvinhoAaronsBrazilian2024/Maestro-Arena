const fs = require('fs');

const allLeagues = `const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
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
  ];`;

let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');
const oldLeaguesRegex = /const \[expandedLeague, setExpandedLeague\] = useState<string \| null>\(null\);[\s\S]*?name: 'Lille' \},\s*\]\s*\}\s*\];/;

homeContent = homeContent.replace(oldLeaguesRegex, allLeagues);
fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');

