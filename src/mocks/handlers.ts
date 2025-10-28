// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

const SUPABASE_URL = "https://mock.supabase.co";

export const handlers = [
  // 🔹 Sign In
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const url = new URL(request.url);
    const grantType = url.searchParams.get("grant_type");
    if (grantType !== "password") {
      return HttpResponse.json(
        { error: "Unsupported grant_type" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    if (email === "user@example.com" && password === "correct") {
      return HttpResponse.json({
        access_token: "mock_access",
        refresh_token: "mock_refresh",
        user: { id: "u1", email },
      });
    }

    return HttpResponse.json(
      { error_description: "Invalid credentials" },
      { status: 400 }
    );
  }),

  // 🔹 Sign Up
  http.post(`${SUPABASE_URL}/auth/v1/signup`, async ({ request }) => {

    const body = await request.json();
    const { email } = body as { email: string; };

    if (email === "exists@example.com") {
      return HttpResponse.json(
        { message: "User already registered" },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      user: { id: "u2", email },
    });
  }),

  // 🔹 Sign Out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // 🔹 Get Session
  http.get(`${SUPABASE_URL}/auth/v1/session`, () => {
    return HttpResponse.json({
      session: {
        access_token: "mock_access",
        user: { id: "u1", email: "user@example.com" },
      },
    });
  }),

  // 🔹 MFA: list factors
  http.get(`${SUPABASE_URL}/auth/v1/factors`, () => {
    return HttpResponse.json({
      all: [],
      totp: [],
    });
  }),

  // 🔹 MFA: enroll
  http.post(`${SUPABASE_URL}/auth/v1/factors`, async () => {
    return HttpResponse.json({
      id: "factor1",
      totp: { secret: "abc123", uri: "otpauth://mock" },
    });
  }),

  // 🔹 MFA: verify
  http.post(`${SUPABASE_URL}/auth/v1/challenge/verify`, async () => {
    return HttpResponse.json({ verified: true });
  }),
];
