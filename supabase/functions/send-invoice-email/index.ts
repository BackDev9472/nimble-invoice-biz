import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const fromEmail = Deno.env.get("FROM_EMAIL");

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

interface SendInvoiceEmailRequest {
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  invoiceId: string;
  message: string;
  companyName?: string;
  issueDate?: string;
  dueDate?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  paymentLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      invoiceNumber,
      invoiceId,
      message,
      companyName,
      issueDate,
      dueDate,
      items = [],
      subtotal = 0,
      taxRate = 0,
      taxAmount = 0,
      total = 0,
      paymentLink,
    }: SendInvoiceEmailRequest = await req.json();

    // console.log("Sending invoice email:", { recipientEmail, invoiceNumber, invoiceId });

    // Generate items HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.rate.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `Invoice ${invoiceNumber} from ${companyName || "Your Company"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 30px;">Invoice ${invoiceNumber}</h1>
          <p style="margin-bottom: 20px;">Dear ${recipientName},</p>
          <p style="margin-bottom: 30px;">${message}</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Invoice Details</h3>
            <table style="width: 100%; margin-bottom: 15px;">
              <tr>
                <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                <td style="padding: 5px 0; text-align: right;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>From:</strong></td>
                <td style="padding: 5px 0; text-align: right;">${companyName || "Your Company"}</td>
              </tr>
              ${issueDate ? `
              <tr>
                <td style="padding: 5px 0;"><strong>Issue Date:</strong></td>
                <td style="padding: 5px 0; text-align: right;">${issueDate}</td>
              </tr>
              ` : ''}
              ${dueDate ? `
              <tr>
                <td style="padding: 5px 0;"><strong>Due Date:</strong></td>
                <td style="padding: 5px 0; text-align: right;">${dueDate}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${items.length > 0 ? `
          <div style="margin: 30px 0;">
            <h3 style="color: #333;">Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Rate</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div style="margin: 20px 0; text-align: right;">
            <table style="width: 300px; margin-left: auto;">
              <tr>
                <td style="padding: 8px 0;"><strong>Subtotal:</strong></td>
                <td style="padding: 8px 0; text-align: right;">$${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Tax (${taxRate}%):</strong></td>
                <td style="padding: 8px 0; text-align: right;">$${taxAmount.toFixed(2)}</td>
              </tr>
              <tr style="border-top: 2px solid #333;">
                <td style="padding: 8px 0;"><strong style="font-size: 18px;">Total:</strong></td>
                <td style="padding: 8px 0; text-align: right;"><strong style="font-size: 18px;">$${total.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          ` : ''}

          ${paymentLink ? `
          <div style="text-align: center; margin: 40px 0;">
            <a href="${paymentLink}" 
               style="background-color: #4CAF50; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Pay Now
            </a>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px;">Please review the invoice and process payment according to the terms specified.</p>
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      `,
    });

    // console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
