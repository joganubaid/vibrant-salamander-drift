import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type Profile = {
  user_id: string;
  display_name: string | null;
  role: 'student' | 'owner';
  created_at: string;
  updated_at: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Start loading as true

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const fetchUserProfile = async (currentUser: User) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user;
        setUser(currentUser ?? null);
        
        if (currentUser) {
          const userProfile = await fetchUserProfile(currentUser);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setLoading(false); // Set loading to false only after the listener has processed the initial state
      }
    );

    // Cleanup function for the effect
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array, runs once on mount

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};