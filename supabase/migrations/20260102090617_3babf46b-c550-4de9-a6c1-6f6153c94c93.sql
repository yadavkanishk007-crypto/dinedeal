-- Create OTP verification table for email and phone
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  phone TEXT,
  otp_code TEXT NOT NULL,
  otp_type TEXT NOT NULL CHECK (otp_type IN ('password_reset', 'phone_verification')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Policy for inserting OTP (allow all - public function will handle this)
CREATE POLICY "Anyone can insert OTP for verification"
ON public.otp_verifications
FOR INSERT
WITH CHECK (true);

-- Policy for reading own OTP verification
CREATE POLICY "Anyone can read OTP for verification"
ON public.otp_verifications
FOR SELECT
USING (true);

-- Policy for updating OTP verification
CREATE POLICY "Anyone can update OTP verification"
ON public.otp_verifications
FOR UPDATE
USING (true);

-- Policy for deleting expired OTPs
CREATE POLICY "Anyone can delete OTP"
ON public.otp_verifications
FOR DELETE
USING (true);

-- Update restaurants default city to Jhansi
ALTER TABLE public.restaurants ALTER COLUMN city SET DEFAULT 'Jhansi';

-- Update existing restaurants with Bangalore to Jhansi
UPDATE public.restaurants SET city = 'Jhansi' WHERE city = 'Bangalore';