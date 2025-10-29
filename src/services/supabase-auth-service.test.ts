// src/services/auth-service.test.ts

import {
  __mockAuthHelpers,
  mockSupabaseClient,
} from "@/mocks/supabase-client.mock";
import { SupabaseAuthService } from "./supabase-auth-service";
import { vi } from "vitest";


describe("SupabaseAuthService (DI) (MSW v2)", () => {
  let supabaseAuthService: ReturnType<typeof SupabaseAuthService>;

  beforeEach(() => {
    __mockAuthHelpers.reset();
    supabaseAuthService = SupabaseAuthService({
      supabase: mockSupabaseClient as any,
      isDeviceRemembered: () => false,
    });
  });

  // -----------------------------
  // Sign In / Sign Up
  // -----------------------------
  test("signIn success", async () => {
    const result = await supabaseAuthService.signIn({
      email: "user1@example.com",
      password: "password1",
    });
    expect(result.error).toBeNull();
  });

  test("signIn failure", async () => {
    const result = await supabaseAuthService.signIn({
      email: "wrong@example.com",
      password: "bad",
    });
    expect(result.error).toBeTruthy();
  });

  test("signUp success", async () => {
    const result = await supabaseAuthService.signUp({
      email: "new@example.com",
      password: "123456",
      emailRedirectTo: "http://localhost/verify",
    });
    expect(result.success).toBe(true);
  });

  test("signUp existing user", async () => {
    const result = await supabaseAuthService.signUp({
      email: "user1@example.com",
      password: "password1",
      emailRedirectTo: "http://localhost/verify",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("AccountExistsUnverified");
  });

  test("signUp unexpected error (catch block)", async () => {
    const badSupabase = {
      auth: {
        signUp: vi.fn().mockRejectedValue(new Error("network down")),
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: badSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.signUp({
      email: "x@example.com",
      password: "123456",
      emailRedirectTo: "http://localhost",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("UnexpectedError");
  });

  test("signUp includes displayName and companyName metadata", async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: { user: { id: "u1", identities: [{}] } },
      error: null,
    });
    const mockSupabase = { auth: { signUp: mockSignUp } } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.signUp({
      email: "user@example.com",
      password: "pass",
      displayName: "John Doe",
      companyName: "Acme Corp",
      emailRedirectTo: "http://test",
    });

    expect(result.success).toBe(true);
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            display_name: "John Doe",
            company_name: "Acme Corp",
          }),
        }),
      })
    );
  });

  // -----------------------------
  // Sign Out
  // -----------------------------
  test("signOut success", async () => {
    const result = await supabaseAuthService.signOut();
    expect(result.success).toBe(true);
  });

  test("signOut handles error gracefully", async () => {
    const badSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValue({
          error: new Error("signOut failed"),
        }),
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: badSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.signOut();
    expect(result.success).toBe(false);
  });

  // -----------------------------
  // Auth State
  // -----------------------------
  test("getAuthState returns unauthenticated", async () => {
    const result = await supabaseAuthService.getAuthState();
    expect(result.status).toBe("unauthenticated");
  });

  test("getAuthState handles Supabase error", async () => {
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("session failed"),
        }),
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const state = await service.getAuthState();
    expect(state.status).toBe("unauthenticated");
  });

  test("getAuthState handles getSession rejection", async () => {
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockRejectedValue(new Error("network fail")),
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.getAuthState();
    expect(result.status).toBe("unauthenticated");
  });

  test("getAuthState triggers MFA challenge when device not remembered", async () => {
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user1" } } },
          error: null,
        }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({
            data: {
              all: [{ id: "factor1", status: "verified" }],
              totp: [{ id: "factor1", status: "verified" }],
            },
            error: null,
          }),
          challenge: vi.fn().mockResolvedValue({
            data: { id: "challenge1" },
            error: null,
          }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const state = await service.getAuthState();
    expect(state.status).toBe("mfaChallengePending");
    expect(state.challengeId).toBe("challenge1");
  });

  test("getAuthState returns authenticated immediately when device is remembered", async () => {
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user1" } } },
          error: null,
        }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({
            data: {
              all: [{ id: "factor1", status: "verified" }],
              totp: [{ id: "factor1", status: "verified" }],
            },
            error: null,
          }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => true,
    });

    const state = await service.getAuthState();
    expect(state.status).toBe("authenticated");
  });

  test("onAuthStateChange handles getAuthState error gracefully", async () => {
    const mockSupabase = {
      auth: {
        onAuthStateChange: vi.fn((_cb) => {
          const data = { subscription: { unsubscribe: vi.fn() } };
          setTimeout(() => _cb("SIGNED_IN", null));
          return { data };
        }),
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    vi.spyOn(service, "getAuthState").mockRejectedValueOnce(new Error("boom"));

    let state: any;
    const unsubscribe = service.onAuthStateChange((s) => (state = s));

    await new Promise((r) => setTimeout(r, 50));

    expect(state.status).toBe("unauthenticated");
    unsubscribe();
  });

  // -----------------------------
  // MFA
  // -----------------------------
  test("enrollMfaTotp returns QR data", async () => {
    const result = await supabaseAuthService.enrollMfaTotp();
    expect(result.success).toBe(true);
    expect(result.data?.secret).toBe("abc123");
  });

  test("verifyMfaTotp success", async () => {
    await supabaseAuthService.signIn({
      email: "user1@example.com",
      password: "password1",
    });

    const result = await supabaseAuthService.verifyMfaTotp({
      factorId: "factor1",
      code: "654321",
    });
    expect(result.success).toBe(true);
  });

  test("verifyMfaTotp fails on verify error", async () => {
    const badSupabase = {
      auth: {
        mfa: {
          challenge: vi
            .fn()
            .mockResolvedValue({ data: { id: "cid" }, error: null }),
          verify: vi
            .fn()
            .mockResolvedValue({ data: null, error: new Error("bad code") }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: badSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.verifyMfaTotp({
      factorId: "f1",
      code: "000000",
    });

    expect(result.success).toBe(false);
  });

  test("enrollMfaTotp throws error if QR data missing", async () => {
    const badSupabase = {
      auth: {
        mfa: {
          listFactors: vi.fn().mockResolvedValue({ data: { all: [] } }),
          enroll: vi.fn().mockResolvedValue({
            data: { id: "id1", totp: { secret: "abc", uri: null, qr_code: null } },
            error: null,
          }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: badSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.enrollMfaTotp();
    expect(result.success).toBe(false);
  });

  test("verifyMfaTotp handles challenge rejection", async () => {
    const badSupabase = {
      auth: {
        mfa: {
          challenge: vi.fn().mockRejectedValue(new Error("bad network")),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: badSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.verifyMfaTotp({
      factorId: "f1",
      code: "000000",
    });

    expect(result.success).toBe(false);
  });

  test("listFactors returns success", async () => {
    const mockSupabase = {
      auth: {
        mfa: {
          listFactors: vi
            .fn()
            .mockResolvedValue({ data: { all: [], totp: [] }, error: null }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.listFactors();
    expect(result.data).toEqual({ all: [], totp: [] });
  });

  test("challenge returns success", async () => {
    const mockSupabase = {
      auth: {
        mfa: {
          challenge: vi
            .fn()
            .mockResolvedValue({ data: { id: "ok" }, error: null }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.challenge({ factorId: "f1" });
    expect(result.challengeId).toBe("ok");
  });

  test("challenge returns error", async () => {
    const mockSupabase = {
      auth: {
        mfa: {
          challenge: vi
            .fn()
            .mockResolvedValue({ data: null, error: new Error("fail") }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.challenge({ factorId: "f1" });
    expect(result.error).toBeTruthy();
  });

  // -----------------------------
  // Private _determineMfaState
  // -----------------------------
  test("_determineMfaState handles remembered device", async () => {
    const mockSupabase = { auth: { mfa: { listFactors: vi.fn() } } } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => true,
    });

    const result = await (service as any).private._determineMfaState(
      mockSupabase,
      "user1",
      () => true
    );

    expect(result.needsMfa).toBe(false);
  });

  test("_determineMfaState verified factors with successful challenge", async () => {
    const mockSupabase = {
      auth: {
        mfa: {
          listFactors: vi.fn().mockResolvedValue({
            data: {
              all: [{ id: "f1", status: "verified" }],
              totp: [{ id: "f1", status: "verified" }],
            },
            error: null,
          }),
          challenge: vi.fn().mockResolvedValue({ data: { id: "challenge1" }, error: null }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await (service as any).private._determineMfaState(
      mockSupabase,
      "user123",
      () => false
    );

    expect(result.needsMfa).toBe(true);
    expect(result.challengeId).toBe("challenge1");
  });

  test("_determineMfaState verified factors with challenge error", async () => {
    const mockSupabase = {
      auth: {
        mfa: {
          listFactors: vi.fn().mockResolvedValue({
            data: {
              all: [{ id: "f1", status: "verified" }],
              totp: [{ id: "f1", status: "verified" }],
            },
            error: null,
          }),
          challenge: vi.fn().mockResolvedValue({ data: null, error: new Error("bad challenge") }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    await expect(
      (service as any).private._determineMfaState(
        mockSupabase,
        "user123",
        () => false
      )
    ).rejects.toThrow("bad challenge");
  });

  test("_determineMfaState handles unverified factors", async () => {
    const mockSupabase = {
      auth: {
        mfa: {
          listFactors: vi.fn().mockResolvedValue({
            data: { all: [{ id: "f1", status: "unverified" }], totp: [] },
            error: null,
          }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await (service as any).private._determineMfaState(
      mockSupabase,
      "user1",
      () => false
    );

    expect(result.needsMfa).toBe(true);
  });

  test("_determineMfaState handles listFactors error", async () => {
    const mockSupabase = {
      auth: {
        mfa: {
          listFactors: vi.fn().mockResolvedValue({ data: null, error: new Error("list error") }),
        },
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    await expect(
      (service as any).private._determineMfaState(mockSupabase, "user123", () => false)
    ).rejects.toThrow("list error");
  });

  // -----------------------------
  // Full Flow Test
  // -----------------------------
  test("Full flow: wrong login → correct login (MFA) → enroll → verify → sign out", async () => {
    // 1️⃣ Wrong login
    const failLogin = await supabaseAuthService.signIn({
      email: "wrong@example.com",
      password: "bad",
    });
    expect(failLogin.error).toBeTruthy();

    // 2️⃣ Correct login
    const successLogin = await supabaseAuthService.signIn({
      email: "user1@example.com",
      password: "password1",
    });
    expect(successLogin.error).toBeNull();

    let latestState: any = null;
    const unsubscribe = supabaseAuthService.onAuthStateChange((state) => {
      latestState = state;
    });

    const authState = await supabaseAuthService.getAuthState();
    expect(authState.status).toBe("mfaChallengePending");

    const enrollResult = await supabaseAuthService.enrollMfaTotp();
    expect(enrollResult.success).toBe(true);
    expect(enrollResult.data?.secret).toBe("abc123");

    await new Promise((res) => setTimeout(res, 50));

    const verifyResult = await supabaseAuthService.verifyMfaTotp({
      factorId: enrollResult.data!.factorId,
      code: "123456",
    });
    expect(verifyResult.success).toBe(true);

    await new Promise((res) => setTimeout(res, 50));
    expect(latestState?.status).toBe("authenticated");

    const signOutResult = await supabaseAuthService.signOut();
    expect(signOutResult.success).toBe(true);

    unsubscribe();
  });

  // -----------------------------
  // Password Reset
  // -----------------------------
  test("resetPasswordForEmail handles error", async () => {
    const mockSupabase = {
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: new Error("email fail") }),
      },
    } as any;

    const service = SupabaseAuthService({
      supabase: mockSupabase,
      isDeviceRemembered: () => false,
    });

    const result = await service.resetPasswordForEmail({
      email: "x@example.com",
      redirectTo: "http://localhost",
    });

    expect(result.error).toBeTruthy();
  });
});
