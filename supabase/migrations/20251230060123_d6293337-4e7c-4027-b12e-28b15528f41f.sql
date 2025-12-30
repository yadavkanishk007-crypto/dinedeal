-- Create admin user using Supabase auth
-- Note: This creates the user with the specified credentials
-- The password will be properly hashed by Supabase

-- First, we need to insert directly into auth.users (this requires service role)
-- Since we can't do that in a migration, we'll create a helper that the edge function can use

-- Create a function to check if admin user exists and set up their role
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists by looking for the role
  SELECT user_id INTO admin_user_id 
  FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  -- If no admin exists, we'll create a placeholder that will be filled when the user signs up
  -- The actual user creation will happen via the Auth API
  IF admin_user_id IS NULL THEN
    -- Log that admin needs to be created via signup
    RAISE NOTICE 'Admin user should be created via the Auth signup flow with email: zaveadmin123@gmail.com';
  END IF;
END $$;