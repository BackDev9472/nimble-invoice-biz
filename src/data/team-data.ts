export type UserRole = "Admin/Owner" | "Billing" | "Viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastActive: string;
  status: "active" | "invited" | "inactive";
}

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "Admin/Owner",
    lastActive: "2024-01-15",
    status: "active"
  },
  {
    id: "2", 
    name: "Mike Chen",
    email: "mike@company.com",
    role: "Billing",
    lastActive: "2024-01-14",
    status: "active"
  },
  {
    id: "3",
    name: "Emma Wilson",
    email: "emma@company.com", 
    role: "Viewer",
    lastActive: "2024-01-13",
    status: "active"
  },
  {
    id: "4",
    name: "Alex Rodriguez",
    email: "alex@company.com",
    role: "Billing",
    lastActive: "2024-01-12",
    status: "invited"
  }
];

export const rolePermissions = {
  "Admin/Owner": {
    canCreateInvoices: true,
    canEditInvoices: true,
    canDeleteInvoices: true,
    canViewFinancials: true,
    canManageTeam: true,
    canManageBilling: true,
    canViewReports: true
  },
  "Billing": {
    canCreateInvoices: true,
    canEditInvoices: true,
    canDeleteInvoices: false,
    canViewFinancials: true,
    canManageTeam: false,
    canManageBilling: true,
    canViewReports: true
  },
  "Viewer": {
    canCreateInvoices: false,
    canEditInvoices: false,
    canDeleteInvoices: false,
    canViewFinancials: false,
    canManageTeam: false,
    canManageBilling: false,
    canViewReports: true
  }
};