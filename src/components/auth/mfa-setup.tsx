import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import { storeDeviceToken } from "@/lib/device-remember";

interface MfaSetupProps {
  onSuccess: () => void;
  onSkip?: () => void;
}

export const MfaSetup = ({ onSuccess, onSkip }: MfaSetupProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const hasRun = useRef(false);
  const {enrollMfaTotp, verifyMfaTotp} = useAuth();

  useEffect(() => {
    if (user) {
      if (hasRun.current) return;
      hasRun.current = true;
      enrollMfa();
    } else {
      toast({
        title: "Authentication Required",
        description: "Please sign in before setting up 2FA.",
        variant: "destructive",
      });
    }
  }, [user]);

  const enrollMfa = async () => {
    setLoading(true);
    const result = await enrollMfaTotp();
    setLoading(false);

    if (!result.success) {
      toast({
        title: "Setup Error",
        description: result.error?.message || "Failed to enroll MFA.",
        variant: "destructive",
      });
      return;
    }

    setFactorId(result.data.factorId);
    setSecret(result.data.secret);
    setQrCodeUrl(result.data.qrCodeUrl);
  };

  const verifyMfa = async () => {
    setLoading(true);
    const result = await verifyMfaTotp({
      factorId,
      code: verifyCode,
    });
    setLoading(false);

    if (!result.success) {
      toast({
        title: "Verification Failed",
        description: "Invalid code. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // If remember device is checked, store the device token
    if (rememberDevice && user?.id) {
      await storeDeviceToken(user.id);
    }

    toast({
      title: "MFA Setup Complete",
      description: "Two-factor authentication has been enabled.",
    });

    setTimeout(
      () =>
        toast({
          title: "Verification Successful",
          description: rememberDevice
            ? "You have been successfully logged in. This device will be remembered for 30 days."
            : "You have been successfully logged in.",
        }),
      3000
    );
    onSuccess();
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Secret key copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Unable to copy key.",
        variant: "destructive",
      });
    }
  };

  const retryEnrollment = () => {
    setQrCodeUrl("");
    setSecret("");
    setFactorId("");
    setVerifyCode("");
    enrollMfa();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">
          Set Up Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Secure your account with an authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(qrCodeUrl || secret) && (
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app:
                </p>
                <div className="flex justify-center mb-4">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="border rounded-lg"
                  />
                </div>
              </div>
            )}

            {!qrCodeUrl && secret && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  QR code generation failed. Please use the manual secret key
                  below:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryEnrollment}
                  className="mb-4"
                >
                  Retry QR Code Generation
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm">Or manually enter this key:</Label>
              <div className="flex items-center space-x-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copySecret}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verifyCode">Enter the 6-digit code:</Label>
              <Input
                id="verifyCode"
                type="text"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                className="text-center font-mono text-lg"
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

            <Button
              onClick={verifyMfa}
              disabled={loading || verifyCode.length !== 6}
              className="w-full"
            >
              {loading ? "Verifying..." : "Complete Setup"}
            </Button>

            {onSkip && (
              <Button variant="ghost" onClick={onSkip} className="w-full">
                Skip for Now
              </Button>
            )}
          </div>
        )}

        {loading && !qrCodeUrl && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">
              Setting up MFA...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
