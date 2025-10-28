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
}
