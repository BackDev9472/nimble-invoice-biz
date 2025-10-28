-- Create companies table for storing company information
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  company_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'United States',
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for company access
CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own company" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company" 
ON public.companies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company" 
ON public.companies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();