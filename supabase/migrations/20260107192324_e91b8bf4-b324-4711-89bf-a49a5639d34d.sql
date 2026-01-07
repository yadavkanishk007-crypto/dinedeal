-- Create restaurant_images table for gallery
CREATE TABLE public.restaurant_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images of approved active restaurants
CREATE POLICY "Anyone can view restaurant images"
ON public.restaurant_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = restaurant_images.restaurant_id
    AND restaurants.is_approved = true
    AND restaurants.is_active = true
  )
);

-- Restaurant owners can manage their images
CREATE POLICY "Restaurant owners can manage their images"
ON public.restaurant_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = restaurant_images.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Admins can view all images
CREATE POLICY "Admins can view all restaurant images"
ON public.restaurant_images
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));