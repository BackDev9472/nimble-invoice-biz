import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { HandlerOptions, runHandler } from "../_shared/function-run-handler.ts";

async function processInvoicePaymentHandler({
  req,
  supabase,
  bodyParams,
  jsonHeaders,
}: HandlerOptions) {
  const { invoice_id, uuid, card_number, expiry_date, cvv, cardholder_name } = bodyParams;

  // Validate card details (basic validation)
  if (!card_number || !expiry_date || !cvv || !cardholder_name) {
    return new Response(
      JSON.stringify({ error: "All card details are required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  // Verify invoice exists and is accessible via public view
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoice_public_view")
    .select("*")
    .eq("id", invoice_id)
    .eq("invoice_uid", uuid)
    .single();

  if (invoiceError || !invoice) {
    console.error("Invoice not found:", invoiceError);
    return new Response(
      JSON.stringify({ error: "Invoice not found" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  // Check if invoice is already paid
  if (invoice.status === "paid") {
    return new Response(
      JSON.stringify({ error: "This invoice has already been paid" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const finixApiKey = Deno.env.get("FINIX_API_KEY");
  if (!finixApiKey) {
    console.error("FINIX_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Payment processing not configured" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  try {
    // Step 1: Tokenize the card with Finix
    const tokenizeResponse = await fetch("https://finix.com/payment_instruments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(finixApiKey + ":")}`,
      },
      body: JSON.stringify({
        type: "PAYMENT_CARD",
        number: card_number.replace(/\s/g, ""),
        expiration_month: expiry_date.split("/")[0],
        expiration_year: "20" + expiry_date.split("/")[1],
        security_code: cvv,
        name: cardholder_name,
      }),
    });

    if (!tokenizeResponse.ok) {
      const errorData = await tokenizeResponse.json();
      console.error("Finix tokenization error:", errorData);
      return new Response(
        JSON.stringify({ error: "Card validation failed. Please check your card details." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const paymentInstrument = await tokenizeResponse.json();

    // Step 2: Create authorization (charge)
    const amountInCents = Math.round(invoice.total * 100);
    const authResponse = await fetch("https://finix.com/authorizations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(finixApiKey + ":")}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: "USD",
        source: paymentInstrument.id,
        merchant: Deno.env.get("FINIX_MERCHANT_ID"),
        tags: {
          invoice_id: invoice_id.toString(),
          invoice_number: invoice.number,
        },
      }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      console.error("Finix authorization error:", errorData);
      
      // Handle common decline reasons
      const declineMessage = errorData.messages?.[0]?.message || "Payment was declined";
      return new Response(
        JSON.stringify({ error: `Payment failed. ${declineMessage}. Please try another card or contact your bank.` }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const authorization = await authResponse.json();

    // Step 3: Update invoice status to paid
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ 
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice_id);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
      // Payment was successful but invoice update failed - log for manual review
      console.error("CRITICAL: Payment successful but invoice update failed", {
        invoice_id,
        transaction_id: authorization.id,
      });
    }

    // Log the transaction
    const { error: logError } = await supabase
      .from("payment_transactions")
      .insert({
        invoice_id,
        transaction_id: authorization.id,
        amount: invoice.total,
        status: "completed",
        payment_method: "card",
        card_last_four: card_number.slice(-4),
      });

    if (logError) {
      console.error("Error logging transaction:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: authorization.id,
        message: "Payment processed successfully",
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error: any) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ error: "We're having trouble connecting. Please try again." }),
      { status: 500, headers: jsonHeaders }
    );
  }
}

serve(
  async (req: Request) =>
    await runHandler(req, {
      isPublic: true, // Public endpoint for invoice payment
      requireAdmin: false,
      requiredQueryParams: [],
      requiredBodyParams: ["invoice_id", "uuid", "card_number", "expiry_date", "cvv", "cardholder_name"],
      handler: processInvoicePaymentHandler,
    })
);
