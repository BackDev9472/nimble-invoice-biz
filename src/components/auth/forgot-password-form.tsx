import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  switchMode: (mode: "login" | "signup" | "forgot") => void;
  onSuccess: () => void;
}

export const ForgotPasswordForm = ({ switchMode, onSuccess }: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { resetPasswordForEmail } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPasswordForEmail(email);

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
        onSuccess();
      }
    } catch {
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
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center lg:text-left">
          <h2 className="text-3xl font-bold mb-2 text-accent">
            Reset Password
          </h2>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a password reset link.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
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

          <Button
            type="submit"
            className="w-full shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              "Please wait..."
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Reset Link
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => switchMode("login")}
            className="text-muted-foreground hover:text-primary p-0 h-auto"
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  );
};
