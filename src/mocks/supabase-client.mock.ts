import { vi } from "vitest";

const mockUsers = [
  {
    id: "u1",
    email: "user1@example.com",
    password: "password1",
    mfaEnabled: true,
    identities: [{ provider: "email", id: "user1@example.com" }], // verified
  },
  {
    id: "u2",
    email: "user2@example.com",
    password: "password2",
    mfaEnabled: false,
    identities: [{ provider: "email", id: "user2@example.com" }], // verified
  },
];

let currentSession = null;
const authSubscribers = new Set();
let pendingMfaChallenge = null;

function notifySubscribers(event, session) {
  for (const cb of authSubscribers) {
    if (typeof cb === "function") {

      cb(event, session);
    }
  }
}

export const mockSupabaseClient = {
  auth: {
    onAuthStateChange: vi.fn((callback) => {
      if (typeof callback === "function") authSubscribers.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => authSubscribers.delete(callback),
          },
        },
      };
    }),

    getSession: vi.fn(() =>
      Promise.resolve({
        data: { session: currentSession },
        error: null,
      })
    ),

    signUp: vi.fn(async ({ email, password, options }) => {
      const existingUser = mockUsers.find((u) => u.email === email);

      if (existingUser) {
        // -----------------------------
        // Supabase behavior: when a user already exists but has NOT confirmed their email,
        // it returns `data.user` but the `identities` array is empty.
        // This allows the client to detect the "Account exists but unverified" case.
        // -----------------------------

        return {
          data: {
            user: {
              ...existingUser,
              identities: [], // empty to indicate unverified user
            },
            session: null,
          },
          error: null,
        };
      }

      // Create new user
      const newUser = {
        id: `u${mockUsers.length + 1}`,
        email,
        password,
        mfaEnabled: false,
        identities: [{ provider: "email", id: email }], // verified
        ...(options?.data || {}),
      };

      mockUsers.push(newUser);

      currentSession = {
        user: { id: newUser.id, email: newUser.email },
        access_token: `mock_token_${newUser.id}`,
      };

      notifySubscribers("SIGNED_IN", currentSession);

      return { data: { user: newUser, session: currentSession }, error: null };
    }),

    signInWithPassword: vi.fn(async ({ email, password }) => {
      const user = mockUsers.find(
        (u) => u.email === email && u.password === password
      );
      if (!user) {
        return { data: null, error: new Error("Invalid credentials") };
      }

      currentSession = {
        user: { id: user.id, email: user.email },
        access_token: "mock_token_" + user.id,
      };

      if (user.mfaEnabled) {
        pendingMfaChallenge = {
          id: "challenge_" + user.id,
          factor_id: "factor_" + user.id,
          user,
        };

        notifySubscribers("MFA_CHALLENGE", {
          challengeId: pendingMfaChallenge.id,
          factorId: pendingMfaChallenge.factor_id,
          user,
        });

        return {
          data: {
            session: null,
            user,
            challenge: {
              id: pendingMfaChallenge.id,
              factor_id: pendingMfaChallenge.factor_id,
            },
          },
          error: null,
        };
      }

      notifySubscribers("SIGNED_IN", currentSession);
      return { data: { session: currentSession, user }, error: null };
    }),

    signOut: vi.fn(async () => {
    
      currentSession = null;
      notifySubscribers("SIGNED_OUT", null);
      return { error: null };
    }),

    resetPasswordForEmail: vi.fn(
      async (email: string, options: { redirectTo: string }) => {
        const user = mockUsers.find((u) => u.email === email);
        if (!user) return { data: null, error: new Error("User not found") };
        return { data: { emailSent: true }, error: null };
      }
    ),

    mfa: {
      /**
       * Creates an MFA challenge for the user.
       *
       * Supabase behavior:
       * - Only generates a challenge if the user has a verified MFA factor.
       * - After a challenge is verified via `verify()`, the challenge is cleared.
       * - If you call `challenge()` with no pending challenge, Supabase returns an empty response.
       *
       * In this mock:
       * - `pendingMfaChallenge` stores the current challenge.
       * - Calling `challenge()` after `verify()` will not throw, but return `null` to mimic Supabase.
       */
      challenge: vi.fn(async () => {
        // if no pending challenge, create a new mock one automatically
        if (!pendingMfaChallenge) {
          const fakeChallenge = {
            id: "challenge_" + Date.now(),
            factor_id: "factor1",
          };
          pendingMfaChallenge = {
            ...fakeChallenge,
            user: currentSession?.user,
          };
          return { data: fakeChallenge, error: null };
        }

        // otherwise, return the existing challenge
        return { data: pendingMfaChallenge, error: null };
      }),

      /**
       * Verifies an MFA challenge (TOTP code).
       *
       * Supabase behavior:
       * - If the challenge is correct, the user is fully signed in.
       * - The challenge is removed after verification.
       * - Frontend will receive `MFA_CHALLENGE_VERIFIED` event.
       *
       * In this mock:
       * - We update `currentSession` to reflect the fully signed-in user.
       * - We clear `pendingMfaChallenge` to prevent reusing it.
       */
      verify: vi.fn(async () => {
        if (!pendingMfaChallenge)
          return { data: null, error: new Error("No MFA challenge to verify") };

        const {
          user,
          id: challengeId,
          factor_id: factorId,
        } = pendingMfaChallenge;

        // User is now fully signed in
        currentSession = {
          user: { id: user.id, email: user.email },
          access_token: "mock_token_" + user.id,
        };

        notifySubscribers("MFA_CHALLENGE_VERIFIED", {
          session: currentSession,
          challengeId,
          factorId,
        });

        // Clear the challenge
        pendingMfaChallenge = null;

        return {
          data: {
            id: factorId,
            challengeId,
            verified: true,
          },
          error: null,
        };
      }),

      /**
       * Enrolls a new MFA factor (TOTP)
       *
       * Returns a mock factor with a QR code and secret.
       */
      enroll: vi.fn(async () =>
        Promise.resolve({
          data: {
            id: "factor1",
            factor: {
              id: "factor1",
              created_at: new Date().toISOString(),
              friendly_name: "Mock TOTP Factor",
              type: "totp",
              status: "verified",
            },
            totp: {
              secret: "abc123",
              uri: "otpauth://totp/mock?secret=abc123",
            },
          },
          error: null,
        })
      ),

      /**
       * Lists all MFA factors for the user
       *
       * Supabase behavior:
       * - `all` = all factors (verified + unverified)
       * - `totp` = only verified TOTP factors
       *
       * In this mock, we always return a verified factor for simplicity.
       */
      listFactors: vi.fn(async () =>
        Promise.resolve({
          data: {
            all: [
              {
                id: "factor1",
                friendly_name: "Mock TOTP Factor",
                type: "totp",
                status: "verified",
              },
            ],
            totp: [{ id: "factor1", secret: "abc123" }],
          },
          error: null,
        })
      ),
    },
  },
};

