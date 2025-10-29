import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isDeviceRemembered } from "@/lib/device-remember";
import LoginForm from "@/components/auth/login-form";
import { set } from "date-fns";
import Loading from "@/components/loading";
import { MfaSetup } from "@/components/auth/mfa-setup";
import { MfaVerify } from "@/components/auth/mfa-verify";
import SignupForm from "@/components/auth/signup-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

// import SignupForm from "./SignupForm";
// import ForgotPasswordForm from "./ForgotPasswordForm";

const Auth = () => {
  const [mode, setMode] = useState<
    "login" | "signup" | "forgot" | "MfaSetup" | "MfaVerify" | "none"
  >("login");

  const {
    user,
    userAuthStatus,
    loading,
    setLoading,
    mfaChallengeId,
    mfaFactorId,
    signOut,
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resetForm, setResetForm] = useState(0);

  useEffect(() => {

    switch (userAuthStatus) {
      case "authenticated":
        navigate("/");
        break;

      case "unauthenticated":
        setMode("login");
        break;

      case "mfaChallengePending":
        setMode("MfaVerify");
        break;

      case "mfaSetupPending":
        setMode("MfaSetup");
        break;
    }
  }, [userAuthStatus, resetForm]);

  const handleMfaSetupComplete = () => {
    setLoading(true);
    toast({
      title: "MFA Setup Complete",
      description: "Two-factor authentication enabled.",
    });
  };

  const handleMfaVerifyComplete = () => {
    setLoading(true);
    setMode("none");
    toast({
      title: "Login Successful",
      description: "You have been authenticated.",
    });
  };

  const handleSignUpComplete = () => {
    setResetForm(resetForm + 1);
  };

  const handleResetPasswordComplete = () => {
    setResetForm(resetForm + 1);
  };

  const handleBackToLogin = () => {
    signOut({ clearDevice: false }), setMode("login");
  };

  if (mode == "MfaSetup")
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <MfaSetup
          onSuccess={handleMfaSetupComplete}
          onSkip={handleBackToLogin}
        />
      </div>
    );

  if (mode == "MfaVerify" && mfaChallengeId && mfaFactorId)
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <MfaVerify
          challengeId={mfaChallengeId}
          factorId={mfaFactorId}
          onSuccess={handleMfaVerifyComplete}
          onBack={handleBackToLogin}
        />
      </div>
    );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Section */}
      {renderHeroSection()}

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        {mode === "login" && <LoginForm switchMode={setMode} />}
        {mode === "signup" && (
          <SignupForm switchMode={setMode} onSuccess={handleSignUpComplete} />
        )}
        {mode === "forgot" && (
          <ForgotPasswordForm
            switchMode={setMode}
            onSuccess={handleResetPasswordComplete}
          />
        )}
      </div>
    </div>
  );

  function renderHeroSection() {
    return (
      <div className="hidden lg:flex lg:w-1/2 bg-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-accent"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-secondary">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Invoice management made simple
            </h1>
            <p className="text-xl text-white mb-8">
              Create, send, and track invoices effortlessly. Get paid faster and
              grow your business.
            </p>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="bg-primary/10 backdrop-blur-sm rounded-2xl p-6 max-w-md shadow-[var(--shadow-elegant)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-8 bg-primary/20 rounded-md"></div>
              <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-primary/20 rounded-md w-3/4"></div>
              <div className="h-3 bg-primary/20 rounded-md w-1/2"></div>
              <div className="flex items-center justify-between mt-6">
                <div className="w-20 h-20 bg-primary/20 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary/30 rounded-md"></div>
                </div>
                <div className="flex-1 ml-4 space-y-2">
                  <div className="h-2 bg-primary/20 rounded-md w-full"></div>
                  <div className="h-2 bg-primary/20 rounded-md w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Auth;
