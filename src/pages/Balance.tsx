import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, CreditCard, ArrowDownLeft, History } from 'lucide-react';
import { useBackend } from '@/hooks/useBackend';
import { toast } from '@/hooks/use-toast';

const Balance = () => {
  const [amount, setAmount] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const api = useBackend();

  const handleWithdrawal = async () => {
    const withdrawalAmount = parseFloat(amount);
    
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (withdrawalAmount > 2847.32) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds available balance",
        variant: "destructive",
      });
      return;
    }

    const response = await api.requestWithdrawal({
      amount: withdrawalAmount,
      paymentMethodId: "bank_1234",
    });

    if (response) {
      setIframeUrl(response.iframeUrl);
      setShowPaymentDialog(true);
      toast({
        title: "Withdrawal Initiated",
        description: "Please complete the payment verification",
      });
    } else if (api.requestWithdrawal.error) {
      toast({
        title: "Withdrawal Failed",
        description: api.requestWithdrawal.error,
        variant: "destructive",
      });
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Balance & Payments</h1>
                <p className="text-muted-foreground">Manage your account balance and withdrawals</p>
              </div>
            </div>

            {/* Merchant Fees */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Processing Fees
                </CardTitle>
                <CardDescription>
                  Payment processing fees for different payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Visa, Mastercard, Discover</span>
                    <Badge variant="outline">2.5% + $0.15</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">American Express</span>
                    <Badge variant="outline">3% + $0.30</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">ACH</span>
                    <Badge variant="outline">1%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Overview */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$2,847.32</div>
                  <p className="text-xs text-muted-foreground">
                    +$432.18 from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
                  <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$150.00</div>
                  <p className="text-xs text-muted-foreground">
                    2 pending transactions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Withdrawal Form */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Request Withdrawal</CardTitle>
                <CardDescription>
                  Withdraw funds to your connected payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="amount">Withdrawal Amount</Label>
                  <Input
                    type="number"
                    id="amount"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="method">Payment Method</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-md">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm">Bank Account ****1234</span>
                    <Badge variant="secondary" className="ml-auto">Primary</Badge>
                  </div>
                </div>

                <Button 
                  className="w-full max-w-sm"
                  onClick={handleWithdrawal}
                  disabled={api.requestWithdrawal.loading}
                >
                  {api.requestWithdrawal.loading ? 'Processing...' : 'Request Withdrawal'}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: 1, type: 'credit', amount: 150.00, description: 'Invoice #INV-001 payment', date: '2 hours ago', status: 'completed' },
                    { id: 2, type: 'debit', amount: 75.00, description: 'Withdrawal to Bank ****1234', date: '1 day ago', status: 'pending' },
                    { id: 3, type: 'credit', amount: 320.50, description: 'Invoice #INV-002 payment', date: '3 days ago', status: 'completed' },
                    { id: 4, type: 'debit', amount: 200.00, description: 'Withdrawal to Bank ****1234', date: '1 week ago', status: 'completed' },
                  ].map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'credit' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment iframe dialog */}
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="max-w-4xl h-[80vh]">
              <DialogHeader>
                <DialogTitle>Complete Withdrawal</DialogTitle>
              </DialogHeader>
              <div className="flex-1 h-full">
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-0 rounded-md"
                  title="Payment Processor"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  );
};

export default Balance;