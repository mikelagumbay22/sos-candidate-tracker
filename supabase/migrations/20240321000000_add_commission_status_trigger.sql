-- Create function to update commission status
CREATE OR REPLACE FUNCTION public.update_commission_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on received_commission and current_commission
  IF NEW.current_commission = 0 THEN
    NEW.status := 'pending';
  ELSIF NEW.received_commission >= NEW.current_commission THEN
    NEW.status := 'completed';
  ELSE
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update status
CREATE TRIGGER update_commission_status_trigger
  BEFORE INSERT OR UPDATE OF received_commission, current_commission
  ON public.joborder_commission
  FOR EACH ROW
  EXECUTE FUNCTION public.update_commission_status();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_commission_status() TO authenticated; 