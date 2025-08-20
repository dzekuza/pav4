import React, { createContext, useContext, useEffect, useState } from 'react';
import { neonAuthClient, NeonAuthUser, stack } from '../../lib/neon-auth';

interface NeonAuthContextType {
  user: NeonAuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ success: boolean; url?: string; error?: string }>;
}

const NeonAuthContext = createContext<NeonAuthContextType | undefined>(undefined);

export const useNeonAuth = () => {
  const context = useContext(NeonAuthContext);
  if (context === undefined) {
    throw new Error('useNeonAuth must be used within a NeonAuthProvider');
  }
  return context;
};

interface NeonAuthProviderProps {
  children: React.ReactNode;
}

export const NeonAuthProvider: React.FC<NeonAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<NeonAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        const result = await neonAuthClient.getCurrentUser();
        if (result.success && result.user) {
          setUser(result.user);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await neonAuthClient.signInWithCredentials(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const result = await neonAuthClient.signUpWithCredentials(email, password, name);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const signOut = async () => {
    await neonAuthClient.signOut();
    setUser(null);
  };

  const signInWithOAuth = async (provider: 'google' | 'github' | 'discord') => {
    return await neonAuthClient.signInWithOAuth(provider);
  };

  const value: NeonAuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
  };

  return (
    <NeonAuthContext.Provider value={value}>
      {children}
    </NeonAuthContext.Provider>
  );
};
