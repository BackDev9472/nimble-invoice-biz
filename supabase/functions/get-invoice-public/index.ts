import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { HandlerOptions, runHandler } from "../_shared/function-run-handler.ts";

async function getInvoicePublicHandler({
  req,
  supabase,
  queryParams,
  jsonHeaders,
}: HandlerOptions) {
  const { id, uuid } = queryParams;

  // Fetch data
  const { data, error } = await supabase
    .from("public_invoices")
    .select("*")
    .eq("id", parseInt(id))
    .eq("invoice_uid", uuid)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    return new Response(JSON.stringify({ error: "Invoice not found" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  if (["Draft", "Deleted", "Archived"].includes(data.status)) {
    return new Response(JSON.stringify({ error: "Invoice not available" }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  if (data.sharing_enabled === false) {
    return new Response(JSON.stringify({ error: "Invoice not available" }), {
      status: 403,
      headers: jsonHeaders,
    });
  }
  // ✅ Success
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: jsonHeaders,
  });
}

serve(
  async (req: Request) =>
    await runHandler(req, {
      isPublic: false,
      requireAdmin: true,
      requiredQueryParams: ["id", "uuid"],
      requiredBodyParams: [],
      handler: getInvoicePublicHandler,
    })
);
