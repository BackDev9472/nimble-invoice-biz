import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/data/team-data";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleVariant = (role: UserRole) => {
    switch (role) {
      case "Admin/Owner":
        return "default";
      case "Billing":
        return "secondary";
      case "Viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Badge 
      variant={getRoleVariant(role)} 
      className={cn("text-xs", className)}
    >
      {role}
    </Badge>
  );
}