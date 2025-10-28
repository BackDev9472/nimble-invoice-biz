import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceItem } from './types';

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

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClientData?: Company;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
  taxPercentage: number;
  subtotal: number;
  tax: number;
  total: number;
}

export const InvoicePreviewDialog: React.FC<InvoicePreviewDialogProps> = ({
  open,
  onOpenChange,
  selectedClientData,
  issueDate,
  dueDate,
  items,
  notes,
  taxPercentage,
  subtotal,
  tax,
  total
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Client Information */}
                  {selectedClientData ? (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Bill To</h3>
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{selectedClientData.company_name}</div>
                        {selectedClientData.email && <div className="text-muted-foreground">{selectedClientData.email}</div>}
                        {selectedClientData.phone && <div className="text-muted-foreground">{selectedClientData.phone}</div>}
                        {selectedClientData.company_address && (
                          <div className="text-muted-foreground">
                            {selectedClientData.company_address}
                            {selectedClientData.city && `, ${selectedClientData.city}`}
                            {selectedClientData.state && `, ${selectedClientData.state}`}
                            {selectedClientData.postal_code && ` ${selectedClientData.postal_code}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No client selected</div>
                  )}

                  {/* Invoice Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Issue Date</div>
                      <div className="text-sm">{new Date(issueDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Due Date</div>
                      <div className="text-sm">{dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set'}</div>
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Items</h3>
                    <div className="space-y-3">
                      {items.filter(item => item.description && item.rate > 0).map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border border-border rounded-lg">
                          <div>
                            <div className="font-medium">{item.description}</div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ${item.rate}
                            </div>
                          </div>
                          <div className="font-semibold">${item.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Notes</h3>
                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                        {notes}
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
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({taxPercentage.toFixed(2)}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};