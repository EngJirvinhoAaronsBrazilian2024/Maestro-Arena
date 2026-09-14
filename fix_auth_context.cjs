const fs = require('fs');
let authContent = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

if(!authContent.includes('favoriteTeams?: string[];')) {
    authContent = authContent.replace(
        'createdAt: number;',
        'createdAt: number;\n  favoriteTeams?: string[];'
    );
}

if(!authContent.includes('mappedData: UserData = {')) {
    // it includes it, we saw it
}
authContent = authContent.replace(
    'role: data.role || \'user\',',
    'role: data.role || \'user\',\n          favoriteTeams: data.favoriteTeams || [],'
);

if(!authContent.includes('updateUserData: (')) {
    authContent = authContent.replace(
        'logout: () => Promise<void>;',
        'logout: () => Promise<void>;\n  updateUserData: (data: Partial<UserData>) => Promise<void>;'
    );
    
    const updateFunction = `
  const updateUserData = async (updates: Partial<UserData>) => {
    if (!user) return;
    try {
      const { error } = await insforge.database
        .from('users')
        .update(updates)
        .eq('id', user.id);
      if (!error && userData) {
        setUserData({ ...userData, ...updates });
      }
    } catch (e) {
      console.error('Failed to update user data', e);
    }
  };

  return (`;
    authContent = authContent.replace('return (', updateFunction);
    
    authContent = authContent.replace(
        'value={{ user, userData, loading, logout }}',
        'value={{ user, userData, loading, logout, updateUserData }}'
    );
}

fs.writeFileSync('src/context/AuthContext.tsx', authContent, 'utf8');
