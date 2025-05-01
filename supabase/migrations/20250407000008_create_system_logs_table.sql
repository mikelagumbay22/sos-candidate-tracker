-- Create system logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for system logs
CREATE POLICY "Allow admins to view system logs"
ON public.system_logs FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

-- Create log table change function
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

-- Create triggers for logging changes
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

-- Grant permissions
GRANT ALL ON public.system_logs TO authenticated;
GRANT ALL ON public.system_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.log_table_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_table_change() TO service_role; 