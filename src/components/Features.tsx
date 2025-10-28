import { Card } from "@/components/ui/card";
import { 
  Zap, 
  Clock, 
  Shield, 
  BarChart3, 
  Bell, 
  Globe 
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Create and send invoices in under 60 seconds with our intuitive interface and smart templates.",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Track billable hours automatically and convert them into accurate invoices instantly.",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description: "Bank-level encryption and compliance with international invoicing standards.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Get insights into your revenue, outstanding payments, and business performance.",
  },
  {
    icon: Bell,
    title: "Auto Reminders",
    description: "Never chase payments again with automated follow-ups and payment reminders.",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    description: "Work with clients worldwide with support for 150+ currencies and tax systems.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Get Paid
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful features designed to streamline your invoicing workflow and accelerate payments
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 mb-6">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
