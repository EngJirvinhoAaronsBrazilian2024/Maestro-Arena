const fs = require('fs');
let authContent = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

authContent = authContent.replace(
    'role: data.role as any,',
    'role: data.role as any,\n          favoriteTeams: data.favorite_teams || [],'
);

authContent = authContent.replace(
    "role: 'admin',",
    "role: 'admin',\n             favorite_teams: [],"
);

authContent = authContent.replace(
    "role: 'user',",
    "role: 'user',\n             favorite_teams: [],"
);

fs.writeFileSync('src/context/AuthContext.tsx', authContent, 'utf8');
