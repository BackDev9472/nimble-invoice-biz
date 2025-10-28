import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mail, Phone, Building2, User, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export interface Contact {
  id: string;
  merchant_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

const Contacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    merchant_name: "",
    contact_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    document.title = "Contacts | walletpay";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Manage contacts and client details.");
    
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add contacts",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert([
          {
            user_id: user.id,
            merchant_name: formData.merchant_name,
            contact_name: formData.contact_name,
            email: formData.email,
            phone: formData.phone || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setContacts([data, ...contacts]);
      setFormData({ merchant_name: "", contact_name: "", email: "", phone: "" });
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Contact added successfully",
      });
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      setContacts(contacts.filter(contact => contact.id !== contactId));
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Contacts</h1>
              <p className="text-muted-foreground">Manage your merchant and client contacts</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new merchant or client contact to your address book.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="merchant_name">Merchant Name *</Label>
                    <Input
                      id="merchant_name"
                      name="merchant_name"
                      value={formData.merchant_name}
                      onChange={handleInputChange}
                      placeholder="Enter merchant or company name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name *</Label>
                    <Input
                      id="contact_name"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleInputChange}
                      placeholder="Enter contact person's name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number (optional)"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Contact</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {contacts.length === 0 ? (
            <Card className="border-primary">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start building your contact list by adding merchants and clients
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact) => (
                <Card key={contact.id} className="relative border-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{contact.merchant_name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {contact.contact_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <Badge variant="secondary" className="text-xs">
                        Added {new Date(contact.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
  );
};

export default Contacts;
