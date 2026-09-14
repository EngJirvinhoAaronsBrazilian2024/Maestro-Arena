const fs = require('fs');
let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Update imports for useFavorites
if (!homeContent.includes("useFavorites")) {
    homeContent = homeContent.replace(
        "import { useAuth } from '../context/AuthContext';",
        "import { useAuth } from '../context/AuthContext';\nimport { useFavorites } from '../hooks/useFavorites';"
    );
}

// Update the variables
const hookRegex = /const \{ user, userData, updateUserData \} = useAuth\(\) as any;[\s\S]*?await updateUserData\(\{ favorite_teams: newFavorites, favoriteTeams: newFavorites \}\);\n  };/;
const replacementHooks = `const { user, userData } = useAuth() as any;
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [showTeamBrowser, setShowTeamBrowser] = useState(false);
  const popularTeams = [
    { id: 'team_42', type: 'team' as const, name: 'Arsenal' },
    { id: 'team_33', type: 'team' as const, name: 'Manchester United' },
    { id: 'team_86', type: 'team' as const, name: 'Real Madrid' },
    { id: 'team_81', type: 'team' as const, name: 'Barcelona' },
    { id: 'team_5', type: 'team' as const, name: 'Bayern Munich' },
    { id: 'team_85', type: 'team' as const, name: 'PSG' },
    { id: 'team_109', type: 'team' as const, name: 'Juventus' },
    { id: 'team_40', type: 'team' as const, name: 'Liverpool' },
    { id: 'team_50', type: 'team' as const, name: 'Manchester City' },
    { id: 'team_49', type: 'team' as const, name: 'Chelsea' },
    { id: 'team_113', type: 'team' as const, name: 'AC Milan' },
    { id: 'team_108', type: 'team' as const, name: 'Inter Milan' }
  ];`;
homeContent = homeContent.replace(hookRegex, replacementHooks);

// Update the widget UI map functions
homeContent = homeContent.replace(
    'userFavorites.includes(team);',
    'isFavorite(team.id);'
);
homeContent = homeContent.replace(
    'onClick={() => toggleFavorite(team)}',
    'onClick={() => toggleFavorite(team)}'
);
homeContent = homeContent.replace(
    /key=\{team\}/g,
    'key={team.id}'
);
homeContent = homeContent.replace(
    /\{team\}/g,
    '{team.name}'
);
homeContent = homeContent.replace(
    /userFavorites\.length/g,
    'favorites.length'
);
homeContent = homeContent.replace(
    /userFavorites\.map\(team =>/g,
    'favorites.map(team =>'
);
homeContent = homeContent.replace(
    /popularTeams\.map\(team =>/g,
    'popularTeams.map(team =>'
);

// We need to fix the second toggleFavorite which had {team} as a string instead of object
// In userFavorites.map(team => ( ... onClick={() => toggleFavorite(team)} ... ))
// It should be fine since team is now a FavoriteItem.

fs.writeFileSync('src/pages/Home.tsx', homeContent, 'utf8');
