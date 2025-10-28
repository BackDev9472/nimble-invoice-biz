import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { isDeviceRemembered, clearDeviceToken, getDeviceId } from '@/lib/device-remember';
import { Shield, Trash2, RefreshCw } from 'lucide-react';

export const MfaTest = () => {
  const { user } = useAuth();
  const [deviceInfo, setDeviceInfo] = useState({
    deviceId: getDeviceId(),
    isRemembered: user ? isDeviceRemembered(user.id) : false
  });

  const handleRefresh = () => {
    setDeviceInfo({
      deviceId: getDeviceId(),
      isRemembered: user ? isDeviceRemembered(user.id) : false
    });
  };

  const handleClearDevice = () => {
    clearDeviceToken();
    setDeviceInfo({
      deviceId: getDeviceId(),
      isRemembered: false
    });
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>MFA Status</CardTitle>
        </div>
        <CardDescription>
          Test MFA functionality and device remembering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm">
            <strong>User ID:</strong> {user.id}
          </div>
          <div className="text-sm">
            <strong>Device ID:</strong> {deviceInfo.deviceId}
          </div>
          <div className="text-sm">
            <strong>Device Remembered:</strong> {deviceInfo.isRemembered ? 'Yes' : 'No'}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearDevice}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Device
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
