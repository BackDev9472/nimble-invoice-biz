import React, { useEffect, useState } from "react";
import { GetInvoicePublicResponse } from "@/backend/functions.types";
import InvoiceDetail from "@/components/invoice/invoice-detail";
import { useBackend } from "@/hooks/useBackend";
import { useParams } from "react-router-dom";

type Props = {};

const InvoicePublicView = (props: Props) => {
  const { getInvoicePublic, trackInvoiceLinkOpen } = useBackend();
  const { invoiceId, token } = useParams();
  const [invoice, setInvoice] = useState<GetInvoicePublicResponse>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = async () => {
    try {
      const res = await getInvoicePublic({
        id: parseInt(invoiceId!), // Use non-null assertion since we check below
        uuid: token!, // Use non-null assertion since we check below
      });

      setLoading(false);

      if (res) {
        setInvoice(res);

        const res2 = await trackInvoiceLinkOpen({
          invoice_id: parseInt(invoiceId!),
          uuid: token!,
        });

        if (trackInvoiceLinkOpen.error) {
          console.error(
            "Error tracking invoice link open:",
            trackInvoiceLinkOpen.error
          );
        }
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  };

  useEffect(() => {
    if (!invoiceId || !token) return;
    fetchInvoice();
  }, [invoiceId, token]);

  // Show error state (non-401 errors)
  if (getInvoicePublic.error && getInvoicePublic.errorCode !== 401) {
    return <p style={{ color: "red" }}>Error: {getInvoicePublic.error}</p>;
  }

  // Show invoice when successfully loaded
  if (invoice) {
    return (
      <InvoiceDetail
        invoice={invoice as any}
        client={{ company_name: invoice.client_name } as any}
        loading={false}
        isPublicView={true}
      />
    );
  }

  // Show empty invoice detail for 401 errors or other cases
  return (
    <InvoiceDetail
      invoice={null}
      client={null}
      loading={getInvoicePublic.loading || loading}
      isPublicView={true}
    />
  );
};

export default InvoicePublicView;
