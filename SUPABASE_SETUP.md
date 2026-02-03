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

## 5. Configure Authentication

1. Click "Authentication" in sidebar
2. Click "Settings" tab
3. Configure:
   - **Email Auth**: Enabled ✓
   - **Confirm email**: Disabled (for MVP - enable in production)
   - **Secure email change**: Enabled ✓
4. Click "Save"

## 6. Test Connection

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

### Auth not persisting

- Make sure `@react-native-async-storage/async-storage` is installed
- Clear app data and try again

## Next Steps

- Enable email confirmation (production)
- Set up row-level security policies
- Configure custom email templates
- Add OAuth providers (Google, Apple, etc.)
