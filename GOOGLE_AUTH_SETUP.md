# Google OAuth Setup for AgentBackend

This guide walks you through setting up Google OAuth authentication with Supabase for the AgentBackend system.

## Prerequisites

1. A Supabase project
2. A Google Cloud Console account
3. Environment variables set in your `.env` file:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Set the following:
     - **Name**: AgentBackend Auth
     - **Authorized JavaScript origins**: 
       - `https://YOUR-PROJECT-ID.supabase.co`
     - **Authorized redirect URIs**: 
       - `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

5. Save your credentials:
   - **Client ID**: `your-google-client-id`
   - **Client Secret**: `your-google-client-secret`

## Step 2: Supabase Dashboard Setup

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and enable it
4. Enter your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Save the configuration

## Step 3: Database Setup

Run the SQL script to set up the necessary tables and functions:

```bash
# From the agentbackend directory
psql $SUPABASE_DB_URL < database/supabase-auth-setup.sql
```

Or run it directly in the Supabase SQL editor.

## Step 4: Create First Admin User

1. Have someone sign in with Google through your app
2. Get their user ID from Supabase Dashboard (Authentication > Users)
3. Run this SQL command in Supabase SQL editor:
   ```sql
   SELECT public.create_admin_user('their-email@gmail.com');
   ```

## Step 5: Frontend Integration

Update your frontend applications to use Supabase Auth:

```javascript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// Sign in with Google
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}

// Handle auth callback
async function handleAuthCallback() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (session) {
    // Send token to backend
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })
    })
  }
}
```

## Step 6: Update Backend API Calls

All API calls from frontend should now include the Supabase access token:

```javascript
// Example API call with auth
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch('/api/agents', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
})
```

## Step 7: Testing

1. Start the backend server:
   ```bash
   npm start
   ```

2. Test the auth endpoints:
   ```bash
   # Get current user (requires valid token)
   curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:3002/api/auth/me
   
   # List users (admin only)
   curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3002/api/auth/users
   ```

## Environment Variables Summary

Add these to your `.env` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Remove or comment out legacy auth
# JWT_SECRET=your-jwt-secret-key
```

## Migration Notes

- The legacy auth endpoints are still available at `/api/auth/legacy/*`
- New Supabase auth endpoints are at `/api/auth/*`
- All other endpoints now use Supabase JWT verification
- User roles are stored in Supabase user metadata

## Security Best Practices

1. Never expose your service role key to the frontend
2. Always validate tokens on the backend
3. Use Row Level Security (RLS) in Supabase
4. Regularly rotate your Google OAuth credentials
5. Monitor authentication logs in Supabase Dashboard