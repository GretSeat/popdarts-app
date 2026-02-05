# Quick Setup Guide - Local Clubs Feature

Follow these steps to enable the new Local Clubs feature in your Popdarts app.

## 1. Install Dependencies

Run this command in your project directory:

```bash
npm install @react-navigation/stack
```

## 2. Set Up Database

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Click **New query**
4. Copy and paste the entire contents of `supabase-clubs-schema.sql`
5. Click **Run** (⚡ icon)
6. You should see a success message

**Verify Tables Created:**

1. Go to **Table Editor** in Supabase
2. You should now see these new tables:
   - `clubs`
   - `club_members`
   - `club_events`
   - `club_event_participants`

## 3. Test the Feature

1. Start your Expo dev server:

```bash
npx expo start -c
```

2. Open the app on your device/emulator

3. Tap the **Local** tab (map marker icon at the bottom)

4. You should see:
   - "Local Clubs" header
   - "Create Club Page" card
   - Search bar
   - Filter chips (All Clubs, Favorites, My Clubs)
   - Empty state message (no clubs yet)

## 4. Create Your First Club

1. On the Local screen, tap **"Create Club Page"** button
2. If you're a guest, you'll be prompted to sign in (create an account first)
3. Fill out the form:
   - **Club Name** (required): e.g., "Downtown Darts Club"
   - **City** (required): e.g., "Los Angeles"
   - **State** (required): e.g., "CA"
   - **Description** (optional): Tell players about your club
   - **Contact Info** (optional): Email, phone, website, social media
4. Tap **"Create Club"**
5. You should see a success message
6. You'll be returned to the Local screen
7. Your new club should appear in the list

## 5. Test Features

### Search

- Type in the search bar to filter clubs by name, city, or state

### Filters

- Tap **"All Clubs"** to see all clubs
- Tap **"Favorites"** to see only clubs you've favorited (requires account)
- Tap **"My Clubs"** to see clubs you own (requires account)

### Favorites

- Tap the **star icon** on any club card
- If signed in: club will be added/removed from favorites
- If guest: you'll be prompted to sign in

## Troubleshooting

### "Failed to load clubs" error

- Make sure you ran the `supabase-clubs-schema.sql` script
- Check that RLS policies are enabled in Supabase
- Verify your Supabase connection in `.env` file

### Navigation not working

- Make sure `@react-navigation/stack` is installed
- Clear Metro bundler cache: `npx expo start -c`
- Restart your app

### Create club button does nothing

- Check browser/Metro console for errors
- Verify you're signed in (not a guest)
- Check Supabase permissions in the dashboard

### Tables not appearing in Supabase

- Re-run the SQL script
- Check for errors in the SQL editor
- Ensure the main schema (`supabase-schema.sql`) was run first

## Next Steps

Explore the full documentation in `LOCAL_CLUBS_FEATURE.md` to learn about:

- Database schema details
- RLS policies
- API reference
- Future enhancements
- Testing checklist

## Need Help?

If you encounter issues:

1. Check the browser/Metro console for error messages
2. Review `LOCAL_CLUBS_FEATURE.md` for detailed documentation
3. Verify database tables exist in Supabase Table Editor
4. Check that RLS policies are enabled

Happy club building! 🎯
