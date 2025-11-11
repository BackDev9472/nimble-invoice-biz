import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { HandlerOptions, runHandler } from "../_shared/function-run-handler.ts";

const FINIX_API_KEY = "US9sbXLgYdx2TuTGLD4UJ1yQ";
const MERCHANT_ID = "MUe4e4kcKRp6CjbLmG6b8X5C";
const FINIX_API_URL = "https://finix.sandbox-payments-api.com";

async function requestWithdrawalHandler({
  req,
  supabase,
  bodyParams,
  jsonHeaders,
  userToken,
}: HandlerOptions) {
  const { data: { user } } = await (supabase as any).auth.getUser(userToken);

  const { amount, paymentMethodId } = bodyParams;

  if (!amount || amount <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid amount" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  // Insert withdrawal request
  const { data: withdrawal, error: insertError } = await supabase
    .from("withdrawals")
    .insert({
      user_id: user.id,
      amount,
      payment_method_id: paymentMethodId || "bank_1234",
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating withdrawal:", insertError);
    return new Response(
      JSON.stringify({ error: "Failed to create withdrawal" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  try {
    // Create Finix Payment Link
    const finixResponse = await fetch(`${FINIX_API_URL}/payment_links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Finix-Version": "2022-02-01",
        "Authorization": `Basic ${btoa(`${FINIX_API_KEY}:`)}`,
      },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount_details: {
          amount_type: "FIXED",
          currency: "USD",
          total_amount: Math.round(amount * 100), // Convert to cents
        },
        additional_details: {
          collect_billing_address: true,
          collect_email: true,
          collect_name: true,
          collect_phone: true,
          send_receipt: true,
        },
        payment_frequency: "ONE_TIME",
        nickname: `Withdrawal ${withdrawal.id}`,
        tags: {
          withdrawal_id: withdrawal.id,
          user_id: user.id,
        },
      }),
    });

    if (!finixResponse.ok) {
      const errorText = await finixResponse.text();
      console.error("Finix API error:", errorText);
      throw new Error(`Finix API error: ${finixResponse.status}`);
    }

    const finixData = await finixResponse.json();
    console.log("Finix payment link created:", finixData.id);

    // Update withdrawal with payment link ID
    await supabase
      .from("withdrawals")
      .update({ 
        payment_link_id: finixData.id,
        payment_link_url: finixData.url,
      })
      .eq("id", withdrawal.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        withdrawalId: withdrawal.id,
        iframeUrl: finixData.url,
        paymentLinkId: finixData.id,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("Error creating Finix payment link:", error);
    
    // Update withdrawal status to failed
    await supabase
      .from("withdrawals")
      .update({ status: "failed" })
      .eq("id", withdrawal.id);

    return new Response(
      JSON.stringify({ error: "Failed to create payment link" }),
      { status: 500, headers: jsonHeaders }
    );
  }
}

serve(
  async (req: Request) =>
    await runHandler(req, {
      isPublic: false,
      requireAdmin: false,
      requiredQueryParams: [],
      requiredBodyParams: ["amount"],
      handler: requestWithdrawalHandler,
    })
);
