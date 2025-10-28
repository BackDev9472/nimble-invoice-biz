import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlusCircle, FileText, BookUser, Users, Settings } from "lucide-react";

const items = [
  { label: "Create", to: "/invoices/new", icon: PlusCircle },
  { label: "All Invoices", to: "/invoices", icon: FileText },
  { label: "Contacts", to: "/contacts", icon: BookUser },
  { label: "Team", to: "/team", icon: Users },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function HomeSideMenu() {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Homepage side menu" className="bg-card border border-border rounded-lg p-2">
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
