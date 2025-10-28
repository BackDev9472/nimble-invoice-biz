import { jsonHeaders, corsHeaders } from "./cors.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase clients
export const supabasePublic = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role for admin
);

export interface HandlerOptions {
  req: Request;
  supabase: typeof supabasePublic | typeof supabaseAdmin;
  queryParams: Record<string, string>;
  bodyParams: Record<string, any>;
  jsonHeaders: any;
  userToken?: string;
}

/**
 * Generic request handler for endpoints
 */
export async function runHandler(
  req: Request,
  options: {
    isPublic?: boolean; // skip auth check
    requireAdmin?: boolean; // require admin access
    requiredQueryParams?: string[]; // required query parameters
    requiredBodyParams?: string[]; // required JSON body fields
    handler: (context: HandlerOptions) => Promise<Response>;
  }
) {
  const origin = req.headers.get("origin") || "*";

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders(origin) });
    }


    let userToken;
    // Auth check for non-public routes
    if (!options.isPublic) {
      const auth = req.headers.get("Authorization");
      if (!auth || !auth.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: jsonHeaders(origin),
        });
      }

      userToken = auth.replace("Bearer ", "");

    }

    // Parse query parameters
    const url = new URL(req.url);
    const query: Record<string, string> = {};
    if (options.requiredQueryParams) {
      for (const key of options.requiredQueryParams) {
        const value = url.searchParams.get(key);
        if (!value) {
          return new Response(
            JSON.stringify({ error: `Missing query parameter: ${key}` }),
            { status: 400, headers: jsonHeaders(origin) }
          );
        }
        query[key] = value;
      }
    }

    // Parse JSON body if required
    let body: Record<string, any> = {};
    if (options.requiredBodyParams && req.method !== "GET") {
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: jsonHeaders(origin),
        });
      }

      for (const key of options.requiredBodyParams) {
        if (!(key in body)) {
          return new Response(
            JSON.stringify({ error: `Missing body parameter: ${key}` }),
            { status: 400, headers: jsonHeaders(origin) }
          );
        }
      }
    }

    const supabase = options.requireAdmin ? supabaseAdmin : supabasePublic;

    // Run actual handler
    return await options.handler({
      req,
      supabase,
      queryParams: query,
      bodyParams: body,
      jsonHeaders: jsonHeaders(origin),
      userToken,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: jsonHeaders(origin),
    });
  }
}
