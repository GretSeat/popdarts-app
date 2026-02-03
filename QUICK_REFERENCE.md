# Popdarts App - Quick Reference

## 🚀 Essential Commands

### Start Development

```bash
cd popdarts-app
npm start
```

Opens Expo DevTools. Scan QR code with Expo Go app.

### Clear Cache & Restart

```bash
npm start --clear
```

Use when you see weird errors or changes not applying.

### Run on Specific Platform

```bash
npm run android  # Android emulator/device
npm run ios      # iOS simulator (macOS only)
npm run web      # Browser (for quick testing)
```

---

## 📝 File Locations

| Need to...             | Edit this file...                                 |
| ---------------------- | ------------------------------------------------- |
| Add new screen         | `src/screens/NewScreen.js`                        |
| Modify navigation      | `App.js`                                          |
| Change auth logic      | `src/contexts/AuthContext.js`                     |
| Update database schema | `supabase-schema.sql` (run in Supabase dashboard) |
| Configure Supabase     | `.env` (create from `.env.example`)               |
| Add UI component       | Use React Native Paper components                 |

---

## 🗄️ Supabase Quick Actions

### View Database

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "Table Editor"
3. Select table: `users` or `matches`

### Run SQL Query

1. Click "SQL Editor"
2. Paste query
3. Click "Run" (⚡)

### Check Auth Users

1. Click "Authentication"
2. See all signed-up users
3. Can manually delete test accounts

### View Logs

1. Click "Logs" in sidebar
2. Filter by "Database" or "Auth"
3. Debug errors here

---

## 🐛 Common Issues & Fixes

### "Failed to fetch" Error

```bash
# 1. Check .env file exists
cat .env

# 2. Restart with cache clear
npm start --clear

# 3. Verify Supabase credentials
# Go to Supabase → Settings → API
```

### Auth Not Working

```sql
-- Run in Supabase SQL Editor to check schema
SELECT * FROM users LIMIT 5;

-- If empty or error, re-run schema:
-- Copy/paste from supabase-schema.sql
```

### App Won't Load

```bash
# 1. Check for Node.js errors in terminal
# 2. Clear Expo cache
expo start --clear

# 3. Update dependencies
npm install

# 4. Restart Metro bundler
# Press 'r' in Expo terminal
```

### Match Not Saving

1. Check user is authenticated (not guest)
2. Verify Supabase RLS policies enabled
3. Check Supabase logs for errors
4. Ensure `matches` table exists

---

## 📦 Package Management

### Install New Package

```bash
# Regular npm package
npm install package-name

# Expo-managed package (preferred for native modules)
npx expo install package-name
```

### Update Dependencies

```bash
# Update all packages
npm update

# Update Expo SDK
npx expo upgrade
```

---

## 🎨 Customization Quick Edits

### Change App Colors

Edit `App.js`:

```javascript
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#YOUR_COLOR", // Main brand color
    secondary: "#YOUR_COLOR", // Accent color
  },
};
```

### Change App Name

Edit `app.json`:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Update Default User Colors

Edit `supabase-schema.sql`:

```sql
dart_color TEXT DEFAULT '#YOUR_COLOR',
jersey_color TEXT DEFAULT '#YOUR_COLOR',
```

---

## 🧪 Testing Checklist

### Before Each Beta Release

- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test guest mode
- [ ] Score a match
- [ ] View match history
- [ ] Check profile displays correctly
- [ ] Test logout
- [ ] Check Supabase data saved correctly

### Quick Test Script

```bash
# 1. Start app
npm start

# 2. On phone:
# - Sign up new account
# - Score a test match
# - View in match history
# - Check Supabase dashboard for data

# 3. Sign out and test guest mode:
# - Continue as guest
# - Score a match
# - Should prompt to create account
```

---

## 📱 Building for Production

### iOS (TestFlight)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

### Android (Internal Testing)

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build for Google Play
eas build --platform android

# Submit to Play Console
eas submit --platform android
```

---

## 🔧 Environment Variables

### Required Variables

```bash
# .env file
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get These Values

1. Supabase Dashboard
2. Settings → API
3. Copy "Project URL" and "anon public" key

---

## 📊 Monitoring & Analytics (Future)

### Supabase Stats

- Dashboard → Project → Stats
- View API requests, DB size, active users

### Expo Analytics (Coming Soon)

```bash
# Install Expo Analytics
npx expo install expo-analytics

# Track events in code
Analytics.logEvent('match_scored', {
  player_count: 2,
  score_total: player1Score + player2Score,
});
```

---

## 🚢 Ship Checklist

### Before Launch

- [ ] `.env` variables set correctly
- [ ] Supabase schema deployed
- [ ] RLS policies enabled
- [ ] Test all user flows
- [ ] Icon and splash screen updated
- [ ] App name configured
- [ ] Bundle identifier set
- [ ] Privacy policy URL added (if collecting emails)

### After Launch

- [ ] Monitor Supabase logs
- [ ] Check for crash reports
- [ ] Respond to user feedback
- [ ] Track key metrics (signups, matches, retention)

---

## 📞 Resources

| Resource           | Link                                            |
| ------------------ | ----------------------------------------------- |
| Expo Docs          | https://docs.expo.dev                           |
| Supabase Docs      | https://supabase.com/docs                       |
| React Native Paper | https://callstack.github.io/react-native-paper/ |
| React Navigation   | https://reactnavigation.org                     |
| Expo Community     | https://forums.expo.dev                         |

---

## 💬 Getting Help

1. **Check documentation**: `README.md`, `MVP_PLAN.md`, `SUPABASE_SETUP.md`
2. **Search issues**: Google your error message + "Expo" or "Supabase"
3. **Ask community**: Expo Discord, Supabase Discord
4. **Read logs**: Terminal output, Supabase logs, browser console

---

**Most common command you'll use:**

```bash
npm start --clear
```

**Most common fix:**

> "Did you try clearing the cache?" 😄
