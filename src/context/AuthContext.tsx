import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

export interface UserData {
  id?: string;
  email: string;
  displayName: string;
  role: 'user' | 'editor' | 'moderator' | 'admin';
  createdAt: number;
  favoriteTeams?: string[];
}

export interface AuthContextType {
  user: any | null; // using any for generic InsForge User type for now
  userData: UserData | null;
  profile: UserData | null;
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

      const isSpecialAdmin = currentUser.email?.toLowerCase() === 'kisakyearon72@gmail.com';

      if (data && !error) {
        // Force upgrade if they are the designated admin but DB says otherwise
        if (isSpecialAdmin && data.role !== 'admin') {
           await insforge.database.from('users').update({ role: 'admin' }).eq('id', currentUser.id);
           data.role = 'admin';
        }
        
        const mappedData: UserData = {
          id: data.id || currentUser.id,
          email: data.email,
          displayName: data.display_name,
          role: data.role as any,
          favoriteTeams: data.favorite_teams || [],
          createdAt: data.created_at,
        };
        setUserData(mappedData);
      } else {
        // User is authenticated in auth.users, but missing public.users record:
        // Automatically provision their public.users profile row
        const role = isSpecialAdmin ? 'admin' : 'user';
        const displayName = currentUser.profile?.name || currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User';
        const newUserData = {
          id: currentUser.id,
          email: (currentUser.email || '').toLowerCase(),
          display_name: displayName,
          role: role,
          created_at: Date.now()
        };
        
        const { error: insertErr } = await insforge.database.from('users').insert([newUserData]);
        if (insertErr) {
          console.warn("Could not insert user profile in fetchUserData:", insertErr);
        }
        
        setUserData({
          id: newUserData.id,
          email: newUserData.email,
          displayName: newUserData.display_name,
          role: role as any,
          favoriteTeams: [],
          createdAt: newUserData.created_at
        });
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
      const dbUpdates: any = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      
      const { error } = await insforge.database
        .from('users')
        .update(dbUpdates)
        .eq('id', user.id);
      if (!error && userData) {
        setUserData({ ...userData, ...updates });
      }
    } catch (e) {
      console.error('Failed to update user data', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, profile: userData, loading, logout, updateUserData }}>
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
