// Type definition for user_devices table
export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
}

export interface UserDeviceInsert {
  user_id: string;
  device_id: string;
  device_name?: string;
  user_agent?: string;
  expires_at: string;
  last_used_at?: string;
}
