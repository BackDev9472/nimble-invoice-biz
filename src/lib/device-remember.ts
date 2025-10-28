// Device remembering utility functions
const DEVICE_TOKEN_KEY = 'mfa_device_token';
const DEVICE_TOKEN_EXPIRY_KEY = 'mfa_device_token_expiry';

interface DeviceToken {
  userId: string;
  deviceId: string;
  expiresAt: string;
}

/**
 * Generate a unique device ID based on browser characteristics
 */
export const generateDeviceId = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 10, 10);
  const fingerprint = canvas.toDataURL();
  
  // Combine with other browser characteristics
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create a simple hash-like identifier
  const combined = `${fingerprint}-${userAgent}-${language}-${timezone}`;
  return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

/**
 * Store device remembering token
 */
export const storeDeviceToken = (userId: string): void => {
  const deviceId = generateDeviceId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
  
  const token: DeviceToken = {
    userId,
    deviceId,
    expiresAt: expiresAt.toISOString()
  };
  
  localStorage.setItem(DEVICE_TOKEN_KEY, JSON.stringify(token));
  localStorage.setItem(DEVICE_TOKEN_EXPIRY_KEY, expiresAt.toISOString());
};

/**
 * Check if device is remembered and token is valid
 */
export const isDeviceRemembered = (userId: string): boolean => {

  try {
    const tokenStr = localStorage.getItem(DEVICE_TOKEN_KEY);
    const expiryStr = localStorage.getItem(DEVICE_TOKEN_EXPIRY_KEY);
    
    if (!tokenStr || !expiryStr) {
      return false;
    }
    
    const token: DeviceToken = JSON.parse(tokenStr);
    const expiry = new Date(expiryStr);
    const now = new Date();
    
    // Check if token is for the current user and not expired
    if (token.userId !== userId || now > expiry) {
      clearDeviceToken();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking device token:', error);
    clearDeviceToken();
    return false;
  }
};

/**
 * Clear device remembering token
 */
export const clearDeviceToken = (): void => {
  localStorage.removeItem(DEVICE_TOKEN_KEY);
  localStorage.removeItem(DEVICE_TOKEN_EXPIRY_KEY);
};

/**
 * Get device ID for current device
 */
export const getDeviceId = (): string => {
  try {
    const tokenStr = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (tokenStr) {
      const token: DeviceToken = JSON.parse(tokenStr);
      return token.deviceId;
    }
  } catch (error) {
    console.error('Error getting device ID:', error);
  }
  
  return generateDeviceId();
};
