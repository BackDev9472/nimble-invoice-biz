-- Add sharing_enabled column to invoice table
ALTER TABLE public.invoices 
ADD COLUMN sharing_enabled BOOLEAN NOT NULL DEFAULT false;

-- Optional: Add comment to document the column
COMMENT ON COLUMN public.invoices.sharing_enabled IS 'Indicates whether invoice sharing is enabled';