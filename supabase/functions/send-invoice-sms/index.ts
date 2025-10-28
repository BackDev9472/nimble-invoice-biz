import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface SendInvoiceSMSRequest {
  recipientPhone: string;
  recipientName: string;
  invoiceNumber: string;
  message: string;
  companyName?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientPhone, 
      recipientName, 
      invoiceNumber, 
      message,
      companyName,
      issueDate,
      dueDate,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      paymentLink
    }: SendInvoiceSMSRequest = await req.json();

    console.log("Sending invoice SMS:", { recipientPhone, invoiceNumber });

    // Validate Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio credentials not configured");
    }

    // Format items for SMS
    const itemsList = items.map((item, index) => 
      `${index + 1}. ${item.description} (${item.quantity}x $${item.rate.toFixed(2)}) = $${item.amount.toFixed(2)}`
    ).join('\n');

    // Construct detailed SMS message
    const smsBody = `${companyName || 'Invoice System'}: ${message}

Invoice #${invoiceNumber}
Issue Date: ${new Date(issueDate).toLocaleDateString()}
Due Date: ${new Date(dueDate).toLocaleDateString()}

Items:
${itemsList}

Subtotal: $${subtotal.toFixed(2)}
Tax (${taxRate}%): $${taxAmount.toFixed(2)}
Total: $${total.toFixed(2)}

Pay Now: ${paymentLink}`;

    // Send SMS using Twilio API
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: recipientPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: smsBody,
        }),
      }
    );

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio API error:", twilioData);
      throw new Error(twilioData.message || "Failed to send SMS");
    }

    console.log("SMS sent successfully:", twilioData.sid);

    return new Response(JSON.stringify({ 
      success: true, 
      messageSid: twilioData.sid 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-sms function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
