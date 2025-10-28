import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Home, Users, PlusCircle, LogOut, User, Wallet, Menu, BookUser, Settings, Building2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "New Invoice",
    href: "/invoices/new",
    icon: PlusCircle,
  },
  {
    name: "All Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: BookUser,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Balance",
    href: "/balance",
    icon: Wallet,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

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
    setIsOpen(false);
  };

  return (
    <nav className="bg-secondary border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Logo size="md" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col h-full">
                  <div className="py-4 border-b border-border">
                    <div className="flex items-center space-x-3 px-3">
                      <Building2 className="w-6 h-6 text-primary" />
                      <div>
                        <h2 className="font-bold text-foreground">ACME DIESEL REPAIR</h2>
                        <p className="text-sm text-muted-foreground">Company Home</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 py-6">
                    <nav className="space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              isActive
                                ? "bg-secondary text-accent"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  
                  {user && (
                    <div className="border-t pt-4">
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}