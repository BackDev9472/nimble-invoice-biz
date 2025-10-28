import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { storeDeviceToken } from "@/lib/device-remember";
import { Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface MfaVerifyProps {
  challengeId: string;
  factorId: string;
  onSuccess: () => void;
  onBack?: () => void;
}

export const MfaVerify = ({
  challengeId,
  factorId,
  onSuccess,
  onBack,
}: MfaVerifyProps) => {
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const {verifyMfaTotp} = useAuth();

  const verifyCode = async () => {
    try {
      setLoading(true);

      // Verify the MFA challenge
      const result = await verifyMfaTotp({
        factorId,
        challengeId,
        code,
      });

      if (!result.success) {
        toast({
          title: "Verification Failed",
          description: "Invalid code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // If remember device is checked, store the device token
      if (rememberDevice && result.data?.user) {
        storeDeviceToken(result.data.user.id);
      }

      toast({
        title: "Verification Successful",
        description: rememberDevice
          ? "You have been successfully logged in. This device will be remembered for 30 days."
          : "You have been successfully logged in.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description:
          "Invalid code. Please check your authenticator app and try again.",
        variant: "destructive",
      });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      verifyCode();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mfaCode">Authentication Code</Label>
            <Input
              id="mfaCode"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              className="text-center font-mono text-lg tracking-widest"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberDevice"
              checked={rememberDevice}
              onCheckedChange={(checked) => setRememberDevice(!!checked)}
            />
            <Label
              htmlFor="rememberDevice"
              className="text-sm font-normal cursor-pointer"
            >
              Remember this device for 30 days
            </Label>
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>

            {onBack && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
