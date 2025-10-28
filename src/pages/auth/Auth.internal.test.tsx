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

// Mock dependencies
const mockToast = vi.fn();
const mockSetLoading = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// We'll override useAuth dynamically inside tests
// Create a shared mock function
export const useAuthMock = vi.fn();

vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();

  return {
    ...actual,
    useAuth: (...args: any[]) => {
      // use the dynamic mock if set; otherwise return a default shape
      return (
        useAuthMock(...args) || {
          user: null,
          userAuthStatus: "unauthenticated",
          loading: false,
          setLoading: vi.fn(),
          mfaChallengeId: "mockChallenge",
          mfaFactorId: "mockFactor",
          signUp: vi.fn(),
          signIn: vi.fn(),
          signOut: vi.fn(),
          resetPasswordForEmail: vi.fn(),
          enrollMfaTotp: vi.fn(),
          verifyMfaTotp: vi.fn(),
        }
      );
    },
  };
});

// Mock child components — so we can trigger props manually
const mfaSetupMock = vi.fn();
const mfaVerifyMock = vi.fn();
const signupMock = vi.fn();
const forgotMock = vi.fn();

vi.mock("@/components/auth/mfa-setup", () => ({
  MfaSetup: (props: any) => {
    mfaSetupMock(props);
    return (
      <div>
        <p>MFA Setup</p>
        <button onClick={props.onSuccess}>Complete Setup</button>
        <button onClick={props.onSkip}>Skip</button>
      </div>
    );
  },
}));

vi.mock("@/components/auth/mfa-verify", () => ({
  MfaVerify: (props: any) => {
    mfaVerifyMock(props);
    return (
      <div>
        <p>MFA Verify</p>
        <button onClick={props.onSuccess}>Verify Success</button>
        <button onClick={props.onBack}>Back to Login</button>
      </div>
    );
  },
}));

vi.mock("@/components/auth/signup-form", () => ({
  default: (props: any) => {
    signupMock(props);
    return (
      <div>
        <p>Signup Form</p>
        <button onClick={props.onSuccess}>Signup Success</button>
      </div>
    );
  },
}));

vi.mock("@/components/auth/forgot-password-form", () => ({
  ForgotPasswordForm: (props: any) => {
    forgotMock(props);
    return (
      <div>
        <p>Forgot Form</p>
        <button onClick={props.onSuccess}>Reset Done</button>
      </div>
    );
  },
}));

describe("Auth internal flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAuth = () =>
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

  test("renders MFA Setup and handles success + skip", () => {
    useAuthMock.mockReturnValue({
      user: null,
      userAuthStatus: "mfaSetupPending",
      loading: false,
      setLoading: mockSetLoading,
      mfaChallengeId: "id",
      mfaFactorId: "factorId",
      signOut: mockSignOut,
    });

    renderAuth();

    expect(screen.getByText("MFA Setup")).toBeInTheDocument();

    // Trigger success
    fireEvent.click(screen.getByText("Complete Setup"));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "MFA Setup Complete" })
    );

    // Trigger skip
    fireEvent.click(screen.getByText("Skip"));
    expect(mockSignOut).toHaveBeenCalled();
  });

  test("renders MFA Verify and handles success + back", () => {
    useAuthMock.mockReturnValue({
      user: null,
      userAuthStatus: "mfaChallengePending",
      loading: false,
      setLoading: mockSetLoading,
      mfaChallengeId: "chal1",
      mfaFactorId: "fac1",
      signOut: mockSignOut,
    });

    renderAuth();

    expect(screen.getByText("MFA Verify")).toBeInTheDocument();

    // Trigger success
    fireEvent.click(screen.getByText("Verify Success"));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Login Successful" })
    );


    //rerender the the page to have back button
    renderAuth()

    // Trigger back
    fireEvent.click(screen.getByText("Back to Login"));
    expect(mockSignOut).toHaveBeenCalled();
  });

  test("signup success and forgot password success trigger resetForm", () => {
    useAuthMock.mockReturnValue({
      user: null,
      userAuthStatus: "unauthenticated",
      loading: false,
      setLoading: mockSetLoading,
      mfaChallengeId: null,
      mfaFactorId: null,
      signOut: mockSignOut,
    });

    renderAuth();

    // Switch to signup
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    expect(screen.getByText("Signup Form")).toBeInTheDocument();

    // Trigger signup success
    fireEvent.click(screen.getByText("Signup Success"));
    expect(signupMock).toHaveBeenCalled();

    // Switch to forgot password
    fireEvent.click(screen.getByText("Forgot your password?"));
    expect(screen.getByText("Forgot Form")).toBeInTheDocument();

    // Trigger reset success
    fireEvent.click(screen.getByText("Reset Done"));
    expect(forgotMock).toHaveBeenCalled();
  });

  test("renders hero section at desktop width", () => {
    Object.defineProperty(window, "innerWidth", { value: 1300 });
    window.dispatchEvent(new Event("resize"));

    useAuthMock.mockReturnValue({
      user: null,
      userAuthStatus: "unauthenticated",
      loading: false,
      setLoading: mockSetLoading,
      mfaChallengeId: null,
      mfaFactorId: null,
      signOut: mockSignOut,
    });

    renderAuth();
    expect(
      screen.getByText("Invoice management made simple")
    ).toBeInTheDocument();
  });
});
