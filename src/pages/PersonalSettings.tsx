import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Save, Shield, Bell, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { MfaTest } from "@/components/auth/mfa-test";

interface ProfileFormData {
  display_name: string;
  avatar_url: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface NotificationSettings {
  email_invoices: boolean;
  email_payments: boolean;
  email_reminders: boolean;
  email_marketing: boolean;
}

const PersonalSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_invoices: true,
    email_payments: true,
    email_reminders: true,
    email_marketing: false,
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors, isDirty: isProfileDirty }
  } = useForm<ProfileFormData>({
    defaultValues: {
      display_name: "",
      avatar_url: ""
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormData>();

  useEffect(() => {
    document.title = "Personal Settings | walletpay";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Manage your profile, password, and personal preferences.");
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
        } else if (profile) {
          setProfileValue("display_name", profile.display_name || "");
          setProfileValue("avatar_url", profile.avatar_url || "");
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user, setProfileValue]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: data.display_name,
            avatar_url: data.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: data.display_name,
            avatar_url: data.avatar_url
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match.",
      });
      return;
    }

    if (data.new_password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully.",
      });

      resetPassword();
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update password. Please try again.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));

    // In a real app, you'd save this to the database
    toast({
      title: "Success",
      description: "Notification preference updated.",
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Personal Settings</h1>
                  <p className="text-muted-foreground">Manage your profile and account preferences</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        {...registerProfile("display_name", { required: "Display name is required" })}
                        placeholder="Enter your display name"
                      />
                      {profileErrors.display_name && (
                        <p className="text-sm text-destructive">{profileErrors.display_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed here. Contact support if needed.
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="avatar_url">Profile Picture URL</Label>
                      <Input
                        id="avatar_url"
                        {...registerProfile("avatar_url")}
                        placeholder="https://example.com/avatar.png"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading || !isProfileDirty}>
                      {isLoading ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle>Security</CardTitle>
                </div>
                <CardDescription>
                  Manage your account security and password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showCurrentPassword ? "text" : "password"}
                          {...registerPassword("current_password", { required: "Current password is required" })}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {passwordErrors.current_password && (
                        <p className="text-sm text-destructive">{passwordErrors.current_password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showNewPassword ? "text" : "password"}
                          {...registerPassword("new_password", { 
                            required: "New password is required",
                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                          })}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {passwordErrors.new_password && (
                        <p className="text-sm text-destructive">{passwordErrors.new_password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          {...registerPassword("confirm_password", { 
                            required: "Please confirm your new password",
                            validate: (value) => 
                              value === watchPassword("new_password") || "Passwords do not match"
                          })}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {passwordErrors.confirm_password && (
                        <p className="text-sm text-destructive">{passwordErrors.confirm_password.message}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isPasswordLoading}>
                      {isPasswordLoading ? (
                        <>Updating...</>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <CardTitle>Notifications</CardTitle>
                </div>
                <CardDescription>
                  Choose what notifications you'd like to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Invoice Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when invoices are created or updated
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email_invoices}
                      onCheckedChange={(value) => handleNotificationChange('email_invoices', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when payments are received
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email_payments}
                      onCheckedChange={(value) => handleNotificationChange('email_payments', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about overdue invoices
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email_reminders}
                      onCheckedChange={(value) => handleNotificationChange('email_reminders', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Communications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and tips
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email_marketing}
                      onCheckedChange={(value) => handleNotificationChange('email_marketing', value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  These actions cannot be undone. Please be careful.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" disabled>
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Account deletion is not available at this time. Contact support if needed.
                </p>
              </CardContent>
            </Card>

            {/* MFA Test Component */}
            <Card>
              <CardHeader>
                <CardTitle>MFA Testing</CardTitle>
                <CardDescription>
                  Test MFA functionality and device remembering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MfaTest />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
  );
};

export default PersonalSettings;