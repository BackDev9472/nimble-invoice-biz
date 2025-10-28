import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InvoiceStatus,
  InvoiceStatusBadge,
} from "@/components/invoice/invoice-status-badge";
import { ArrowLeft, Download, Mail, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import InvoiceCopyLink from "@/components/invoice/invoice-copy-link";
import InvoiceShareControl from "./invoice_share_control";
import { useRole } from "@/hooks/use-role";

interface Client {
  company_name: string;
  company_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  email?: string;
  phone?: string;
}

interface Item {
  description: string;
  quantity: number;
  rate: number;
}

interface Invoice {
  id: number;
  number: string;
  status: InvoiceStatus;
  client_id?: number;
  items: Item[];
  notes?: string;
  tax_rate?: number;
  issue_date: string;
  due_date: string;
  invoice_uid: string;
  sharing_enabled: boolean;
}

interface InvoiceDetailProps {
  invoice: Invoice;
  client?: Client | null;
  loading: boolean;
  isPublicView: boolean;
  handleOpenSendDialog?: () => void;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  invoice,
  client,
  loading,
  isPublicView,
  handleOpenSendDialog,
}) => {
  const isFullDetailView = !isPublicView;

  const { hasPermission } = useRole();

  const calculateTotal = (items: any[]) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  };

  const calculateTax = (subtotal: number, taxRate?: number) => {
    if (!taxRate) return 0;
    return subtotal * (taxRate / 100);
  };

  const handleSendInvoice = () => {
    if (handleOpenSendDialog) {
      handleOpenSendDialog();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
            {isFullDetailView && (
              <Button asChild>
                <Link to="/invoices">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Invoices
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const subtotal = calculateTotal(invoice.items);
  const tax = calculateTax(subtotal, (invoice.tax_rate ?? 0) * 100);
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        {renderHeader()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Invoice Details</CardTitle>

                  {isFullDetailView && (
                    <div>
                      {invoice.status != "draft" && (
                        <InvoiceCopyLink
                          invoiceId={invoice.id}
                          token={invoice.invoice_uid}
                        ></InvoiceCopyLink>
                      )}
                      <InvoiceStatusBadge status={invoice.status} />

                      {invoice.status != "draft" && (
                        <InvoiceShareControl
                          invoice_id={invoice.id}
                          initialEnabled={invoice.sharing_enabled}
                        ></InvoiceShareControl>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Client Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Bill To</h3>
                    <div className="text-sm space-y-1">
                      {client ? (
                        <>
                          <div className="font-medium">
                            {client.company_name}
                          </div>
                          {client.company_address && (
                            <div className="text-muted-foreground">
                              {client.company_address}
                            </div>
                          )}
                          {(client.city ||
                            client.state ||
                            client.postal_code) && (
                            <div className="text-muted-foreground">
                              {[client.city, client.state, client.postal_code]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          )}
                          {client.country && (
                            <div className="text-muted-foreground">
                              {client.country}
                            </div>
                          )}
                          <div className="text-muted-foreground">
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="text-muted-foreground">
                              {client.phone}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-muted-foreground">
                          No client information
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Issue Date
                      </div>
                      <div className="text-sm">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Due Date
                      </div>
                      <div className="text-sm">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Items</h3>
                    <div className="space-y-3">
                      {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-border rounded-lg gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium break-words">
                                {item.description}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Qty: {item.quantity} × ${item.rate}
                              </div>
                            </div>
                            <div className="text-right sm:text-right">
                              <div className="font-semibold">
                                ${(item.quantity * item.rate).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No items added
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Notes</h3>
                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                        {invoice.notes}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  {invoice.tax_rate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({(invoice.tax_rate ?? 0) * 100}%)
                      </span>
                      <span>${tax.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Badge variant="outline" className="w-full justify-center">
                      {invoice.items?.length || 0} item
                      {(invoice.items?.length || 0) !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  function renderHeader(): React.ReactNode {
    if (isPublicView) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold break-words overflow-wrap-anywhere">
                {invoice.number ?? "--"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Invoice details and summary
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          <Button variant="outline" asChild className="w-fit shrink-0">
            <Link to="/invoices">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold break-words overflow-wrap-anywhere">
              {invoice.number}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Invoice details and summary
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {hasPermission("manageInvoices") && invoice.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handleSendInvoice}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send
            </Button>
          )}
          {hasPermission("manageInvoices") && invoice.status === "draft" && (
            <Button size="sm" className="w-full sm:w-auto" asChild>
              <Link to={`/invoices/edit/${invoice.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }
};

export default InvoiceDetail;
