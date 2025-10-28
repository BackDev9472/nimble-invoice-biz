import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface MfaSetupProps {
  onSuccess: () => void;
  onSkip?: () => void;
}

export const MfaSetupPer = ({ onSuccess, onSkip }: MfaSetupProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated before attempting MFA enrollment
    const checkAuthAndEnroll = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        enrollMfa();
      } else {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in before setting up 2FA.',
          variant: 'destructive',
        });
      }
    };
    
    checkAuthAndEnroll();
  }, []);

  const enrollMfa = async () => {
    try {
      setLoading(true);
      
      // First, clean up any existing unverified factors to prevent QR code size issues
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      if (existingFactors?.all) {
        for (const factor of existingFactors.all) {
          if (factor.status === 'unverified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }
      
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setSecret(data.totp.secret);
        
  
        
        try {
          const qrData = data.totp.uri || data.totp.qr_code;

          
          if (!qrData) {
            throw new Error('No QR code data found in response');
          }
          
          // Check if the QR data is already a data URL (starts with 'data:')
          if (typeof qrData === 'string' && qrData.startsWith('data:')) {
        
            setQrCodeUrl(qrData);
          } else if (typeof qrData === 'string' && qrData.trim().startsWith('<svg')) {
            
            // Convert SVG to data URL for display
            const svgDataUrl = `data:image/svg+xml;base64,${btoa(qrData)}`;
            setQrCodeUrl(svgDataUrl);
          } else {
            
            // Generate QR code with proper options to handle large data
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
              width: 256,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              },
              errorCorrectionLevel: 'L' // Low error correction to reduce data size
            });
            setQrCodeUrl(qrCodeDataUrl);
          }
        } catch (qrError: any) {
          console.warn('QR code generation failed:', qrError);
          // If QR code fails, we'll still show the manual secret entry
          toast({
            title: 'QR Code Generation Failed',
            description: 'Please use the manual secret key below instead.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Setup Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async () => {
    try {
      setLoading(true);
      
      // For enrollment verification, we need to create a challenge first
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      // Now verify the code with the challenge
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode
      });

      if (error) throw error;

      toast({
        title: 'MFA Setup Complete',
        description: 'Two-factor authentication has been enabled for your account.',
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: 'Invalid code. Please check your authenticator app and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'Secret key copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const retryEnrollment = async () => {
    setQrCodeUrl('');
    setSecret('');
    setFactorId('');
    setVerifyCode('');
    await enrollMfa();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Set Up Two-Factor Authentication</CardTitle>
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
                  <img src={qrCodeUrl} alt="QR Code" className="border rounded-lg" />
                </div>
              </div>
            )}
            
            {!qrCodeUrl && secret && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  QR code generation failed. Please use the manual secret key below:
                </p>
                <Button
                  type="button"
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
                <Input
                  value={secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copySecret}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verifyCode">Enter the 6-digit code from your app:</Label>
              <Input
                id="verifyCode"
                type="text"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center font-mono text-lg"
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={verifyMfa}
                disabled={loading || verifyCode.length !== 6}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Complete Setup'}
              </Button>
              
              {onSkip && (
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="w-full"
                >
                  Skip for Now
                </Button>
              )}
            </div>
          </div>
        )}

        {loading && !qrCodeUrl && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Setting up MFA...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};