import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SendInvoiceDialog } from "@/components/invoice/send-invoice-dialog";
import { InvoicePreviewDialog } from "@/components/invoice/invoice-preview-dialog";
import { Plus, Trash2, Save, Send, Eye, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "./types";

interface Company {
  id: string;
  company_name: string;
  email?: string;
  phone?: string;
  company_address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

interface InvoiceFormProps {
  mode: "create" | "edit";
  invoiceId?: string;
  initialData?: {
    number?: string;
    client_id?: string;
    issue_date?: string;
    due_date?: string;
    tax_rate?: number;
    items?: any[];
    notes?: string;
  };
  onBack?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  mode,
  invoiceId,
  initialData,
  onBack,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState(
    initialData?.client_id || ""
  );
  const [issueDate, setIssueDate] = useState(
    initialData?.issue_date || new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(initialData?.due_date || "");
  const [taxPercentage, setTaxPercentage] = useState(
    (initialData?.tax_rate || 0.08) * 100
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (initialData?.items && Array.isArray(initialData.items)) {
      const formattedItems = initialData.items.map((item: any) => ({
        description: item.description || "",
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        amount: (item.quantity || 1) * (item.rate || 0),
      }));
      return formattedItems.length > 0
        ? formattedItems
        : [{ description: "", quantity: 1, rate: 0, amount: 0 }];
    }
    return [{ description: "", quantity: 1, rate: 0, amount: 0 }];
  });
  const [showPreview, setShowPreview] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialData?.number || `INV-${Date.now()}`
  );

  // Fetch companies when component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching companies:", error);
          toast({
            title: "Error",
            description: "Failed to load companies",
            variant: "destructive",
          });
          return;
        }

        setCompanies(data || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [user, toast]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * (taxPercentage / 100);
  const total = subtotal + tax;

  const selectedClientData = companies.find(
    (company) => company.id === selectedClient
  );

  const validateInvoice = () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return false;
    }

    if (!dueDate) {
      toast({
        title: "Error",
        description: "Please set a due date",
        variant: "destructive",
      });
      return false;
    }

    const hasValidItems = items.some(
      (item) => item.description && item.rate > 0
    );
    if (!hasValidItems) {
      toast({
        title: "Error",
        description: "Please add at least one valid item",
        variant: "destructive",
      });
      return false;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save an invoice.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSendInvoice = async () => {
    if (!validateInvoice()) return;

    try {
      if (mode === "create") {
        // Generate invoice number for new invoice

        const { data, error } = await supabase
          .from("invoices")
          .insert({
            number: invoiceNumber,
            client_id: selectedClient,
            issue_date: issueDate,
            due_date: dueDate,
            tax_rate: taxPercentage / 100,
            items: JSON.parse(
              JSON.stringify(
                items.filter((item) => item.description && item.rate > 0)
              )
            ) as any,
            status: "draft", // Initially save as draft, will update to sent after send dialog
            notes: notes || null,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setCreatedInvoiceId(data.id.toString());
        setSendDialogOpen(true);
      } else {
        // Update existing invoice
        const { error } = await supabase
          .from("invoices")
          .update({
            client_id: selectedClient,
            issue_date: issueDate,
            due_date: dueDate,
            tax_rate: taxPercentage / 100,
            items: JSON.parse(
              JSON.stringify(
                items.filter((item) => item.description && item.rate > 0)
              )
            ) as any,
            status: "draft", // Initially keep as draft, will update to sent after send dialog
            notes: notes || null,
          })
          .eq("id", parseInt(invoiceId!))
          .eq("user_id", user!.id);

        if (error) throw error;

        setCreatedInvoiceId(invoiceId!);
        setSendDialogOpen(true);
      }
    } catch (error) {
      console.error("Error with invoice:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          mode === "create" ? "create" : "update"
        } invoice. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleSave = async (isDraft = true) => {
    if (!validateInvoice()) return;

    try {
      if (mode === "create") {
        // Generate invoice number for new invoice
        const newInvoiceNumber = `INV-${Date.now()}`;

        const { error } = await supabase.from("invoices").insert({
          number: newInvoiceNumber,
          client_id: selectedClient,
          issue_date: issueDate,
          due_date: dueDate,
          tax_rate: taxPercentage / 100,
          items: JSON.parse(
            JSON.stringify(
              items.filter((item) => item.description && item.rate > 0)
            )
          ) as any,
          status: isDraft ? "draft" : "sent",
          notes: notes || null,
          user_id: user.id,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Invoice ${
            isDraft ? "saved as draft" : "sent"
          } successfully!`,
        });

        navigate("/invoices");
      } else {
        // Update existing invoice
        const { error } = await supabase
          .from("invoices")
          .update({
            client_id: selectedClient,
            issue_date: issueDate,
            due_date: dueDate,
            tax_rate: taxPercentage / 100,
            items: JSON.parse(
              JSON.stringify(
                items.filter((item) => item.description && item.rate > 0)
              )
            ) as any,
            status: isDraft ? "draft" : "sent",
            notes: notes || null,
          })
          .eq("id", parseInt(invoiceId!))
          .eq("user_id", user!.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Invoice updated successfully!",
        });

        navigate(`/invoices/${invoiceId}`);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          mode === "create" ? "save" : "update"
        } invoice. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (mode === "edit") {
      navigate(`/invoices/${invoiceId}`);
    } else {
      navigate("/invoices");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "create" ? "Create New Invoice" : "Edit Invoice"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Fill in the details to create a new invoice"
                : "Update invoice details"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Client & Date Info */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client">Client</Label>
                    <Select
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="invoice-number">Invoice Number</Label>
                    <Input
                      id="invoice-number"
                      value={invoiceNumber}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="issue-date">Issue Date</Label>
                    <Input
                      id="issue-date"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-percentage">Tax %</Label>
                    <Input
                      id="tax-percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxPercentage.toFixed(2)}
                      onChange={(e) =>
                        setTaxPercentage(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  <Button onClick={addItem} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 items-end"
                    >
                      <div className="col-span-5">
                        <Label>Description</Label>
                        <Input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Rate</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Amount</Label>
                        <Input
                          value={`$${item.amount.toFixed(2)}`}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes or terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-8 border-primary">
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({taxPercentage.toFixed(2)}%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="secondary"
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Invoice
                  </Button>
                  <Button
                    onClick={handleSendInvoice}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Invoice
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {mode === "create" ? "Save as Draft" : "Update Invoice"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InvoicePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        selectedClientData={selectedClientData}
        issueDate={issueDate}
        dueDate={dueDate}
        items={items}
        notes={notes}
        taxPercentage={taxPercentage}
        subtotal={subtotal}
        tax={tax}
        total={total}
      />

      <SendInvoiceDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        invoice={
          {
            id: createdInvoiceId,
            number: invoiceNumber,
            client_id: selectedClient,
            issue_date: issueDate,
            due_date: dueDate,
            tax_rate: taxPercentage / 100,
            items: items.filter((item) => item.description && item.rate > 0),
            status: "draft",
            notes: notes || null,
            invoice_uid: "",
          } as Invoice
        }
      />
    </div>
  );
};
