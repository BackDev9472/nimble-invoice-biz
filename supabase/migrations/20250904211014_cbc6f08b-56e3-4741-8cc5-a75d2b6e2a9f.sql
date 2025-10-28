-- Update invoices table to remove calculated fields
ALTER TABLE public.invoices 
DROP COLUMN IF EXISTS subtotal,
DROP COLUMN IF EXISTS tax_amount, 
DROP COLUMN IF EXISTS total;

-- Add missing columns for proper invoice management
ALTER TABLE public.invoices 
ADD COLUMN user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
ADD COLUMN status text NOT NULL DEFAULT 'draft',
ADD COLUMN notes text;

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();