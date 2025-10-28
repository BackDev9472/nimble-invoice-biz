import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RemoveMemberDialogProps {
  member: {
    id: string;
    name: string;
    email: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberRemoved: () => void;
}

export function RemoveMemberDialog({ member, open, onOpenChange, onMemberRemoved }: RemoveMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRemove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${member.name} has been removed from the team`,
      });

      onOpenChange(false);
      onMemberRemoved();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {member.name} ({member.email}) from your team? 
            This action cannot be undone and they will lose access to your organization.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Removing..." : "Remove Member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}