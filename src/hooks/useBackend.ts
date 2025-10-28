import { useState, useRef, useMemo } from "react";
import { backend } from "@/backend/backend";
import { BackendFunctions } from "@/backend/functions.types";
import { getFriendlyErrorMessage } from "@/backend/errorUtils";

type BackendHook = {
  globalLoading: boolean;
} & {
  [K in keyof BackendFunctions]: {
    loading: boolean;
    error: string | null;
    errorCode: number | null;
    call: (
      payload: BackendFunctions[K]["request"]
    ) => Promise<BackendFunctions[K]["response"] | null>;
    // This allows calling the function directly: sendInvoiceSMS(payload)
    (payload: BackendFunctions[K]["request"]): Promise<
      BackendFunctions[K]["response"] | null
    >;
  };
};

export function useBackend(): BackendHook {
  const [globalLoading, setGlobalLoading] = useState(false);

  // Store per-function state
  const stateRefs = useRef<
    Record<string, { loading: boolean; error: string | null; errorCode: number | null }>
  >({});

  const backendFunctions = new BackendFunctions();

  const api = useMemo(() => {
    const result = {} as BackendHook;

    (Object.keys(backendFunctions) as (keyof BackendFunctions)[]).forEach(
      (funcName) => {
        if (!stateRefs.current[funcName]) {
          stateRefs.current[funcName] = { loading: false, error: null, errorCode: null };
        }

        const setLoading = (value: boolean) =>
          (stateRefs.current[funcName].loading = value);
        const setError = (value: string | null, code: number | null) => {
          stateRefs.current[funcName].error = value;
          stateRefs.current[funcName].errorCode = code;
        };

        const call = async (payload: any) => {
          setLoading(true);
          setError(null, null);
          setGlobalLoading(true);

          try {
            const res = await backend[backendFunctions[funcName].functionName](
              payload,
              backendFunctions[funcName].method
            );

            if (res && (res as any).code) {
              const {code, message} = getFriendlyErrorMessage(funcName, res);
              setError(message, code);
              return null;
            }

            return res;
          } catch (err: any) {
            const {code, message} = getFriendlyErrorMessage(funcName, err);
            setError(message, code);
            return null;
          } finally {
            setLoading(false);
            setGlobalLoading(false);
          }
        };

        // Create a callable function object
        const fn: any = (payload: any) => call(payload);
        Object.defineProperty(fn, "loading", {
          get: () => stateRefs.current[funcName].loading,
        });
        Object.defineProperty(fn, "error", {
          get: () => stateRefs.current[funcName].error,
        });
        fn.call = call;

        result[funcName] = fn;
      }
    );

    result.globalLoading = globalLoading;

    return result;
  }, [globalLoading]);

  return api;
}
