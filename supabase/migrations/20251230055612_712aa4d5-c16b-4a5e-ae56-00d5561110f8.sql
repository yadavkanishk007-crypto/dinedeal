-- Create storage bucket for restaurant images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('restaurant-images', 'restaurant-images', true);

-- Allow anyone to view restaurant images
CREATE POLICY "Anyone can view restaurant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

-- Allow restaurant owners to upload their restaurant images
CREATE POLICY "Restaurant owners can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow restaurant owners to update their images
CREATE POLICY "Restaurant owners can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow restaurant owners to delete their images
CREATE POLICY "Restaurant owners can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid() IS NOT NULL
);