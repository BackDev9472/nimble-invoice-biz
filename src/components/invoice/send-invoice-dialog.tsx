import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Mail, MessageSquare, Plus } from "lucide-react";
import InvoiceCopyLink from "./invoice-copy-link";
import { Invoice, InvoiceItem } from "./types";
import { Contact } from "@/pages/Contacts";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onSuccess?: () => void;
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: SendInvoiceDialogProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "email" | "sms" | "both"
  >("email");
  const [contactMode, setContactMode] = useState<"existing" | "new">(
    "existing"
  );
  const [newContact, setNewContact] = useState({
    contact_name: "",
    merchant_name: "",
    email: "",
    phone: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchContacts();
      setMessage(
        `Please find attached invoice #${invoice.number}. You can view and pay this invoice online using the secure link provided.`
      );
    }
  }, [open, invoice]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, contact_name, merchant_name, email, phone")
      .order("contact_name");

    if (error) {
      console.error("Error fetching contacts:", error);
      return;
    }

    setContacts(data || []);
  };

  const handleSend = async () => {
    setIsLoading(true);

    try {
      let recipientContact;

      if (contactMode === "existing") {
        recipientContact = contacts.find((c) => c.id === selectedContact);
        if (!recipientContact) {
          toast({
            title: "Error",
            description: "Please select a contact",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Validate new contact
        if (!newContact.contact_name || !newContact.email) {
          toast({
            title: "Error",
            description: "Contact name and email are required",
            variant: "destructive",
          });
          return;
        }

        if (deliveryMethod === "sms" || deliveryMethod === "both") {
          if (!newContact.phone) {
            toast({
              title: "Error",
              description: "Phone number is required for SMS delivery",
              variant: "destructive",
            });
            return;
          }
        }

        // Save new contact to database
        const { data: savedContact, error: contactError } = await supabase
          .from("contacts")
          .insert([
            {
              contact_name: newContact.contact_name,
              merchant_name: newContact.merchant_name,
              email: newContact.email,
              phone: newContact.phone || null,
              user_id: user?.id,
            },
          ])
          .select()
          .single();

        if (contactError) {
          console.error("Error saving contact:", contactError);
          toast({
            title: "Error",
            description: "Failed to save contact",
            variant: "destructive",
          });
          return;
        }

        recipientContact = savedContact;
      }

      // Validate delivery method requirements
      if (
        (deliveryMethod === "email" || deliveryMethod === "both") &&
        !recipientContact.email
      ) {
        toast({
          title: "Error",
          description: "Email address is required for email delivery",
          variant: "destructive",
        });
        return;
      }

      if (
        (deliveryMethod === "sms" || deliveryMethod === "both") &&
        !recipientContact.phone
      ) {
        toast({
          title: "Error",
          description: "Phone number is required for SMS delivery",
          variant: "destructive",
        });
        return;
      }

      // Get company info for email
      const { data: companyData } = await supabase
        .from("companies")
        .select("company_name")
        .single();

      // Calculate invoice totals
      const items = (invoice?.items as InvoiceItem[]) || [];
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxRate = (invoice?.tax_rate || 0) * 100;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Get current website URL for payment link
      const paymentLink = `${window.location.origin}/invoice/${invoice.id}/${invoice.invoice_uid}`;

      // Send email if required
      if (deliveryMethod === "email" || deliveryMethod === "both") {
        const { data: emailResult, error: emailError } =
          await supabase.functions.invoke("send-invoice-email", {
            body: {
              recipientEmail: recipientContact.email,
              recipientName: recipientContact.contact_name,
              invoiceNumber: invoice.number,
              invoiceId: invoice.id,
              message: message,
              companyName: companyData?.company_name,
              issueDate: invoice?.issue_date,
              dueDate: invoice?.due_date,
              items: items,
              subtotal: subtotal,
              taxRate: taxRate,
              taxAmount: taxAmount,
              total: total,
              paymentLink: paymentLink,
            },
          });

        if (emailError) {
          console.error("Error sending email:", emailError);
          toast({
            title: "Error",
            description: "Failed to send email",
            variant: "destructive",
          });
          return;
        }

        if (!emailResult?.success) {
          toast({
            title: "Error",
            description: "Failed to send email",
            variant: "destructive",
          });
          return;
        }
      }

      // Send SMS if required
      if (deliveryMethod === "sms" || deliveryMethod === "both") {
        const { data: smsResult, error: smsError } =
          await supabase.functions.invoke("send-invoice-sms", {
            body: {
              recipientPhone: recipientContact.phone,
              recipientName: recipientContact.contact_name,
              invoiceNumber: invoice.number,
              message: message,
              companyName: companyData?.company_name,
              issueDate: invoice?.issue_date,
              dueDate: invoice?.due_date,
              items: items,
              subtotal: subtotal,
              taxRate: taxRate,
              taxAmount: taxAmount,
              total: total,
              paymentLink: paymentLink,
            },
          });

        if (smsError) {
          console.error("Error sending SMS:", smsError);
          toast({
            title: "Error",
            description: "Failed to send SMS",
            variant: "destructive",
          });
          return;
        }

        if (!smsResult?.success) {
          toast({
            title: "Error",
            description: "Failed to send SMS",
            variant: "destructive",
          });
          return;
        }
      }

      // Update invoice status to 'sent'
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", parseInt(`${invoice.id}`));

      if (updateError) {
        console.error("Error updating invoice status:", updateError);
        toast({
          title: "Warning",
          description: "Email sent but failed to update invoice status",
          variant: "destructive",
        });
      }

      // Log the delivery attempt
      const deliveryLog = {
        invoice_id: invoice.id,
        contact_id: recipientContact.id,
        delivery_method: deliveryMethod,
        status: "sent",
        timestamp: new Date().toISOString(),
        user_id: user?.id,
      };

      toast({
        title: "Invoice Sent",
        description: (
          <>
            <h1>{`Invoice #${invoice.number} has been sent via ${deliveryMethod} to ${recipientContact.contact_name}`}</h1>
            <InvoiceCopyLink
              invoiceId={parseInt(invoice.id as string)}
              token={invoice.invoice_uid || ""}
            />
          </>
        ),
      });

      onOpenChange(false);

      onSuccess?.();

      // Reset form
      setSelectedContact("");
      setContactMode("existing");
      setNewContact({
        contact_name: "",
        merchant_name: "",
        email: "",
        phone: "",
      });
      setDeliveryMethod("email");
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Invoice #{invoice.number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Delivery Method */}
          <div>
            <Label className="text-base font-medium">Delivery Method</Label>
            <RadioGroup
              value={deliveryMethod}
              onValueChange={(value: any) => setDeliveryMethod(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" />
                <Label htmlFor="sms" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both">Both Email & SMS</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Contact Selection */}
          <div>
            <Label className="text-base font-medium">Recipient</Label>
            <RadioGroup
              value={contactMode}
              onValueChange={(value: any) => setContactMode(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing">Select from contacts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add new contact
                </Label>
              </div>
            </RadioGroup>

            {contactMode === "existing" ? (
              <div className="mt-3">
                <Select
                  value={selectedContact}
                  onValueChange={setSelectedContact}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div>
                          <div className="font-medium">
                            {contact.contact_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {contact.merchant_name} • {contact.email}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="contact_name">Contact Name *</Label>
                    <Input
                      id="contact_name"
                      value={newContact.contact_name}
                      onChange={(e) =>
                        setNewContact((prev) => ({
                          ...prev,
                          contact_name: e.target.value,
                        }))
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchant_name">Company Name</Label>
                    <Input
                      id="merchant_name"
                      value={newContact.merchant_name}
                      onChange={(e) =>
                        setNewContact((prev) => ({
                          ...prev,
                          merchant_name: e.target.value,
                        }))
                      }
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) =>
                        setNewContact((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      Phone{" "}
                      {(deliveryMethod === "sms" ||
                        deliveryMethod === "both") &&
                        "*"}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) =>
                        setNewContact((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
