const fs = require('fs');
let authContent = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const badBlock = `      const updateUserData = async (updates: Partial<UserData>) => {
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

authContent = authContent.replace(badBlock, '');
fs.writeFileSync('src/context/AuthContext.tsx', authContent, 'utf8');
