import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { UserRole } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InviteMemberDialogProps {
  onMemberInvited: () => void;
}

export function InviteMemberDialog({ onMemberInvited }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "" as UserRole | ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get inviter name from user metadata or email
      const inviterName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Team Admin';
      const companyName = user.user_metadata?.company_name;

      // Create invitation record and get token
      const { data: invitation, error: inviteError } = await (supabase as any)
        .from("team_invitations")
        .insert({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          invited_by: user.id,
          company_name: companyName
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send invitation email
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-team-invite-email', {
        body: {
          recipientEmail: formData.email,
          recipientName: formData.name,
          role: formData.role,
          inviteToken: invitation.invite_token,
          inviterName: inviterName,
          companyName: companyName
        }
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        toast({
          title: "Error",
          description: "Failed to send invitation email",
          variant: "destructive",
        });
        return;
      }

      if (!emailResult?.success) {
        toast({
          title: "Error",
          description: "Failed to send invitation email",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Invitation sent to ${formData.email}`,
      });

      setFormData({ name: "", email: "", role: "" });
      setOpen(false);
      onMemberInvited();
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to add a new member to your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin/Owner">Admin/Owner</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}