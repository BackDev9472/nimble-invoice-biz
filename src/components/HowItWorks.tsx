import { Card } from "@/components/ui/card";
import { FileText, Send, DollarSign } from "lucide-react";

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Create Invoice",
    description: "Choose a template, add your items, and customize your invoice in seconds.",
  },
  {
    icon: Send,
    number: "02",
    title: "Send & Track",
    description: "Send invoices via email and track when they're viewed, opened, and paid.",
  },
  {
    icon: DollarSign,
    number: "03",
    title: "Get Paid",
    description: "Accept payments online instantly with integrated payment processing.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground">
            From creation to payment in three simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-20" style={{ top: '80px' }} />
          
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="relative p-8 text-center hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6 shadow-lg">
                <step.icon className="w-10 h-10 text-primary-foreground" />
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
                  {step.number}
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
