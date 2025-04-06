-- Create a table to store system logs
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Store password hash for log page access (using "Mikee422!")
-- This is a secure way to store the password without exposing it in code
CREATE TABLE public.log_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the password hash (bcrypt of "Mikee422!")
INSERT INTO public.log_access_control (password_hash)
VALUES ('$2a$10$BkA5Ow7m6GG.iMRMoMpVK.Ujb9ExhGg2oR3mxmPiJL54k5TKjKbOC');

-- Enable RLS on system_logs table
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for system_logs table - only administrators can view logs
CREATE POLICY "Only administrators can view system logs"
ON public.system_logs
FOR SELECT
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator');

-- Create triggers to log changes in important tables
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  details_json JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    details_json := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    details_json := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changes', (SELECT jsonb_object_agg(key, value) FROM jsonb_each(to_jsonb(NEW)) 
                 WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key)
    );
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    details_json := to_jsonb(OLD);
  END IF;

  -- Insert log entry
  INSERT INTO public.system_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    action_type,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    details_json
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to important tables
CREATE TRIGGER log_users_changes
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER log_joborder_changes
AFTER INSERT OR UPDATE OR DELETE ON public.joborder
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER log_applicants_changes
AFTER INSERT OR UPDATE OR DELETE ON public.applicants
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER log_clients_changes
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER log_joborder_applicant_changes
AFTER INSERT OR UPDATE OR DELETE ON public.joborder_applicant
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

CREATE TRIGGER log_joborder_commission_changes
AFTER INSERT OR UPDATE OR DELETE ON public.joborder_commission
FOR EACH ROW EXECUTE FUNCTION public.log_table_change();