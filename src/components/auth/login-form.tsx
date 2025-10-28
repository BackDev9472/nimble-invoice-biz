import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  switchMode: (mode: "login" | "signup" | "forgot") => void;
}

const LoginForm = ({ switchMode }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn({
        email,
        password,
      });


      if (!error) {
        return;
      }

      if (error.message.includes("Invalid login credentials")) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            className="absolute right-0 top-0 h-full px-3"
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

      <div className="text-right">
        <Button
          type="button"
          variant="link"
          onClick={() => switchMode("forgot")}
          className="text-sm"
        >
          Forgot your password?
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          "Please wait..."
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" /> Sign In
          </>
        )}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={() => switchMode("signup")}
          className="text-sm"
        >
          Don't have an account? Sign up
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
