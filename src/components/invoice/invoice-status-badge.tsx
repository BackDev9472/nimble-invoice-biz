import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  sent: {
    label: "Sent",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  paid: {
    label: "Paid",
    className: "bg-success/10 text-success border-success/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}