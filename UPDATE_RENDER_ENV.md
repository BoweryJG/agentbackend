# Update Render Environment Variables

## Add these environment variables to your Render dashboard:

1. Go to https://dashboard.render.com/
2. Select your `agentbackend` service
3. Go to **Environment** tab
4. Add these variables:

```env
# Supabase Configuration
SUPABASE_URL=https://fiozmyoedptukpkzuhqm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Dashboard > Settings > API > service_role key]

# Remove or comment out legacy auth
# JWT_SECRET=your-jwt-secret-key
```

## To get your Service Role Key:

1. Go to https://app.supabase.com/project/fiozmyoedptukpkzuhqm
2. Navigate to **Settings** > **API**
3. Copy the **service_role** key (keep this secret!)

## After updating:

1. Render will automatically redeploy your service
2. The new Supabase auth will be active
3. Legacy auth endpoints remain at `/api/auth/legacy/*` if needed

## Test URLs:

- Health check: https://agentbackend-2932.onrender.com/api/health
- Auth test: Use the test-supabase-auth.html file locally first
- Once confirmed working, frontend apps can be updated