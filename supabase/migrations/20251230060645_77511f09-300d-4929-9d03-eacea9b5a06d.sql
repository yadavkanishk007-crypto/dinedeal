-- Create ratings table for customer feedback
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  dining_rating INTEGER NOT NULL CHECK (dining_rating >= 1 AND dining_rating <= 5),
  app_rating INTEGER CHECK (app_rating >= 1 AND app_rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Users can view their own ratings
CREATE POLICY "Users can view their own ratings"
ON public.ratings FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings"
ON public.ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Restaurant owners can view ratings for their restaurant
CREATE POLICY "Restaurant owners can view their ratings"
ON public.ratings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.restaurants
  WHERE restaurants.id = ratings.restaurant_id
  AND restaurants.owner_id = auth.uid()
));

-- Admins can view all ratings
CREATE POLICY "Admins can view all ratings"
ON public.ratings FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add UPI ID column to restaurants for QR payments
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;