import React, { useState } from "react";

export interface Props {
  invoiceId: number;
  token: string;
}

const InvoiceCopyLink = ({ invoiceId, token }: Props) => {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const link = `${window.location.origin}/invoice/${invoiceId}/${token}`;

  const copyInvoiceLink = () => {
    if (navigator.clipboard) {
      // Use Clipboard API if available
      navigator.clipboard
        .writeText(link)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    } else {
      // Fallback: show modal
      setShowModal(true);
    }
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={copyInvoiceLink}
        className="py-0.5 px-2.5 mr-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
      >
        Copy Invoice Link
      </button>

      {copied && (
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-md shadow-md animate-fade-in whitespace-nowrap">
          Link copied!
        </span>
      )}

      {/* Modal for manual copy */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-80 relative">
            <h3 className="text-sm font-semibold mb-2">Copy Link Manually</h3>
            <input
              type="text"
              readOnly
              value={link}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs mb-4"
              onFocus={(e) => e.target.select()}
            />
            <p className="text-xs text-gray-600 mb-4">
              Clipboard API not available. Please copy the link manually.
            </p>
            <button
              onClick={closeModal}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceCopyLink;
