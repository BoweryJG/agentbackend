# Using BoweryCreativeAgency Supabase Project for AgentBackend

Since you're already using the `bowerycreativeagency` Supabase project for your agency site, we'll integrate the agentbackend authentication with the same project.

## 1. Add Redirect URLs in Supabase Dashboard

Go to your Supabase Dashboard > Authentication > URL Configuration and **add** these to your existing Redirect URLs:

```
https://pedro.netlify.app
https://repconnect.netlify.app
https://agent-command-center.netlify.app
https://gregpedromd.com
https://www.gregpedromd.com
https://repconnect.repspheres.com
https://www.repconnect.repspheres.com
http://localhost:3002
http://localhost:3003
http://localhost:5173
```

## 2. Update AgentBackend Environment Variables

In your agentbackend `.env` file, use your BoweryCreativeAgency Supabase credentials:

```env
# Use your existing Supabase project
SUPABASE_URL=https://[your-bowerycreative-project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-bowerycreative-service-role-key

# Remove or comment out the legacy JWT secret
# JWT_SECRET=your-jwt-secret-key
```

## 3. Run the Database Setup

Since you're using an existing project, we need to add the agent-specific tables and functions.

**First, check if you already have a profiles table:**
```sql
-- Run this in Supabase SQL Editor to check
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';
```

**If you DON'T have a profiles table**, run the full setup:
```sql
-- Run database/supabase-auth-setup.sql
```

**If you ALREADY have a profiles table**, run this modified version:
```sql
-- Only add the role check function and admin creation function
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

-- Create admin user function
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
```

## 4. Update Frontend Apps

Each frontend app (Pedro, RepConnect, Agent Command Center) needs to use the BoweryCreativeAgency Supabase credentials:

```javascript
// .env.local or .env
REACT_APP_SUPABASE_URL=https://[your-bowerycreative-project-id].supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-bowerycreative-anon-key

// For Vite-based apps (like Pedro)
VITE_SUPABASE_URL=https://[your-bowerycreative-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-bowerycreative-anon-key
```

## 5. Shared Authentication Benefits

Now all your systems will share authentication:
- Users can sign in once and access all systems
- Agency site users can access agentbackend features based on their role
- Single user management interface in Supabase

## 6. Role Management

To manage roles for agentbackend:

1. **Make yourself an admin** (after signing in once):
   ```sql
   SELECT public.create_admin_user('your-email@gmail.com');
   ```

2. **Assign client roles** to healthcare practices:
   ```sql
   -- Update a user to client role with specific client ID
   SELECT public.update_user_role(
     'user-uuid-here',
     'client',
     'pedro-practice'
   );
   ```

## 7. Testing

Test the integration:
1. Sign in to your agency site
2. Use the same session to access agentbackend APIs
3. Verify role-based access works correctly

## Important Notes

- Keep your agency site's existing auth flow unchanged
- The agentbackend will respect the same user sessions
- Users keep their existing accounts and passwords
- Google OAuth will work across all apps with the same Google account