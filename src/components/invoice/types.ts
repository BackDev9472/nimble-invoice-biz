import { InvoiceStatus } from "@/components/invoice/invoice-status-badge";

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  address?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  id?: number | string;
}

export interface Invoice {
  id: number | string;
  invoice_uid: string;
  number: string;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  tax_rate: number;
  client_id: string;
  client?: Client;
  status: InvoiceStatus;
  subtotal: number;
  total: number;
  notes?: string;
}
