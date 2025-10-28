//Custom error code mapping per function

export const functionErrorMaps = {
  getInvoicePublic: {
    400: "Missing ID or UUID for invoice.",
    401: "Unauthorized. Please provide a valid token.",
    403: "Invoice not available.",
    404: "Invoice not found.",
    500: "Server error while fetching invoice.",
  },
  invoiceShareToggle: {
    400: "Missing or invalid parameters.",
    401: "Unauthorized.",
    403: "Invoice not available.",
    404: "Invoice not found.",
    500: "Server error while toggling invoice link sharing.",
  },
} as const;
