-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin/Owner', 'Billing', 'Viewer')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'inactive')),
  invited_by UUID,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view team members in their organization" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = invited_by);

CREATE POLICY "Users can invite team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Users can update team members they invited" 
ON public.team_members 
FOR UPDATE 
USING (auth.uid() = invited_by);

CREATE POLICY "Users can delete team members they invited" 
ON public.team_members 
FOR DELETE 
USING (auth.uid() = invited_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();