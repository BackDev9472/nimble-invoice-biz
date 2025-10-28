import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditRoleDialogProps {
  member: {
    id: string;
    name: string;
    role: UserRole;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleUpdated: () => void;
}

export function EditRoleDialog({ member, open, onOpenChange, onRoleUpdated }: EditRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(member.role);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === member.role) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: selectedRole })
        .eq("id", member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${member.name}'s role updated to ${selectedRole}`,
      });

      onOpenChange(false);
      onRoleUpdated();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Change the role for {member.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: UserRole) => setSelectedRole(value)}
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}