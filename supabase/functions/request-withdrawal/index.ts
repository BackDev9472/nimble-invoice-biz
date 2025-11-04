import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { HandlerOptions, runHandler } from "../_shared/function-run-handler.ts";

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

  // Generate payment iframe URL (mock for now)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const iframeUrl = `${supabaseUrl}/payment-processor?withdrawal_id=${withdrawal.id}`;

  return new Response(
    JSON.stringify({ 
      success: true, 
      withdrawalId: withdrawal.id,
      iframeUrl,
    }),
    { status: 200, headers: jsonHeaders }
  );
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
