import React, { createContext, useContext, useEffect, useState } from 'react';
import { neonAuthClient } from '../../lib/neon-auth';

interface NeonAuthContextType {
  user: any;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: string) => Promise<void>;
}

const NeonAuthContext = createContext<NeonAuthContextType | undefined>(undefined);

export const useNeonAuth = () => {
  const context = useContext(NeonAuthContext);
  if (!context) {
    throw new Error('useNeonAuth must be used within a NeonAuthProvider');
  }
  return context;
};

interface NeonAuthProviderProps {
  children: React.ReactNode;
}

export const NeonAuthProvider: React.FC<NeonAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const currentUser = await neonAuthClient.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.log('No authenticated user found');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await neonAuthClient.signInWithCredentials({
        email,
        password,
      });
      setUser(result.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const result = await neonAuthClient.signUpWithCredentials({
        email,
        password,
        name,
      });
      setUser(result.user);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await neonAuthClient.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const signInWithOAuth = async (provider: string) => {
    try {
      await neonAuthClient.signInWithOAuth({
        provider,
        redirectUrl: window.location.origin + '/auth/callback',
      });
    } catch (error) {
      console.error('OAuth sign in error:', error);
      throw error;
    }
  };

  const value: NeonAuthContextType = {
    user,
    isLoading,
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
