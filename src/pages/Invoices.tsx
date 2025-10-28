import React from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceStatusBadge } from "@/components/invoice/invoice-status-badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Search, Plus, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useRole } from "@/hooks/use-role";

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching invoices:', error);
        } else {
          setInvoices(data || []);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = (items: any[]) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const { hasPermission } = useRole();

  return (
    <div className="min-h-screen bg-background">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Invoices</h1>
              <p className="text-muted-foreground">Manage and track your invoices</p>
            </div>
            {hasPermission("manageInvoices") && (
            <Button asChild size="lg">
              <Link to="/invoices/new">
                <Plus className="w-5 h-5 mr-2" />
                Create Invoice
              </Link>
            </Button>
            )}
          </div>

          <Card className="border-primary">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>All Invoices</CardTitle>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading invoices...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-lg truncate">{invoice.number}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            Invoice #{invoice.id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Issued: {new Date(invoice.issue_date).toLocaleDateString()} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-shrink-0">
                        <InvoiceStatusBadge status={invoice.status} />
                        <div className="text-left sm:text-right">
                          <div className="font-bold text-lg">${calculateTotal(invoice.items).toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.items?.length || 0} item{(invoice.items?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {hasPermission("manageInvoices") && (
                        <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                          <Link to={`/invoices/${invoice.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredInvoices.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first invoice"}
                      </p>
                      <Button asChild size="lg">
                        <Link to="/invoices/new">
                          <Plus className="w-5 h-5 mr-2" />
                          Create Invoice
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default Invoices;