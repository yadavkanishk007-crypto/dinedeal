-- Create menu_items table for restaurants
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT DEFAULT 'Main Course',
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_veg BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reservations table for table bookings
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 2,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  phone TEXT,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupons table for admin-generated coupon codes
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INTEGER NOT NULL,
  max_discount NUMERIC DEFAULT 500,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id),
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon_usages table to track coupon usage
CREATE TABLE public.coupon_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Menu Items RLS Policies
CREATE POLICY "Anyone can view menu items of active restaurants"
ON public.menu_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = menu_items.restaurant_id 
  AND restaurants.is_approved = true 
  AND restaurants.is_active = true
));

CREATE POLICY "Restaurant owners can manage their menu items"
ON public.menu_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = menu_items.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

CREATE POLICY "Admins can view all menu items"
ON public.menu_items FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Reservations RLS Policies
CREATE POLICY "Users can view their own reservations"
ON public.reservations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
ON public.reservations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
ON public.reservations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can view their reservations"
ON public.reservations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = reservations.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

CREATE POLICY "Restaurant owners can update their reservations"
ON public.reservations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM restaurants 
  WHERE restaurants.id = reservations.restaurant_id 
  AND restaurants.owner_id = auth.uid()
));

CREATE POLICY "Admins can view all reservations"
ON public.reservations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Coupons RLS Policies
CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all coupons"
ON public.coupons FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Coupon Usages RLS Policies
CREATE POLICY "Users can view their own coupon usages"
ON public.coupon_usages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create coupon usages"
ON public.coupon_usages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupon usages"
ON public.coupon_usages FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();