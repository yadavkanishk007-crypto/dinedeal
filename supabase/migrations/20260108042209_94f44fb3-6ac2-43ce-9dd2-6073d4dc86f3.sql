-- Create admin_audit_logs table for tracking admin actions
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert from authenticated users (the edge function will verify admin status)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add reminder_sent column to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Create index for efficient reminder queries
CREATE INDEX idx_reservations_reminder ON public.reservations (reservation_date, reservation_time, reminder_sent, status);