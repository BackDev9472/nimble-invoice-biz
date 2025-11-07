import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GetInvoicePublicResponse } from "@/backend/functions.types";
import { useBackend } from "@/hooks/useBackend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const cardSchema = z.object({
  card_number: z.string()
    .min(13, "Card number must be at least 13 digits")
    .max(19, "Card number must be at most 19 digits")
    .regex(/^\d+$/, "Card number must contain only digits"),
  expiry_date: z.string()
    .regex(/^\d{2}\/\d{2}$/, "Expiry must be in MM/YY format"),
  cvv: z.string()
    .min(3, "CVV must be 3-4 digits")
    .max(4, "CVV must be 3-4 digits")
    .regex(/^\d+$/, "CVV must contain only digits"),
  cardholder_name: z.string()
    .min(2, "Cardholder name is required")
    .max(100, "Name must be less than 100 characters"),
});

const InvoicePayment = () => {
  const { invoiceId, token } = useParams();
  const navigate = useNavigate();
  const { getInvoicePublic, processInvoicePayment } = useBackend();
  
  const [invoice, setInvoice] = useState<GetInvoicePublicResponse | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardType, setCardType] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!invoiceId || !token) return;
    
    const fetchInvoice = async () => {
      const res = await getInvoicePublic({
        id: parseInt(invoiceId),
        uuid: token,
      });

      if (res) {
        setInvoice(res);
        
        // Check if already paid
        if (res.status === "paid") {
          toast({
            title: "Invoice Already Paid",
            description: "This invoice has already been paid.",
          });
        }
      }
    };

    fetchInvoice();
  }, [invoiceId, token]);

  // Card type detection
  const detectCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, "");
    if (/^4/.test(cleaned)) return "visa";
    if (/^5[1-5]/.test(cleaned)) return "mastercard";
    if (/^3[47]/.test(cleaned)) return "amex";
    if (/^6(?:011|5)/.test(cleaned)) return "discover";
    return "";
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const type = detectCardType(cleaned);
    setCardType(type);
    
    // Amex: 4-6-5, Others: 4-4-4-4
    if (type === "amex") {
      return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3").trim();
    }
    return cleaned.replace(/(\d{4})/g, "$1 ").trim();
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const maxLength = cardType === "amex" ? 4 : 3;
    if (value.length <= maxLength) {
      setCvv(value);
    }
  };

  const validateForm = () => {
    try {
      cardSchema.parse({
        card_number: cardNumber.replace(/\s/g, ""),
        expiry_date: expiryDate,
        cvv,
        cardholder_name: cardholderName,
      });

      // Additional expiry validation
      const [month, year] = expiryDate.split("/");
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        setErrors({ expiry_date: "Your card has expired" });
        return false;
      }

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check your card details",
        variant: "destructive",
      });
      return;
    }

    const response = await processInvoicePayment({
      invoice_id: parseInt(invoiceId!),
      uuid: token!,
      card_number: cardNumber.replace(/\s/g, ""),
      expiry_date: expiryDate,
      cvv,
      cardholder_name: cardholderName,
    });

    if (response?.success) {
      setPaymentSuccess(true);
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully",
      });
      
      // Clear form
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setCardholderName("");
    } else if (processInvoicePayment.error) {
      toast({
        title: "Payment Failed",
        description: processInvoicePayment.error,
        variant: "destructive",
      });
    }
  };

  if (getInvoicePublic.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The invoice you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Invoice #{invoice.number} has been paid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">${invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-medium">{invoice.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">•••• {cardNumber.slice(-4)}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              A confirmation receipt has been sent to your email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invoice.status === "paid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invoice Already Paid</CardTitle>
            <CardDescription>This invoice has already been paid.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-medium">{invoice.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">${invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-green-600">Paid</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Invoice Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-medium">{invoice.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{invoice.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total Amount</span>
                <span>${invoice.total?.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Secure Payment
            </CardTitle>
            <CardDescription>
              All transactions are secure and encrypted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Number */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className={errors.card_number ? "border-destructive" : ""}
                  />
                  {cardType && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {errors.card_number && (
                  <p className="text-sm text-destructive">{errors.card_number}</p>
                )}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    className={errors.expiry_date ? "border-destructive" : ""}
                  />
                  {errors.expiry_date && (
                    <p className="text-sm text-destructive">{errors.expiry_date}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    type="password"
                    value={cvv}
                    onChange={handleCvvChange}
                    className={errors.cvv ? "border-destructive" : ""}
                  />
                  {errors.cvv && (
                    <p className="text-sm text-destructive">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className={errors.cardholder_name ? "border-destructive" : ""}
                />
                {errors.cardholder_name && (
                  <p className="text-sm text-destructive">{errors.cardholder_name}</p>
                )}
              </div>

              {/* Supported Cards */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground mb-2">Accepted Cards</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Visa</span>
                  <span>•</span>
                  <span>Mastercard</span>
                  <span>•</span>
                  <span>American Express</span>
                  <span>•</span>
                  <span>Discover</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={processInvoicePayment.loading}
              >
                {processInvoicePayment.loading ? "Processing..." : `Pay $${invoice.total?.toFixed(2)}`}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                <Lock className="inline h-3 w-3 mr-1" />
                Your payment information is encrypted and secure
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoicePayment;
