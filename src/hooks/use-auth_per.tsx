import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isDeviceRemembered, clearDeviceToken } from '@/lib/device-remember';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, displayName?: string, companyName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; needsMfa?: boolean; challengeId?: string; factorId?: string }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
  mfaFactors: any[];
  refreshMfaFactors: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string, companyName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const metadata: any = {};
    if (displayName) metadata.display_name = displayName;
    if (companyName) metadata.company_name = companyName;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: Object.keys(metadata).length > 0 ? metadata : undefined
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If login was successful, check if MFA is required
    if (!error && data?.user) {
      // Check if device is remembered for this user
      if (isDeviceRemembered(data.user.id)) {
        return { error: null };
      }

      // Check if user has MFA factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.all && factors.all.length > 0) {
        // Create MFA challenge
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: factors.all[0].id
        });
        
        if (challengeError) {
          return { error: challengeError };
        }

        return { 
          error: null, 
          needsMfa: true, 
          challengeId: challenge.id, 
          factorId: factors.all[0].id 
        };
      }
    }

    // Check if MFA is required but authentication succeeded partially (legacy flow)
    if (error?.message?.includes('MFA')) {
      // Get user's MFA factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.all && factors.all.length > 0) {
        // Create MFA challenge
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: factors.all[0].id
        });
        
        if (challengeError) {
          return { error: challengeError };
        }

        return { 
          error: null, 
          needsMfa: true, 
          challengeId: challenge.id, 
          factorId: factors.all[0].id 
        };
      }
    }

    return { error };
  };

  const signOut = async () => {
    clearDeviceToken(); // Clear device remembering token on logout
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshMfaFactors = async () => {
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (!error && factors && factors.all) {
        setMfaFactors(factors.all);
      }
    } catch (error) {
      console.error('Error fetching MFA factors:', error);
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    mfaFactors,
    refreshMfaFactors
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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