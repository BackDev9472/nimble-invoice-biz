//Types for all backend functions (request & response)

export interface GetInvoicePublicRequest {
  id: number;
  uuid: string;
}

export interface GetInvoicePublicResponse {
  id: number;
  invoice_uid: string;
  number: string;
  client_name: string;
  issue_date: Date;
  due_date: Date;
  items: any[];
  tax_rate: number;
  status: string;
  total: number;
  subtotal: number;
  // add other fields from your invoice_public_view
}

export class BackendFunctions {
  getInvoicePublic: {
    functionName: string;
    request: GetInvoicePublicRequest;
    response: GetInvoicePublicResponse;
    method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  } = {
    functionName: "get-invoice-public",
    request: {} as GetInvoicePublicRequest,
    response: {} as GetInvoicePublicResponse,
    method: "GET",
  };

  invoiceShareToggle: {
    functionName: string;
    request: { invoice_id: number; enable: boolean };
    response: { success: boolean };
    method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  } = {
    functionName: "invoice-share-toggle",
    request: { invoice_id: -1, enable: false },
    response: { success: false },
    method: "POST",
  };

  trackInvoiceLinkOpen: {
    functionName: string;
    request: { invoice_id: number; uuid: string };
    response: { success: boolean };
    method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  } = {
    functionName: "track-invoice-link-open",
    request: { invoice_id: -1, uuid: "" },
    response: { success: false },
    method: "POST",
  };

  requestWithdrawal: {
    functionName: string;
    request: { amount: number; paymentMethodId?: string };
    response: { success: boolean; withdrawalId: string; iframeUrl: string };
    method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  } = {
    functionName: "request-withdrawal",
    request: { amount: 0 },
    response: { success: false, withdrawalId: "", iframeUrl: "" },
    method: "POST",
  };

  processInvoicePayment: {
    functionName: string;
    request: {
      invoice_id: number;
      uuid: string;
      card_number: string;
      expiry_date: string;
      cvv: string;
      cardholder_name: string;
    };
    response: { success: boolean; transaction_id: string };
    method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  } = {
    functionName: "process-invoice-payment",
    request: {
      invoice_id: -1,
      uuid: "",
      card_number: "",
      expiry_date: "",
      cvv: "",
      cardholder_name: "",
    },
    response: { success: false, transaction_id: "" },
    method: "POST",
  };
}
