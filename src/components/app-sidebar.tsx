import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Home, 
  Users, 
  PlusCircle, 
  BookUser, 
  Settings, 
  Wallet,
  Building2,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRole } from "@/hooks/use-role";
import { RoleBadge } from "@/components/team/role-badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "New Invoice",
    url: "/invoices/new",
    icon: PlusCircle,
    permission: "manageInvoices",
  },
  {
    title: "All Invoices",
    url: "/invoices",
    icon: FileText,
    permission: "viewInvoices",
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: BookUser,
    permission: "manageContacts",
  },
  {
    title: "Team",
    url: "/team",
    icon: Users,
    permission: "manageTeam",
  },
  {
    title: "Balance",
    url: "/balance",
    icon: Wallet,
    permission: "viewInvoices",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    permission: "manageSettings",
  },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const { hasPermission, role } = useRole();

  const visibleNavigationItems = navigationItems.filter(
    (item) => !("permission" in item) || hasPermission(item.permission as any)
  );
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  const handleNavClick = () => {
    // Close sidebar on mobile when navigation item is clicked
    setOpenMobile(false);
  };

  const handleSignOut = async () => {
    const result = await signOut({clearDevice: true});
    if (!result.success) {
      toast({
        title: "Sign Out Error",
        description: result.errorMessage || "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
  };

  return (
    <Sidebar side="left" className={cn(collapsed ? "w-14" : "w-64", "top-0 h-full")} collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center space-x-3 px-3 py-4">
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-foreground text-sm truncate">ACME DIESEL REPAIR</h2>
              <p className="text-xs text-muted-foreground">Company Home</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      isActive(item.url) && "bg-muted text-primary font-medium"
                    )}
                  >
                    <Link to={item.url} onClick={handleNavClick}>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter>
          {!collapsed && role && (
            <div className="flex items-center gap-2 px-4 mb-2 text-sm text-muted-foreground">
              <span>Role:</span>
              <RoleBadge role={role} />
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                {!collapsed && <span>Sign Out</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}