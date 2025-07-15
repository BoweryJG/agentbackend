-- Supabase Auth Setup for AgentBackend
-- This script sets up the necessary tables and policies for role-based access control

-- Create a profiles table to store additional user metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'public' CHECK (role IN ('admin', 'client', 'public')),
  client_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, client_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'public'),
    new.raw_user_meta_data->>'clientId'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  new_role TEXT,
  new_client_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Check if the current user is an admin
  IF (auth.jwt() ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Update the profile
  UPDATE public.profiles
  SET 
    role = new_role,
    client_id = new_client_id,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Update the user metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN new_client_id IS NOT NULL THEN
        jsonb_build_object('role', new_role, 'clientId', new_client_id)
      ELSE
        jsonb_build_object('role', new_role)
    END
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

-- Policy: Only admins can update profiles
CREATE POLICY "Only admins can update profiles" ON public.profiles
  FOR UPDATE USING ((auth.jwt() ->> 'role') = 'admin');

-- Create initial admin user function
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email TEXT)
RETURNS VOID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID by email
  SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Update the profile to admin
  UPDATE public.profiles
  SET role = 'admin', updated_at = NOW()
  WHERE id = user_id;
  
  -- Update the user metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object('role', 'admin')
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Instructions for setting up Google OAuth in Supabase Dashboard:
-- 1. Go to Authentication > Providers in your Supabase dashboard
-- 2. Enable Google provider
-- 3. Add your Google OAuth credentials:
--    - Client ID (from Google Cloud Console)
--    - Client Secret (from Google Cloud Console)
-- 4. Set redirect URL in Google Cloud Console to:
--    https://[your-project-ref].supabase.co/auth/v1/callback
-- 5. Add authorized domains in Google Cloud Console

-- To make the first admin user:
-- 1. Have the user sign in with Google
-- 2. Run: SELECT public.create_admin_user('their-email@gmail.com');