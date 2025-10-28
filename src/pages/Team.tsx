import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Shield, DollarSign, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin/Owner" | "Billing" | "Viewer";
  last_active: string;
  status: "active" | "invited" | "inactive";
}

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedMembers = data.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role as "Admin/Owner" | "Billing" | "Viewer",
        last_active: member.last_active || member.created_at,
        status: member.status as "active" | "invited" | "inactive",
      }));

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your team members and their permissions
            </p>
          </div>
          <InviteMemberDialog onMemberInvited={fetchTeamMembers} />
        </div>

        {/* Role Permissions Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Admin/Owner
              </CardTitle>
              <CardDescription>Full system access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <p>✓ Create & edit invoices</p>
                <p>✓ Disable and re-enable invoide sharing link</p>
                <p>✓ View financials</p>
                <p>✓ Manage team & billing</p>
                <p>✓ Full access to all features</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="w-5 h-5 mr-2 text-secondary" />
                Billing
              </CardTitle>
              <CardDescription>Invoice & financial management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <p>✓ Create & edit invoices</p>
                <p>✓ Disable and re-enable invoide sharing link</p>
                <p>✓ View financials</p>
                <p>✓ Manage billing settings</p>
                <p>✗ Team management</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Eye className="w-5 h-5 mr-2 text-muted-foreground" />
                Viewer
              </CardTitle>
              <CardDescription>Read-only access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <p>✓ View reports</p>
                <p>✗ Create/edit invoices</p>
                <p>✗ Disable and re-enable invoide sharing link</p>
                <p>✗ View financial details</p>
                <p>✗ Team or billing management</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onMemberUpdated={fetchTeamMembers}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No team members match your search."
                      : "No team members yet. Invite someone to get started!"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
