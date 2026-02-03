# Popdarts App - Mobile MVP

**A mobile-first Popdarts scoring and competitive platform**

Score. Play. Compete.

---

## 🎯 What Is This?

Popdarts App is a React Native mobile application that lets players:

- Score casual Popdarts matches
- Track match history and stats
- Eventually compete in tournaments and leagues
- Discover other players nearby
- Access Popdarts store integration

This is **Phase 1 MVP** - focused on core scoring functionality.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Supabase account ([supabase.com](https://supabase.com))

### Installation

1. **Clone and install dependencies:**

```bash
cd popdarts-app
npm install
```

2. **Set up Supabase:**

   - Follow instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
   - Create `.env` file with your Supabase credentials

3. **Run the app:**

```bash
npm start
```

4. **Open on your phone:**
   - Scan QR code with Expo Go app
   - App will load on your device

---

## 📱 Features (Phase 1 MVP)

### ✅ Implemented

- **Authentication**

  - Email/password signup and login
  - Guest mode (play without account)
  - Persistent sessions

- **Match Scoring**

  - Simple 1v1 score tracking
  - Increment/decrement controls
  - Save matches to cloud

- **Match History**

  - View past matches
  - Basic statistics (wins, losses, win rate)

- **User Profiles**
  - Display name
  - Customizable dart and jersey colors
  - Match record display

### 🚧 Coming Soon (Future Phases)

- **Rankings System**
  - Local rankings (players in your area)
  - Club rankings
  - State, regional, and conference rankings
  - National and global leaderboards
  - Glicko-2 rating system
- **Practice Mode**

  - Dart placement heatmaps
  - Accuracy tracking over time
  - Throwing pattern analysis
  - Personal practice goals
  - Practice vs match performance comparison

- **Competitive Features**
  - **Official Tournaments**
    - Tournament discovery and registration
    - Live match viewing (spectate others' matches)
    - Match scoring (when it's your turn)
    - APL membership verification required
    - Full tournament options (seeding, formats, schedules)
    - Single/double elimination, round robin, swiss systems
    - Rankings affected by results
    - Prize distribution tracking
  - League management
  - Location-based discovery
- **Social & Commerce**
  - Rewards and incentives
  - Popdarts store integration
  - Player profiles with trophy rooms

See [`MVP_PLAN.md`](../MVP_PLAN.md) for complete roadmap.

---

## 🏗️ Tech Stack

- **Frontend**: React Native (Expo)
- **UI Components**: React Native Paper
- **Navigation**: React Navigation
- **Backend**: Supabase
  - Postgres database
  - Authentication
  - Real-time subscriptions
  - Row-level security
- **State Management**: React Context API

---

## 📁 Project Structure

```
popdarts-app/
├── src/
│   ├── contexts/
│   │   └── AuthContext.js       # Authentication state management
│   ├── lib/
│   │   └── supabase.js          # Supabase client configuration
│   ├── screens/
│   │   ├── AuthScreen.js        # Sign in/up and guest mode
│   │   ├── HomeScreen.js        # Dashboard with stats
│   │   ├── MatchesScreen.js     # Match history list
│   │   ├── NewMatchScreen.js    # Score tracking UI
│   │   └── ProfileScreen.js     # User profile and settings
├── App.js                       # Root component with navigation
├── supabase-schema.sql          # Database schema
├── SUPABASE_SETUP.md            # Supabase configuration guide
└── package.json
```

---

## 🗄️ Database Schema

### Tables

**users**

- `id` (UUID, primary key, references auth.users)
- `email` (text, unique)
- `display_name` (text)
- `dart_color` (text, default: '#FF6B35')
- `jersey_color` (text, default: '#004E89')
- `created_at`, `updated_at` (timestamps)

**matches**

- `id` (UUID, primary key)
- `player1_id`, `player2_id` (UUID, nullable for guest players)
- `player1_name`, `player2_name` (text, denormalized)
- `player1_score`, `player2_score` (integer)
- `winner_id` (UUID, auto-calculated)
- `duration_seconds` (integer, optional)
- `played_at`, `created_at` (timestamps)

### Views

**user_stats** (computed)

- Total matches, wins, losses, win rate per user

---

## 🔒 Privacy & Security

- **Row-Level Security (RLS)** enabled on all tables
- Users can only update their own profiles
- Match history is public (for transparency)
- Guest mode keeps data local until account created
- No personally identifiable information exposed in public views

---

## 🎨 Branding

**Colors:**

- Primary: `#FF6B35` (Popdarts Orange)
- Secondary: `#004E89` (Popdarts Blue)

**Identity:**

- This is a **Popdarts-first** app, not a Scoreholio clone
- All terminology, visuals, and UX reflect Popdarts brand
- Focus on casual → competitive pipeline

---

## 🧪 Testing

### Manual Testing Checklist

**Auth Flow:**

- [ ] Sign up with email/password
- [ ] Sign in with existing account
- [ ] Guest mode (no account)
- [ ] Sign out
- [ ] Convert guest to account

**Match Scoring:**

- [ ] Start new match
- [ ] Increment/decrement scores
- [ ] Reset scores
- [ ] Save match
- [ ] View in match history

**Profile:**

- [ ] View stats
- [ ] Change dart color (coming soon)
- [ ] Change jersey color (coming soon)

---

## 📊 Success Metrics (Phase 1)

**Launch Criteria:**

- 50 matches scored
- 10 active users (1+ match per week)
- Zero critical bugs
- 90%+ successful match saves

**Validation Questions:**

- Do people use it for casual games?
- Do they create accounts after guest mode?
- What features do they request first?
- Is the UX intuitive without instructions?

---

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (requires macOS)
npm run ios

# Run on web
npm run web

# Clear cache and restart
npm start --clear
```

---

## 🐛 Troubleshooting

### App won't connect to Supabase

- Check `.env` file exists and has correct credentials
- Restart Expo: `npm start --clear`
- Verify Supabase project is running (check dashboard)

### "Network request failed"

- Ensure your phone and computer are on same WiFi
- Check firewall isn't blocking Expo Dev Tools
- Try opening in web browser: `npm run web`

### Authentication not working

- Verify SQL schema ran successfully in Supabase
- Check "Table Editor" in Supabase dashboard - `users` table should exist
- Ensure RLS policies are enabled

### Match not saving

- Check Supabase logs in dashboard
- Verify user is authenticated (not guest trying to save to cloud)
- Check `matches` table exists with correct columns

---

## 📝 Contributing

This is currently a solo-dev project. Future phases may include:

- Open source contribution guidelines
- Testing framework
- CI/CD pipeline
- Code style guide

---

## 📄 License

Proprietary - All rights reserved.

This app is intended to become the official Popdarts platform.

---

## 📞 Contact

For questions, suggestions, or bug reports, contact the developer.

---

## 🗺️ Roadmap

See [`MVP_PLAN.md`](../MVP_PLAN.md) for detailed feature roadmap.

**Phase 1 (Current)**: Core scoring MVP  
**Phase 2**: Competitive infrastructure (ratings, tournaments)  
**Phase 3**: Location-based discovery  
**Phase 4**: Spectator features  
**Phase 5**: Commerce integration

---

**Built with ❤️ for the Popdarts community**
