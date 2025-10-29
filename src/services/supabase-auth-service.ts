import { User, SupabaseClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import {
  AuthState,
  IAuthService,
  MfaEnrollResult,
  MfaVerifyResult,
  SignOutResult,
  SignUpResult,
} from "./i-auth-service";

export const SupabaseAuthService = (parm: {
  supabase: SupabaseClient<any>;
  isDeviceRemembered: (userId: string) => Promise<boolean>;
}): IAuthService => {
  const supabase = parm.supabase;
  const isDeviceRemembered = parm.isDeviceRemembered;
  return {
    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback: (state: AuthState) => void) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, _session) => {

        
        try {
          setTimeout(async () => {
            let authState: AuthState;
            try {
              authState = await this.getAuthState();
            } catch (error) {
              authState = {
                session: _session,
                user: null,
                status: "unauthenticated",
              };
            }

          

            if (
              _event == "MFA_CHALLENGE_VERIFIED" &&
              authState.status == "mfaChallengePending"
            ) {
              authState.status = "authenticated";
            }
            callback(authState);
          });
        } catch (error) {
          console.error("Error getting auth state:", error);
          callback({
            status: "unauthenticated",
            session: null,
            user: null,
          });
        }
      });

      return () => subscription.unsubscribe();
    },

    /**
     * Get current auth state (like onAuthStateChange)
     */
    async getAuthState(): Promise<AuthState> {
      try {
        const { data } = await supabase.auth.getSession();

        const session = data.session;

        if (!session?.user) {
          
          return {
            status: "unauthenticated",
            session: null,
            user: null,
          };
        }

        const user = session.user;

        try {
          const mfaState = await _determineMfaState(
            supabase,
            user.id,
            isDeviceRemembered
          );

          if (!mfaState.needsMfa) {
            return {
              status: "authenticated",
              session,
              user,
            };
          } else if (mfaState.challengeId) {
            return {
              status: "mfaChallengePending",
              session,
              user,
              ...mfaState,
            };
          } else {
            return {
              status: "mfaSetupPending",
              session,
              user,
              ...mfaState,
            };
          }
        } catch (error) {
          console.error("Error determining MFA state:", error);
          throw error;
          // return {
          //   status: "mfaChallengePending", // fallback
          //   session,
          //   user,
          // };
        }
      } catch (error) {
        console.error("getAuthState:", error);
        return {
          status: "unauthenticated",
          session: null,
          user: null,
        };
      }
    },

    async signIn(param: {
      email: string;
      password: string;
    }): Promise<{ error: any | null }> {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: param.email,
        password: param.password,
      });

      if (error) {
        return { error };
      }

      const user = data?.user;
      if (!user) {
        return { error: new Error("User not found after sign-in") };
      }

      //user status will change throw supabase.auth.onAuthStateChange

      return { error: null };
    },

    async signUp(param: {
      email: string;
      password: string;
      displayName?: string;
      companyName?: string;
      emailRedirectTo: string;
    }): Promise<SignUpResult> {
      try {
        const metadata: any = {};
        if (param.displayName) metadata.display_name = param.displayName;
        if (param.companyName) metadata.company_name = param.companyName;

        const { data, error } = await supabase.auth.signUp({
          email: param.email,
          password: param.password,
          options: {
            emailRedirectTo: param.emailRedirectTo,
            data: Object.keys(metadata).length > 0 ? metadata : undefined,
          },
        });

        // Handle actual signup errors
        if (error) {
          return {
            success: false,
            message: error.message,
            error: "SignupError",
          };
        }

        // -----------------------------
        // Supabase behavior: when a user already exists but has NOT confirmed their email,
        // it returns `data.user` but the `identities` array is empty.
        // This allows the client to detect the "Account exists but unverified" case.
        // -----------------------------
        // Handle "email already exists but not confirmed" case
        if (
          data?.user &&
          (!data.user.identities || data.user.identities.length === 0)
        ) {
          return {
            success: false,
            message:
              "An account with this email already exists but is not yet verified. Please check your email for confirmation.",
            error: "AccountExistsUnverified",
          };
        }

        // Success case
        return {
          success: true,
          message:
            "Account created successfully! Please check your email to verify your account before signing in.",
        };
      } catch (err: any) {
        console.error("SupabaseAuthService - signUp:", err);
        return {
          success: false,
          message: "Unexpected error. Please try again.",
          error: "UnexpectedError",
        };
      }
    },
    async signOut(): Promise<SignOutResult> {
      
      const { error } = await supabase.auth.signOut();
      if (!error) return { success: true };
      return { success: false, errorMessage: error.message };
    },

    async resetPasswordForEmail(param: {
      email: string;
      redirectTo: string;
    }): Promise<{ error?: any }> {
      const { error } = await supabase.auth.resetPasswordForEmail(param.email, {
        redirectTo: param.redirectTo,
      });

      return { error };
    },

    //MFA Related-----------------------------------------------
    async enrollMfaTotp(): Promise<MfaEnrollResult> {
      try {
        // Remove any unverified factors first
        const { data: existingFactors } = await supabase.auth.mfa.listFactors();
        if (existingFactors?.all) {
          for (const factor of existingFactors.all) {
            if (factor.status === "unverified") {
              await supabase.auth.mfa.unenroll({ factorId: factor.id });
            }
          }
        }

        // Enroll new TOTP factor
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Authenticator App",
        });
        if (error) throw error;
        if (!data) throw new Error("MFA enrollment returned no data");

        const { id, totp } = data;
        const secret = totp.secret;
        const qrData = totp.uri || totp.qr_code;

        if (!qrData) throw new Error("No QR code data found in response");

        let qrCodeUrl: string;

        // Handle different QR data formats returned by Supabase
        if (qrData.startsWith("data:")) {
          // Already a valid data URL
          qrCodeUrl = qrData;
        } else if (qrData.trim().startsWith("<svg")) {
          // Supabase may return SVG markup
          qrCodeUrl = `data:image/svg+xml;base64,${btoa(qrData)}`;
        } else {
          // Generate QR code image manually
          qrCodeUrl = await QRCode.toDataURL(qrData, {
            width: 256,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" },
            errorCorrectionLevel: "L",
          });
        }

        return {
          success: true,
          data: {
            factorId: id,
            secret,
            qrCodeUrl,
          },
        };
      } catch (error: any) {
        console.error("enrollMfaTotpFull error:", error);
        return { success: false, error };
      }
    },

    async verifyMfaTotp(param: {
      factorId: string;
      code: string;
      challengeId?: string;
    }): Promise<MfaVerifyResult> {
      try {
        if (!param.challengeId) {
          // Create a challenge first
          const { data: challenge, error: challengeError } =
            await supabase.auth.mfa.challenge({ factorId: param.factorId });
          if (challengeError) throw challengeError;

          param.challengeId = challenge.id;
        }

        // Verify with challenge ID
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: param.factorId,
          challengeId: param.challengeId,
          code: param.code,
        });
        if (error) throw error;

        return { success: true, data };
      } catch (error: any) {
        console.error("verifyMfaTotp error:", error);
        return { success: false, error };
      }
    },

    async listFactors(): Promise<
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
    > {
      return await supabase.auth.mfa.listFactors();
    },

    async challenge(param: {
      factorId: string;
    }): Promise<{ error?: any; challengeId?: string }> {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: param.factorId });

      if (challengeError) {
        console.error("Error creating MFA challenge:", challengeError);
        return { error: challengeError };
      }

      return { challengeId: challenge?.id };
    },

    /**
     * Internal helper — exposed only for testing
     */
    private: {
      _determineMfaState,
    },
  };

  //private --------------
  /**
   * Determines the current MFA state of a user.
   *
   * This function is used to decide:
   * 1. If the user needs to complete MFA setup.
   * 2. If the user should be prompted for an MFA challenge.
   * 3. If the user can skip MFA entirely (device remembered).
   *
   * @param supabase - Supabase client
   * @param user - Current signed-in user
   * @param isDeviceRemembered - Function to check if the current device is remembered
   */
  async function _determineMfaState(
    supabase: SupabaseClient<any>,
    userId: string,
    isDeviceRemembered: (userId: string) => Promise<boolean>
  ): Promise<{
    needsMfa: boolean;
    challengeId?: string;
    factorId?: string;
  }> {
    // 1️⃣ Check if the device is remembered
    // Supabase can remember a device, which means the user does NOT need MFA.
    // If the device is remembered, we skip MFA entirely.
    if (await isDeviceRemembered(userId)) {
      return { needsMfa: false };
    }

    // 2️⃣ Fetch MFA factors from Supabase
    // - `allFactors` includes all factors (verified + unverified)
    // - `verifiedTotpFactors` includes only verified TOTP factors
    const res = await supabase.auth.mfa.listFactors();

    // If there’s an error fetching factors, throw it.
    if (res.error) {
      console.error("Error fetching MFA factors:", res.error);
      throw res.error;
    }

    const allFactors = res.data?.all ?? [];
    const verifiedTotpFactors = res.data?.totp ?? [];

    // 3️⃣ Determine the user's MFA status based on factors

    // 🟢 Case 1: User has no MFA factors at all
    // - This means MFA has never been set up.
    // - Return `needsMfa: true` so the frontend can show QR code/setup flow.
    if (allFactors.length === 0) {
      return { needsMfa: true };
    }

    // 🟡 Case 2: User has factors but none are verified
    // - The user started MFA setup (e.g., generated a QR code) but hasn't verified it.
    // - Return `needsMfa: true` to prompt the user to complete MFA setup.
    if (verifiedTotpFactors.length === 0 && allFactors.length > 0) {
      return { needsMfa: true };
    }

    // 🔵 Case 3: User has verified MFA factors
    // - The user completed MFA setup previously.
    // - We now need to generate a new MFA challenge for sign-in verification.
    if (verifiedTotpFactors.length > 0) {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: verifiedTotpFactors[0].id,
        });


      // If challenge creation fails, throw the error to handle it upstream
      if (challengeError) {
        console.error("Error creating MFA challenge:", challengeError);
        throw challengeError;
      }

      return {
        needsMfa: true, // User must complete the MFA challenge
        challengeId: challengeData?.id, // Challenge ID for verification
        factorId: verifiedTotpFactors[0].id, // Factor used
      };
    }

    // 4️⃣ Default: no MFA needed
    // - This is a fallback; typically won't happen with Supabase behavior
    return { needsMfa: false };
  }
};
