import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

interface UserData {
  email: string;
  displayName: string;
  role: 'user' | 'editor' | 'moderator' | 'admin';
  createdAt: number;
  favoriteTeams?: string[];
}

interface AuthContextType {
  user: any | null; // using any for generic InsForge User type for now
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSessionAndUser = async () => {
    try {
      const { data: { user: currentUser } } = await insforge.auth.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUserData(null);
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndUser();

    const unsubscribe = insforge.auth.onAuthStateChange(() => {
      fetchSessionAndUser();
    });

    
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

  return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.id]);

  const fetchUserData = async (currentUser: any) => {
    try {
      const { data, error } = await insforge.database
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data && !error) {
        // Force upgrade if they are the special admin but DB says otherwise
        if (currentUser.email === 'kisakyearon72@gmail.com' && data.role !== 'admin') {
           await insforge.database.from('users').update({ role: 'admin' }).eq('id', currentUser.id);
           data.role = 'admin';
        }
        
        const mappedData: UserData = {
          email: data.email,
          displayName: data.display_name,
          role: data.role as any,
          favoriteTeams: data.favorite_teams || [],
          createdAt: data.created_at,
        };
        setUserData(mappedData);
      } else {
        // Handle case where user is created but row isn't yet
        if (currentUser.email === 'kisakyearon72@gmail.com') {
           const adminData = {
             id: currentUser.id,
             email: currentUser.email,
             display_name: currentUser.user_metadata?.display_name || 'Admin',
             role: 'admin',
             favorite_teams: [],
             created_at: Date.now(),
             updated_at: Date.now()
           };
           await insforge.database.from('users').insert([adminData]);
           
           setUserData({
             email: currentUser.email,
             displayName: adminData.display_name,
             role: 'admin',
             createdAt: adminData.created_at
           });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await insforge.auth.signOut();
    } catch (error) {
      console.error('Logout error', error);
    }
  };

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

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout, updateUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
