# Google OAuth Quick Setup - Web Application

## Choose "Web application" in Google Cloud Console

When creating OAuth 2.0 credentials, select **Web application** (not Desktop app) because:

1. Supabase handles the OAuth flow through web redirects
2. Users will authenticate in their browser
3. The callback URL is a web URL (https://your-project.supabase.co/auth/v1/callback)

## Quick Steps:

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Create OAuth 2.0 Credentials
- Navigate to **APIs & Services** > **Credentials**
- Click **+ CREATE CREDENTIALS** > **OAuth client ID**
- Choose **Web application**

### 3. Configure the Web Application

**Application name**: AgentBackend Auth (or any name you prefer)

**Authorized JavaScript origins** (add ALL of these):
```
https://YOUR-PROJECT-ID.supabase.co
http://localhost:3000
http://localhost:3001
http://localhost:3002
http://localhost:3003
http://localhost:5173
https://pedro.netlify.app
https://repconnect.netlify.app
https://agent-command-center.netlify.app
https://gregpedromd.com
https://www.gregpedromd.com
https://repconnect.repspheres.com
https://www.repconnect.repspheres.com
https://agentbackend-2932.onrender.com
```

**Authorized redirect URIs** (add all):
```
https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://pedro.netlify.app/auth/callback
https://repconnect.netlify.app/auth/callback
https://agent-command-center.netlify.app/auth/callback
```

### 4. Get Your Credentials
After creating, you'll receive:
- **Client ID**: Something like `123456789012-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: A long string like `GOCSPX-1234567890abcdefghij`

### 5. Add to Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Enable**
4. Paste your Client ID and Client Secret
5. Save

### Common Mistakes to Avoid:
- ❌ Don't choose "Desktop app" - it won't work with web redirects
- ❌ Don't forget to add localhost URLs for development
- ❌ Don't share your Client Secret publicly
- ✅ Do add all your production URLs to authorized redirects

### Finding Your Supabase Project ID:
Your Supabase project URL looks like:
`https://YOUR-PROJECT-ID.supabase.co`

The `YOUR-PROJECT-ID` part is what you need to use in the Google Console.

### Test Your Setup:
Once configured, you can test by visiting:
`https://YOUR-PROJECT-ID.supabase.co/auth/v1/authorize?provider=google`

This should redirect you to Google's login page.