import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "./role-badge";
import { EditRoleDialog } from "./edit-role-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { MoreHorizontal, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin/Owner" | "Billing" | "Viewer";
  last_active: string;
  status: "active" | "invited" | "inactive";
}

interface TeamMemberCardProps {
  member: TeamMember;
  onMemberUpdated: () => void;
}

export function TeamMemberCard({ member, onMemberUpdated }: TeamMemberCardProps) {
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = (status: TeamMember["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="text-xs">Active</Badge>;
      case "invited":
        return <Badge variant="outline" className="text-xs">Invited</Badge>;
      case "inactive":
        return <Badge variant="destructive" className="text-xs">Inactive</Badge>;
    }
  };

  return (
    <Card className="border-primary">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div>
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  {member.email}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <RoleBadge role={member.role} />
                {getStatusBadge(member.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last active: {new Date(member.last_active).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditRoleOpen(true)}>
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem>Resend Invitation</DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setRemoveDialogOpen(true)}
              >
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      
      <EditRoleDialog
        member={member}
        open={editRoleOpen}
        onOpenChange={setEditRoleOpen}
        onRoleUpdated={onMemberUpdated}
      />
      
      <RemoveMemberDialog
        member={member}
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onMemberRemoved={onMemberUpdated}
      />
    </Card>
  );
}