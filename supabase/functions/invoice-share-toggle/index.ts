import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { HandlerOptions, runHandler } from "../_shared/function-run-handler.ts";

async function invoiceShareToggleHandler({
  req,
  supabase,
  bodyParams,
  jsonHeaders,
  userToken,
}: HandlerOptions) {


  // Parse params
  const { invoice_id, enable } = bodyParams;


  const {
    data: { user },
  } = await (supabase as any).auth.getUser(userToken);

  // Check invoice exists and belongs to user must be here
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoice_id)
    .eq("user_id", user.id.toString())
    .maybeSingle();

  const { data, error, count } = await supabase
    .from("invoices")
    .update({ sharing_enabled: enable })
    .eq("id", invoice_id)
    .eq("user_id", user.id.toString())
    .select(); // returns updated rows

  if (error) throw error;

  // ✅ Success
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: jsonHeaders,
  });
}

serve(
  async (req: Request) =>
    await runHandler(req, {
      isPublic: false, //important  ***********
      requireAdmin: true, //important  ***********
      requiredQueryParams: [],
      requiredBodyParams: ["invoice_id", "enable"],
      handler: invoiceShareToggleHandler,
    })
);
