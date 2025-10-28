import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import {
  HandlerOptions,
  runHandler,
} from "../_shared/function-run-handler.ts";

async function updateInvoiceHandler({
  req,
  supabase,
  bodyParams,
  jsonHeaders,
}: HandlerOptions) {

  const { invoice_id, uuid } = bodyParams;

  const { data, error, status } = await supabase.from("invoice_link_open_logs").insert({
      invoice_id: invoice_id,
      opened_at: new Date().toISOString(),
      user_agent: req.headers.get("User-Agent") ?? null,
      ip_address:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("cf-connecting-ip") ||
        "unknown",
    });


  if (error) throw new Error(error.message);

  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: jsonHeaders,
  });
}

serve(
  async (req: Request) =>
    await runHandler(req, {
      isPublic: true, //important  ***********
      requireAdmin: false, //important  ***********
      requiredQueryParams: [],
      requiredBodyParams: ["invoice_id","uuid"],
      handler: updateInvoiceHandler,
    })
);
