import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useRole, Permission } from "@/hooks/use-role";
import Loading from "../loading";

interface PermissionRouteProps {
  children: React.ReactNode;
  permission: Permission;
}

export const PermissionRoute = ({ children, permission }: PermissionRouteProps) => {
  const { user } = useAuth();
  const { role, hasPermission } = useRole();
  const navigate = useNavigate();

  // redirect if user lacks permission
  useEffect(() => {
    if (user && role !== undefined && !hasPermission(permission)) {
      navigate("/");
    }
  }, [user, role, permission, hasPermission, navigate]);

  if (!user || role === undefined) {
    return <Loading />;
  }

  if (!hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
};
