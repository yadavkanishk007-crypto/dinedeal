-- Add bank/UPI columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;