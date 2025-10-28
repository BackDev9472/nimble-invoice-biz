import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import InvoiceDetail from "@/components/invoice/invoice-detail";
import { useRole } from "@/hooks/use-role";
import { SendInvoiceDialog } from "@/components/invoice/send-invoice-dialog";

const InvoiceView = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const { hasPermission } = useRole();

  const fetchInvoice = async () => {
    if (!user || !id) return;

    try {
      const { data: invoiceData, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", parseInt(id))
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching invoice:", error);
        return;
      }

      setInvoice(invoiceData);

      // Fetch client data if client_id exists
      if (invoiceData.client_id) {
        const { data: clientData } = await supabase
          .from("companies")
          .select("*")
          .eq("id", invoiceData.client_id)
          .single();

        setClient(clientData);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [user, id]);

  return (
    <>
      <InvoiceDetail
        invoice={invoice}
        client={client}
        loading={loading}
        isPublicView={false}
        handleOpenSendDialog={() => setSendDialogOpen(true)}
      />
      {hasPermission("manageInvoices") && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          invoice={invoice}
          onSuccess={fetchInvoice}
        />
      )}
    </>
  );
};

export default InvoiceView;
