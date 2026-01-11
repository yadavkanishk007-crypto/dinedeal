-- Create table for storing push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all subscriptions (for sending notifications)
CREATE POLICY "Admins can view all subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create admin_permissions table for role-based admin access
CREATE TABLE public.admin_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  can_view_revenue BOOLEAN DEFAULT false,
  can_manage_restaurants BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_coupons BOOLEAN DEFAULT false,
  can_send_notifications BOOLEAN DEFAULT false,
  can_view_audit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can view their own permissions
CREATE POLICY "Admins can view their own permissions"
ON public.admin_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Super admins can manage all permissions
CREATE POLICY "Super admins can manage permissions"
ON public.admin_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create notification_logs table
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_by UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all',
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view and create notification logs
CREATE POLICY "Admins can manage notification logs"
ON public.notification_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));