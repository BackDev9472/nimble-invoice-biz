-- Add missing columns to invoices table for payment functionality
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS sharing_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total numeric(10,2) DEFAULT 0;

-- Update existing invoices to calculate subtotal and total from items
UPDATE public.invoices
SET 
  subtotal = COALESCE((
    SELECT SUM((item->>'amount')::numeric)
    FROM jsonb_array_elements(items::jsonb) AS item
  ), 0),
  total = COALESCE((
    SELECT SUM((item->>'amount')::numeric)
    FROM jsonb_array_elements(items::jsonb) AS item
  ), 0) * (1 + COALESCE(tax_rate, 0))
WHERE subtotal = 0 OR total = 0;

-- Create index for faster invoice lookups by UUID
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_uid ON public.invoices(invoice_uid);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- Create payment_transactions table if not exists
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id bigint NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  transaction_id text NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL,
  payment_method text,
  card_last_four text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view payment transactions for their own invoices
CREATE POLICY "Users can view their invoice payments"
  ON public.payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = payment_transactions.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Create index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON public.payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);
