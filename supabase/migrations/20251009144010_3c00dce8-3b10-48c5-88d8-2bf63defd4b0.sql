-- Add updated_at column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();