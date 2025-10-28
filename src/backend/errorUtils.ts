// Utility to convert backend errors to friendly messages

import { functionErrorMaps } from "./errorMaps";

export function getFriendlyErrorMessage(
  funcName: string,
  error: { code: number; message: string }
): { code: number; message: string } {
  if (!error) return { code: -1, message: "Unknown error occurred" };

  if (
    error.code &&
    functionErrorMaps[funcName as keyof typeof functionErrorMaps]
  ) {
    const map = functionErrorMaps[funcName as keyof typeof functionErrorMaps]!;
    return map[error.code] || error.message || `Error code ${error.code}`;
  }

  if (error.message) return { code: error.code, message: error.message };

  return { code: -1, message: "Something went wrong. Please try again." };
}
