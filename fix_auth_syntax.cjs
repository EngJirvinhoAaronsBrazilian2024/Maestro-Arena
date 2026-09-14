const fs = require('fs');
let authContent = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

// We have the wrong updateUserData inside useEffect. Let's remove it and add it properly.
const badUpdateFunc = `    const updateUserData = async (updates: Partial<UserData>) => {
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

  return () => {`;

authContent = authContent.replace(badUpdateFunc, '    return () => {');

// Now put it just before the final return of the provider
const logoutFunc = `  const logout = async () => {
    try {
      await insforge.auth.signOut();
    } catch (error) {
      console.error('Logout error', error);
    }
  };`;

const goodUpdateFunc = `  const updateUserData = async (updates: Partial<UserData>) => {
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
  };`;

authContent = authContent.replace(logoutFunc, logoutFunc + '\n\n' + goodUpdateFunc);

fs.writeFileSync('src/context/AuthContext.tsx', authContent, 'utf8');
