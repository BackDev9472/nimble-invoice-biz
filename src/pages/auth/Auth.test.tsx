import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { AuthProvider } from "@/hooks/use-auth";
import Auth from "./Auth";
import { vi } from "vitest";
import {
  __mockAuthHelpers,
  mockSupabaseClient,
} from "@/mocks/supabase-client.mock";
import { MemoryRouter } from "react-router-dom";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mock Supabase service so AuthProvider uses the mock client
vi.mock("@/services/supabase-auth-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/supabase-auth-service")
  >("@/services/supabase-auth-service");

  return {
    ...actual,
    SupabaseAuthService: (params: any) => ({
      ...actual.SupabaseAuthService({
        ...params,
        supabase: mockSupabaseClient,
        isDeviceRemembered: () => false,
      }),

      // enrollMfaTotp: vi.fn(),
      // verifyMfaTotp: vi.fn(),
    }),
  };
});

const RenderAuth = (): React.ReactNode => {
  return (
    <MemoryRouter>
      <AuthProvider>
        <Auth />
      </AuthProvider>
    </MemoryRouter>
  );
};

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Auth Page (real useAuth + mocked Supabase)", () => {
  afterEach(async () => {
    await waitFor(() => {}); // flush React updates
    vi.clearAllTimers(); // ensure no delayed callbacks remain
    __mockAuthHelpers.reset();
    vi.restoreAllMocks();
  });

  test("shows loading indicator initially", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </MemoryRouter>
    );

    // ✅ The only thing visible should be the loading text
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("shows login form after loading completes", async () => {
    render(<RenderAuth />);

    __mockAuthHelpers.notifySubscribers("SIGNED_OUT", null);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test("switch to signup form works", async () => {
    render(<RenderAuth />);

    __mockAuthHelpers.notifySubscribers("SIGNED_OUT", null);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Don't have an account? Sign up")); // your actual switch button
    expect(
      await screen.findByText("Sign up to get started with your invoicing")
    ).toBeInTheDocument();
  });

  test("switch to forgot password form works", async () => {
    render(<RenderAuth />);

    __mockAuthHelpers.notifySubscribers("SIGNED_OUT", null);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Forgot your password?")); // actual switch
    expect(
      await screen.findByText(
        "Enter your email address and we'll send you a password reset link."
      )
    ).toBeInTheDocument();
  });

  test("successful login triggers MFA challenge", async () => {
    render(<RenderAuth />);

    __mockAuthHelpers.notifySubscribers("SIGNED_OUT", null);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user1@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password1" },
    });
    fireEvent.click(screen.getByText("Sign In"));

    expect(
      await screen.findByText(
        "Enter the 6-digit code from your authenticator app"
      )
    ).toBeInTheDocument();
  });

  test("MFA back-to-login scenario", async () => {
    render(<RenderAuth />);

    __mockAuthHelpers.notifySubscribers("SIGNED_OUT", null);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    act(() => {
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "user1@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "password1" },
      });
    });

    fireEvent.click(screen.getByText("Sign In"));

    await delay(10);

    // Wait for MFA
    expect(
      await screen.findByText(
        "Enter the 6-digit code from your authenticator app"
      )
    ).toBeInTheDocument();

    // Go back to login
    fireEvent.click(screen.getByText("Back to Login")); // onBack in MfaVerify


    await delay(50);

    //now must be on login page
    expect(
      screen.getByText("Don't have an account? Sign up")
    ).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();

    act(() => {
      // Click Sign In again without changes
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "user1@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "password1" },
      });
    });

    fireEvent.click(screen.getByText("Sign In"));

    await delay(20);

    // must go to MFA
    expect(
      screen.getByText("Enter the 6-digit code from your authenticator app")
    ).toBeInTheDocument();
  });

  test("renders MFA setup when pending", async () => {
    render(<RenderAuth />);
    __mockAuthHelpers.setMfaSetupPending();

    expect(
      await screen.findByText(
        "Enter the 6-digit code from your authenticator app"
      )
    ).toBeInTheDocument();
  });

  test("signup flow works", async () => {
    render(<RenderAuth />);

    __mockAuthHelpers.notifySubscribers("SIGNED_OUT", null);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    expect(
      await screen.findByText("Sign up to get started with your invoicing")
    ).toBeInTheDocument();
  });

  test("forgot password flow works", async () => {
    render(<RenderAuth />);

    __mockAuthHelpers.notifySubscribers("SIGNED_OUT", null);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Forgot your password?"));
    expect(
      await screen.findByText(
        "Enter your email address and we'll send you a password reset link."
      )
    ).toBeInTheDocument();
  });

  test("navigates to home when userAuthStatus is authenticated", async () => {
    render(<RenderAuth />);

    // 1️⃣ Start from a clean unauthenticated state
    act(() => {
      __mockAuthHelpers.notifySubscribers("SIGNED_OUT", null);
    });

    // 2️⃣ Simulate successful MFA verification
    act(() => {
      __mockAuthHelpers.setMfaChallengeVerified();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});

