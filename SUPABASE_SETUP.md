# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name**: popdarts-app
   - **Database Password**: (generate strong password and save it)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier (500MB DB, 2GB bandwidth, 50k MAU)
6. Click "Create new project" (takes ~2 minutes)

## 2. Get API Credentials

1. In Supabase dashboard, click "Settings" (⚙️ icon) in sidebar
2. Click "API"
3. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Configure App Environment

1. Create `.env` file in project root:

```bash
cd popdarts-app
cp .env.example .env
```

2. Edit `.env` and paste your credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Run SQL Schema

1. In Supabase dashboard, click "SQL Editor" in sidebar
2. Click "New query"
3. Copy and paste the SQL from `supabase-schema.sql`
4. Click "Run" (⚡ icon)
5. Verify tables created:
   - Click "Table Editor"
   - You should see: `users`, `matches`
6. **Optional - Clubs Feature**: To enable the Local Clubs feature:
   - Create a new query
   - Copy and paste SQL from `supabase-clubs-schema.sql`
   - Click "Run" (⚡ icon)
   - Verify new tables: `clubs`, `club_members`, `club_events`, `club_event_participants`

## 5. Configure Authentication

1. Click "Authentication" in sidebar
2. Click "Settings" tab
3. Configure Email Auth:
   - **Email Auth**: Enabled ✓
   - **Confirm email**: Disabled (for MVP - enable in production)
   - **Secure email change**: Enabled ✓
4. Click "Save"

## 6. Configure Google OAuth (Optional - for Google Sign In)

To enable "Sign In with Google" button in the app:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing (name: "Popdarts")
3. Enable Google+ API:
   - Click "Select a project"
   - Click "NEW PROJECT"
   - Name it "Popdarts"
   - Create the project
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
     http://localhost:3000
     http://localhost:19006
     http://localhost:8081
     ```
   - Copy the "Client ID" and "Client Secret"
5. In Supabase:
   - Go to "Authentication" → "Providers"
   - Click "Google" to enable it
   - Paste your Google OAuth **Client ID** and **Client Secret**
   - Click "Save"

**Note:** Google Sign In button will now appear on Sign In and Sign Up screens.

## 7. Test Connection

1. Run the app:

```bash
cd popdarts-app
npm start
```

2. Open Expo Go on your phone and scan QR code
3. Try creating an account
4. Check Supabase dashboard → "Table Editor" → "users" table
5. You should see your new user row

## Troubleshooting

### "Failed to fetch" error

- Check your `.env` file has correct URL and anon key
- Restart Expo dev server: `npm start --clear`

### "User not found" after signup

- Check SQL schema ran successfully
- Verify RLS policies are enabled
- Check "Table Editor" → "users" table exists
- **If you see RLS policy error**: Run `complete-signup-fix.sql` to fix user creation trigger

### Push notifications on Web

- Push notifications require `notification.vapidPublicKey` in `app.json`
- This is optional for the MVP - push notifications gracefully fail on web
- App will work fine without them

### Auth not persisting

- Make sure `@react-native-async-storage/async-storage` is installed
- Clear app data and try again

## Next Steps

- ✅ Google OAuth configured
- Enable email confirmation (production)
- Configure custom email templates
- Add more OAuth providers (Apple, GitHub, etc.)
