import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/invoice/invoice-status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Users, DollarSign, Clock, Plus, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
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

  const calculateTotal = (items: any[]) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + calculateTotal(invoice.items), 0);
  
  const pendingAmount = invoices
    .filter(invoice => invoice.status === 'sent')
    .reduce((sum, invoice) => sum + calculateTotal(invoice.items), 0);
  
  const overdueAmount = invoices
    .filter(invoice => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + calculateTotal(invoice.items), 0);

  const recentInvoices = invoices.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
        <div className="relative bg-accent overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex gap-4 justify-start">
                <Button asChild size="lg" variant="default">
                  <Link to="/invoices/new">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Invoice
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Link to="/invoices">
                    <Eye className="w-5 h-5 mr-2" />
                    View All
                  </Link>
                </Button>
              </div>
              <div className="hidden lg:block">
                {/* Stats Cards in Hero - Desktop Only */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-500/20 backdrop-blur-sm border-green-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white/90">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString()}</div>
                      <p className="text-xs text-white/70">From paid invoices</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-orange-500/20 backdrop-blur-sm border-orange-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white/90">Pending</CardTitle>
                      <Clock className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-400">${pendingAmount.toLocaleString()}</div>
                      <p className="text-xs text-white/70">Awaiting payment</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-500/20 backdrop-blur-sm border-red-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white/90">Overdue</CardTitle>
                      <FileText className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-400">${overdueAmount.toLocaleString()}</div>
                      <p className="text-xs text-white/70">Past due date</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white/90">Total Invoices</CardTitle>
                      <Users className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-400">{invoices.length}</div>
                      <p className="text-xs text-white/70">All time</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <section>
            {/* Stats Cards - Mobile/Tablet */}
            <div className="grid grid-cols-2 lg:hidden gap-6 mb-8">
              <Card className="bg-green-500/20 backdrop-blur-sm border-green-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">From paid invoices</p>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-500/20 backdrop-blur-sm border-orange-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">${pendingAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Awaiting payment</p>
                </CardContent>
              </Card>
              
              <Card className="bg-red-500/20 backdrop-blur-sm border-red-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Overdue</CardTitle>
                  <FileText className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">${overdueAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Past due date</p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Invoices</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{invoices.length}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Invoices */}
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Invoices</CardTitle>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/invoices">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading invoices...</p>
                  </div>
                ) : recentInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                    <p className="text-muted-foreground mb-4">Get started by creating your first invoice</p>
                    <Button asChild size="lg">
                      <Link to="/invoices/new">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Invoice
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{invoice.number}</div>
                            <div className="text-sm text-muted-foreground">Invoice #{invoice.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <InvoiceStatusBadge status={invoice.status} />
                          <div className="text-right">
                            <div className="font-medium">${calculateTotal(invoice.items).toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Due {new Date(invoice.due_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
  );
};

export default Dashboard;