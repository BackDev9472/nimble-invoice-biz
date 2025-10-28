//Wrapper for backend functions (Supabase / other)

import { createClient } from "@supabase/supabase-js";
import { BackendFunctions } from "./functions.types";

// Access VITE_ env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

type BackendInvoker = {
  [K in keyof BackendFunctions]: (
    payload: BackendFunctions[K]["request"],
    method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE"
  ) => Promise<BackendFunctions[K]["response"]>;
};

// Create backend wrapper
export const backend: BackendInvoker = new Proxy(
  {},
  {
    get(_, funcName: string) {
      return async (
        payload: any,
        method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE" = "POST"
      ) => {
        let options: any = { method };

        if (method === "GET") {
          // Convert payload object to query string
          const params = new URLSearchParams(payload).toString();
          const url = params ? `${funcName}?${params}` : funcName;

          const { data, error } = await supabase.functions.invoke(url, options);

          if (error) {
            const errorMessage = await error.context.text();
            throw { code: error.context.status, message: errorMessage };
          }
          return typeof data === "string" ? JSON.parse(data) : data;
        } else {
          // Non-GET methods use body
          options.body = payload;

          const { data, error } = await supabase.functions.invoke(
            funcName,
            options
          );
          if (error) throw error;
          return typeof data === "string" ? JSON.parse(data) : data;
        }
      };
    },
  }
) as BackendInvoker;
