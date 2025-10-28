import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { isDeviceRemembered, clearDeviceToken } from "@/lib/device-remember";
import { SupabaseAuthService } from "@/services/supabase-auth-service";
import {
  AuthStatus,
  MfaEnrollResult,
  MfaVerifyResult,
  SignInResult,
  SignOutResult,
  SignUpResult,
} from "@/services/i-auth-service";
import { supabase } from "@/integrations/supabase/client";

export interface AuthContextType {
  user: User | null;
  userAuthStatus: AuthStatus;

  signUp: (param: {
    email: string;
    password: string;
    displayName?: string;
    companyName?: string;
  }) => Promise<SignUpResult>;
  signIn: (param: { email: string; password: string }) => Promise<SignInResult>;
  signOut: (param:{clearDevice: boolean}) => Promise<SignOutResult>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: any }>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;

  enrollMfaTotp(): Promise<MfaEnrollResult>;
  verifyMfaTotp(param: {
    factorId: string;
    code: string;
    challengeId?: string;
  }): Promise<MfaVerifyResult>;

  mfaChallengeId?: string;
  mfaFactorId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | undefined>(
    undefined
  );
  const [mfaFactorId, setMfaFactorId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [userAuthStatus, setUserAuthStatus] =
    useState<AuthStatus>("unauthenticated");

  const supabaseAuthService = SupabaseAuthService({
    supabase,
    isDeviceRemembered,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const unsubscribe = supabaseAuthService.onAuthStateChange(
      ({ user, status, factorId, challengeId }) => {
        
        
        setUser(user);
        setUserAuthStatus(status);
        setMfaFactorId(factorId);
        setMfaChallengeId(challengeId);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const signUp = async (param: {
    email: string;
    password: string;
    displayName?: string;
    companyName?: string;
  }) => {
    const redirectUrl = `${window.location.origin}/confirm-email`;

    return await supabaseAuthService.signUp({
      email: param.email,
      password: param.password,
      emailRedirectTo: redirectUrl,
      displayName: param.displayName,
      companyName: param.companyName,
    });
  };

  const signIn = async (param: {
    email: string;
    password: string;
  }): Promise<SignInResult> => {
    return await supabaseAuthService.signIn({
      email: param.email,
      password: param.password,
    });
  };

  const signOut = async (param:{clearDevice: boolean}) => {
    if(param.clearDevice) clearDeviceToken(); // Clear device remembering token on logout
    return await supabaseAuthService.signOut();
  };

  const resetPasswordForEmail = async (
    email: string
  ): Promise<{ error?: any }> => {
    const { error } = await supabaseAuthService.resetPasswordForEmail({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  const value = {
    user,
    userAuthStatus,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    loading,
    mfaChallengeId,
    mfaFactorId,
    setLoading,
    enrollMfaTotp: supabaseAuthService.enrollMfaTotp,
    verifyMfaTotp: supabaseAuthService.verifyMfaTotp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
