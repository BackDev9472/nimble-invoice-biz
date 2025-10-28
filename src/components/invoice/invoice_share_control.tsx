import { useBackend } from "@/hooks/useBackend";
import React, { useEffect, useState } from "react";
import Loading from "../loading";

type Props = { initialEnabled: boolean; invoice_id: number };

const InvoiceShareControl = ({ initialEnabled, invoice_id }: Props) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const { invoiceShareToggle } = useBackend();

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleToggle = async () => {
    const res = await invoiceShareToggle({
      invoice_id: invoice_id,
      enable: !enabled,
    });
    if (!invoiceShareToggle.error) {
      setEnabled(!enabled);
    }
  };

  return (
    <div className="pl-1 pt-1 text-sm">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          disabled={invoiceShareToggle.loading}
          onChange={handleToggle}
          className="mr-1"
        />
         Enabled Link
      </label>
      {invoiceShareToggle.loading && (
        <div className="ml-2 inline-block w-4 h-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
};

export default InvoiceShareControl;
