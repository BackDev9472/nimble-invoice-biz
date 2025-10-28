import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type UserRole = "Admin/Owner" | "Billing" | "Viewer";
export type Permission =
  | "manageTeam"
  | "manageInvoices"
  | "viewInvoices"
  | "manageContacts"
  | "manageSettings";

const rolePermMap: Record<UserRole, Permission[]> = {
  "Admin/Owner": [
    "manageTeam",
    "manageInvoices",
    "viewInvoices",
    "manageContacts",
    "manageSettings",
  ],
  Billing: ["manageInvoices", "viewInvoices"],
  Viewer: ["viewInvoices"],
};

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch user role", error);
        alert(
          error
            ? `Failed to fetch user role:\n${JSON.stringify(error, null, 2)}`
            : "No team_members row found; defaulting to Viewer"
        );
        setRole("Viewer");
        return;
      }
      
      setRole((data as any)?.role ?? "Admin/Owner");
    })();
  }, [user]);

  const hasPermission = useCallback(
    (perm: Permission) => {
      if (!role) return false;
      return rolePermMap[role].includes(perm);
    },
    [role]
  );

  return { role, hasPermission };
}
