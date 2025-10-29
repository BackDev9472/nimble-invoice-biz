import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "Settings | walletpay";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Configure your account and app preferences.");
  }, []);

  const settingsTiles = [
    {
      title: "Company",
      description: "Manage company information, branding, and business details",
      icon: Building2,
      href: "/settings/company",
    },
    {
      title: "Personal",
      description: "Update your profile, password, and personal preferences",
      icon: User,
      href: "/settings/personal",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and application preferences</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {settingsTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Card 
                  key={tile.title} 
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200 group border-primary"
                  onClick={() => navigate(tile.href)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{tile.title}</CardTitle>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {tile.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
  );
};

export default Settings;
