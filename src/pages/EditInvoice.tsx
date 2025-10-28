import React from 'react';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const EditInvoice = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!user || !id) return;
      
      try {
        const { data: invoiceData, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', parseInt(id))
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching invoice:', error);
          toast({
            title: "Error",
            description: "Failed to load invoice",
            variant: "destructive",
          });
          return;
        }

        setInitialData(invoiceData);
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [user, id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InvoiceForm 
      mode="edit" 
      invoiceId={id}
      initialData={initialData}
    />
  );
};

export default EditInvoice;