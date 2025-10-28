import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserPlus } from "lucide-react";
import { SignUpResult } from "@/services/i-auth-service";

interface Props {
  switchMode: (mode: "login" | "signup" | "forgot") => void;
  onSuccess: () => void;
}

const SignUp = ({ switchMode, onSuccess }: Props) => {
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;
    const number = /[0-9]/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (pwd.length < minLength)
      return "Password must be at least 8 characters long";
    if (!uppercase.test(pwd))
      return "Password must include at least one uppercase letter";
    if (!lowercase.test(pwd))
      return "Password must include at least one lowercase letter";
    if (!number.test(pwd)) return "Password must include at least one number";
    if (!specialChar.test(pwd))
      return "Password must include at least one special character";

    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    const error = validatePassword(pwd);
    setPasswordError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }

    setLoading(true);

    try {
      const result: SignUpResult = await signUp({
        email,
        password,
        displayName,
        companyName,
      });

      if (result.success) {
        toast({
          title: "Account Created!",
          description:
            "Please check your email to verify your account, then sign in to set up 2FA.",
        });
        onSuccess();
      } else {
        toast({
          title:
            result.error === "AccountExists"
              ? "Account Exists"
              : "Sign Up Error",
          description:
            result.error === "AccountExists"
              ? "An account with this email already exists. Please sign in instead."
              : result.message,
          variant: "destructive",
        });
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

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2 text-accent">
            Create Account
          </h2>
          <p className="text-muted-foreground">
            Sign up to get started with your invoicing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>

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
              required
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="password" className="text-accent">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              required
              minLength={6}
            />
            {passwordError && (
              <p className="text-xs text-red-600">{passwordError}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
            disabled={!!passwordError && loading}
          >
            {loading ? (
              "Please wait..."
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
            onClick={() => switchMode("login")}
            className="text-muted-foreground hover:text-primary p-0 h-auto transition-colors duration-200"
          >
            "Already have an account? Sign in"
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