// Helpers for tests
export const __mockAuthHelpers = {
  mockUsers,
  notifySubscribers,

  getCurrentSession: () => currentSession,

  reset: () => {
    currentSession = null;
    pendingMfaChallenge = null;
    authSubscribers.clear();
  },

  /**
   * Simulates a full sign-in flow and persists session state.
   */
  setSignInResult: (result) => {
    mockSupabaseClient.auth.signInWithPassword.mockImplementation(
      async ({ email, password }) => {
        if (result?.error) {
          return { data: null, error: result.error };
        }

        let user = mockUsers.find((u) => u.email === email);
        if (!user) {
          user = {
            id: `u${mockUsers.length + 1}`,
            email,
            password,
            mfaEnabled: false,
            identities: [{ provider: "email", id: email }],
          };
          mockUsers.push(user);
        }

        if (result.data?.challenge) {
          // MFA challenge in progress
          pendingMfaChallenge = {
            id: result.data.challenge.id,
            factor_id: result.data.challenge.factor_id,
            user,
          };
          notifySubscribers("MFA_CHALLENGE", pendingMfaChallenge);
          return result;
        }

        // Persist session
        currentSession = result.data?.session || {
          user: { id: user.id, email: user.email },
          access_token: "mock_token_" + user.id,
        };

        notifySubscribers("SIGNED_IN", currentSession);
        return { data: { session: currentSession, user }, error: null };
      }
    );
  },

  /**
   * Simulates a sign-up and signs the user in if session data is provided.
   */
  setSignUpResult: (result) => {
    mockSupabaseClient.auth.signUp.mockImplementation(
      async ({ email, password }) => {
        if (result?.error) return { data: null, error: result.error };

        let user = mockUsers.find((u) => u.email === email);
        if (!user) {
          user = {
            id: `u${mockUsers.length + 1}`,
            email,
            password,
            mfaEnabled: false,
            identities: [{ provider: "email", id: email }],
          };
          mockUsers.push(user);
        }

        currentSession = result.data?.session || {
          user: { id: user.id, email: user.email },
          access_token: "mock_token_" + user.id,
        };

        notifySubscribers("SIGNED_IN", currentSession);

        return { data: { user, session: currentSession }, error: null };
      }
    );
  },

  /**
   * Simulates a full sign-out and clears the session.
   */
  setSignOutResult: (result) => {
    mockSupabaseClient.auth.signOut.mockImplementation(async () => {
      if (result?.error) return { error: result.error };

      currentSession = null;
      pendingMfaChallenge = null;

      notifySubscribers("SIGNED_OUT", null);
      return { error: null };
    });
  },

  /**
   * Simulates password reset flow.
   */
  setResetPasswordResult: (result) => {
    mockSupabaseClient.auth.resetPasswordForEmail.mockImplementation(
      async (email) => {
        if (result?.error) return { data: null, error: result.error };

        const user = mockUsers.find((u) => u.email === email);
        if (!user) return { data: null, error: new Error("User not found") };

        return { data: { emailSent: true }, error: null };
      }
    );
  },

  /**
   * Sets a pending MFA challenge (e.g., after sign-in requiring MFA).
   * Persists session and notifies subscribers.
   */
  setMfaChallenge: (challenge) => {
    if (!challenge) {
      pendingMfaChallenge = null;
      return;
    }

    const user =
      challenge.user ||
      currentSession?.user ||
      mockUsers.find((u) => u.id === "u1");
    if (!user) throw new Error("Cannot set MFA challenge without user");

    // Persist session if missing
    if (!currentSession) {
      currentSession = {
        user: { id: user.id, email: user.email },
        access_token: "mock_token_" + user.id,
      };
      notifySubscribers("SIGNED_IN", currentSession);
    }

    pendingMfaChallenge = { ...challenge, user };
    notifySubscribers("MFA_CHALLENGE", {
      challengeId: pendingMfaChallenge.id,
      factorId: pendingMfaChallenge.factor_id,
      user,
    });
  },

  /**
   * Simulates MFA setup pending (QR shown but not verified).
   */
  setMfaSetupPending: (userId = currentSession?.user?.id || "u1") => {
    let user = mockUsers.find((u) => u.id === userId);

    if (!user) {
      user = {
        id: userId,
        email: `${userId}@example.com`,
        password: "default",
        mfaEnabled: false,
        identities: [{ provider: "email", id: `${userId}@example.com` }],
      };
      mockUsers.push(user);
    }

    // Ensure there is a current session
    if (!currentSession) {
      currentSession = {
        user: { id: user.id, email: user.email },
        access_token: "mock_token_" + user.id,
      };
      notifySubscribers("SIGNED_IN", currentSession);
    }

    pendingMfaChallenge = {
      id: "setup_pending_" + user.id,
      factor_id: "factor_setup_" + user.id,
      user,
    };

    notifySubscribers("MFA_SETUP_PENDING", {
      challengeId: pendingMfaChallenge.id,
      factorId: pendingMfaChallenge.factor_id,
      user,
    });
  },

  setMfaChallengeVerified: () => {
    pendingMfaChallenge = null;

    const user =
      currentSession?.user ||
      mockUsers.find((u) => u.id === "u1");

    if (!user) throw new Error("Cannot verify MFA challenge without user");

    // Ensure a valid session exists
    if (!currentSession) {
      currentSession = {
        user: { id: user.id, email: user.email },
        access_token: "mock_token_" + user.id,
      };
    }

    // Mark MFA challenge as resolved
    pendingMfaChallenge = {
      id: "mock_challenge_id",
      factor_id:  "mock_factor_id",
      user,
    };

    // First, emit MFA_CHALLENGE_VERIFIED to simulate success
    notifySubscribers("MFA_CHALLENGE_VERIFIED", {
      session: currentSession,
      challengeId: pendingMfaChallenge.id,
      factorId: pendingMfaChallenge.factor_id,
      user,
    });

    setTimeout(() => {
      // Then, emit SIGNED_IN to represent final authenticated state
      notifySubscribers("SIGNED_IN", currentSession);
    }, 10);
  },
};
