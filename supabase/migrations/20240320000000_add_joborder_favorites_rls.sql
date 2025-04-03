-- Enable RLS on joborder_favorites table
ALTER TABLE public.joborder_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for joborder_favorites
CREATE POLICY "Users can view their own favorites"
ON public.joborder_favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.joborder_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.joborder_favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.joborder_favorites TO authenticated; 