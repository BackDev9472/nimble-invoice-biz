import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, LogIn, UserPlus, Mail } from "lucide-react";
import { MfaSetup } from "@/components/auth/mfa-setup";
import { MfaVerify } from "@/components/auth/mfa-verify";
import { isDeviceRemembered } from "@/lib/device-remember";

const Auth_Per = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  // MFA states
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showMfaVerify, setShowMfaVerify] = useState(false);
  const [mfaChallengeId, setMfaChallengeId] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Check if device is remembered to skip MFA
      if (isDeviceRemembered(user.id)) {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          toast({
            title: "Reset Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Reset Email Sent",
            description: "Check your email for password reset instructions.",
          });
          setIsForgotPassword(false);
          setIsLogin(true);
        }
      } else if (isLogin) {
        const { error } = await signIn({
          email,
          password
        });

        if (error) {
          if (error.message?.includes("Invalid login credentials")) {
            toast({
              title: "Login Failed",
              description:
                "Invalid email or password. Please check your credentials and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login Error",
              description: error.message || "Login failed",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been successfully logged in.",
          });
          // Navigation will happen via useEffect when user state updates
        }
      } else {
        const result = await signUp({
          email,
          password,
          displayName,
          companyName
        });
        if (!result.success) {
          if (result.error?.includes("User already registered")) {
            toast({
              title: "Account Exists",
              description:
                "An account with this email already exists. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign Up Error",
              description: result.error || result.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description:
              "Please check your email to verify your account, then sign in to set up 2FA.",
          });
          // Don't show MFA setup until user is actually authenticated
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSetupComplete = () => {
    setShowMfaSetup(false);
    toast({
      title: "MFA Setup Complete",
      description:
        "Two-factor authentication has been enabled for your account.",
    });
    navigate("/");
  };

  const handleMfaVerifyComplete = () => {
    setShowMfaVerify(false);
    setMfaChallengeId("");
    setMfaFactorId("");
    toast({
      title: "Login Successful",
      description: "You have been successfully authenticated.",
    });
  };

  const handleBackToLogin = () => {
    setShowMfaVerify(false);
    setShowMfaSetup(false);
    setMfaChallengeId("");
    setMfaFactorId("");
  };

  // Show MFA setup screen
  if (showMfaSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <MfaSetup
          onSuccess={handleMfaSetupComplete}
          onSkip={() => setShowMfaSetup(false)}
        />
      </div>
    );
  }

  // Show MFA verification screen
  if (showMfaVerify && mfaChallengeId && mfaFactorId) {
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
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Section */}
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

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-2 text-accent">
              {isForgotPassword
                ? "Reset Password"
                : isLogin
                ? "Welcome Back"
                : "Create Account"}
            </h2>
            <p className="text-muted-foreground">
              {isForgotPassword
                ? "Enter your email address and we'll send you a password reset link"
                : isLogin
                ? "Sign in to your account to continue"
                : "Sign up to get started with your invoicing"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-accent">
                  First & Last Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your first and last name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={!isLogin && !isForgotPassword}
                />
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-accent">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={!isLogin && !isForgotPassword}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-accent">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-accent">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isForgotPassword}
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-muted-foreground hover:text-primary p-0 h-auto text-sm"
                >
                  Forgot your password?
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                "Please wait..."
              ) : isForgotPassword ? (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Link
                </>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center lg:text-left">
            <Button
              variant="link"
              onClick={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                } else {
                  setIsLogin(!isLogin);
                }
              }}
              className="text-muted-foreground hover:text-primary p-0 h-auto transition-colors duration-200"
            >
              {isForgotPassword
                ? "Back to sign in"
                : isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth_Per;
