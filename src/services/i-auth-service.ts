import { User, Session } from "@supabase/supabase-js";

export type AuthStatus =
  /** User is not signed in at all. No session exists. */
  | "unauthenticated"

  /** User is fully signed in with MFA (if required) completed. */
  | "authenticated"

  /** User has started MFA setup (e.g., generated QR code) but has not verified it yet. */
  | "mfaSetupPending"

  /** User must complete an MFA challenge (TOTP code) to finish sign-in. */
  | "mfaChallengePending";

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  needsMfa?: boolean;
  challengeId?: string;
  factorId?: string;
}

export interface SignUpResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface SignInResult {
  error: any | null;
}

export interface MfaEnrollResult {
  success: boolean;
  data?: { factorId: string; secret: string; qrCodeUrl: string };
  error?: any;
}

export interface MfaVerifyResult {
  success: boolean;
  data?: any;
  error?: any;
}

export interface SignOutResult {
  success: boolean;
  errorMessage?: string;
}

export interface IAuthService {
  onAuthStateChange(callback: (state: AuthState) => void): () => void;
  getAuthState(): Promise<AuthState>;

  signIn(param: { email: string; password: string }): Promise<SignInResult>;
  signUp(param: {
    email: string;
    password: string;
    displayName?: string;
    companyName?: string;
    emailRedirectTo: string;
  }): Promise<SignUpResult>;
  signOut(): Promise<SignOutResult>;

  resetPasswordForEmail(param: {
    email: string;
    redirectTo: string;
  }): Promise<{ error?: any }>;

  enrollMfaTotp(): Promise<MfaEnrollResult>;
  verifyMfaTotp(param: {
    factorId: string;
    code: string;
    challengeId?: string;
  }): Promise<MfaVerifyResult>;

  listFactors(): Promise<
    | {
        data: {
          /** All available factors (verified and unverified). */
          all: any[];

          /** Only verified TOTP factors. (A subset of `all`.) */
          totp: any[];
        };
        error: null;
      }
    | { data: null; error: any }
  >;

  challenge(param: {
    factorId: string;
  }): Promise<{ error?: any; challengeId?: string }>;

  /**
   * Internal helper — exposed only for testing
   */
  private: any;
}
