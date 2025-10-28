import React from 'react';
import { InvoiceForm } from "@/components/invoice/invoice-form";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Company {
  id: string;
  company_name: string;
  email?: string;
  phone?: string;
  company_address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

const NewInvoice = () => {
  return <InvoiceForm mode="create" />;
};

export default NewInvoice;