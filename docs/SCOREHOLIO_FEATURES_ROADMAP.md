# Scoreholio Features - Popdarts App Implementation Roadmap

**Date Created**: February 3, 2026  
**Purpose**: Track features from Scoreholio that should be added to Popdarts App

This document lists features available in Scoreholio that we should consider implementing in the Popdarts App. Features are organized by category and marked with implementation status.

---

## Legend

- ✅ **Implemented** - Feature is complete in Popdarts App
- 🚧 **In Progress** - Currently being developed
- 📋 **Planned** - On the roadmap
- 💡 **Future** - Nice to have, not yet prioritized

---

## 1. Tournament Formats

### Basic Formats

- 📋 **Round Robin** - Every player/team plays every other player/team
- 📋 **Single Elimination** - Lose once, you're out (bracket-style)
- 📋 **Double Elimination** - Lose twice, you're out (winners + losers bracket)
- 📋 **Pool Play** - Groups compete, then top performers advance
- 📋 **Set Schedule** - Pre-determined schedule (ideal for leagues)
- 💡 **Swissholio** - Swiss-system tournament (pairs based on similar records)
- 💡 **Ladder** - Continuous ranking system with challenges
- 💡 **Knockout** - Quick elimination format

### Notes

- Scoreholio supports 6+ tournament formats with automatic bracket generation
- Our app currently only supports simple 1v1 casual matches (no tournament structure)

---

## 2. Team Generation & Player Management

### Team Creation Systems

- 📋 **Singles** - 1v1 individual matches
- 📋 **Set Teams** - Pre-defined doubles/triples/quads
- 💡 **Blind Draw** - Randomized partner selection
  - 💡 No-Crybaby Blind Draw (balanced skill distribution)
- 💡 **Switcholio** - Partners rotate throughout tournament (most popular)
- 💡 **Split Switch** - Variation of Switcholio
- 💡 **Squadholio** - Team-based tournament system
- 💡 **MLP (Multi-Level Play)** - Mixed skill level team format

### Current Status

- ✅ **1v1 scoring** is implemented
- Team/doubles formats not yet supported

---

## 3. Player Registration & Check-In

### Pre-Registration

- 📋 **Online Pre-Registration** - Players sign up before tournament
- 📋 **Tournament Discovery** - "Find a Tournament" feature
- 📋 **Pre-Payment Integration**
  - PayPal Business integration
  - Stripe integration
  - Automatic payment collection
  - Fee customization (player pays vs organizer pays)
  - Transaction tracking
- 📋 **Waitlist Management** (Pro feature)
- 📋 **Registration Restrictions** - By skill level, membership, etc.
- 📋 **Tournament Sharing** - Share tournament links/promotional alerts

### Check-In Methods

- 💡 **QR Code Scanning** - Scan player QR codes for quick check-in
- 💡 **Mass Import** - Upload spreadsheet of players
- 💡 **Manual Entry** - Add players on-site
- 💡 **Player QR Profiles** - Each player has unique QR code

### Refunds

- 📋 **Refund Management** - Issue refunds through payment processor

### Current Status

- ✅ Basic user authentication exists
- No tournament registration or payment system implemented

---

## 4. Live Scoreboards & Display

### Scoreboard Features

- 📋 **Real-Time TV Scoreboards** - Display on laptops, tablets, TVs
- 📋 **Interactive Tablet Scoreboards** - Players score on tablets
- 📋 **Amazon FireStick Support** - Use FireStick for TV display
- 📋 **Player Scoring** - Players use own devices to enter scores
- 📋 **Remote Control Mode** (Advanced subscription)
- 📋 **Kiosk Mode** - Lock device to scoreboard view
- 📋 **Multi-Device Sync** - All scoreboards update in real-time
- 📋 **Free Play Mode** - Quick scoreboard access without tournament

### Dashboard Features

- 📋 **Live Tournament Dashboard** - Overview of all matches
- 📋 **Court Assignment Display** - Show which players play where
- 📋 **Push Notifications** - Alert players of assignments/results
- 📋 **Brackets Display** - Visual bracket progression

### Current Status

- ✅ Basic match scoring interface exists
- No live scoreboard or multi-device display features

---

## 5. Tournament Management & Automation

### Tournament Setup

- 📋 **Tournament Calculator** - Estimate tournament duration
- 📋 **Payout Calculator** - Calculate prize distribution
- 📋 **Average Game Time** - Sport-specific time estimates
- 📋 **Custom Tournament Settings** - Extensive configuration options
- 📋 **Game Timers** - Set time limits for matches
- 📋 **Info Buttons** - In-app help and tutorials

### Tournament Execution

- 📋 **Automated Bracket Generation** - Auto-create brackets
- 📋 **Automatic Match Scheduling** - Generate match order
- 📋 **Court/Board Management** - Assign matches to locations
- 📋 **Score Editing** - Fix errors in brackets, round robins
- 📋 **Tournament Cloning** - Duplicate tournament settings

### Tournament Administration

- 📋 **Multiple Admins** - Share organizer account
- 📋 **Organizer Assist** - Help tools for TDs
- 📋 **Device Compatibility Tools** - Troubleshooting support
- 📋 **Wi-Fi Guidance** - Network setup help

### Current Status

- ✅ Basic match saving to database
- No tournament creation or management tools

---

## 6. League & Season Management

### League Features

- 📋 **Set Schedule Leagues** - Regular season schedules
- 📋 **Switcholio/Blind Draw Leagues** - Rotating partner leagues
- 📋 **Multi-Week Play** - Season tracking
- 📋 **League Standings** - Cumulative rankings
- 💡 **Season Statistics** - Track performance over time

### Current Status

- No league functionality implemented

---

## 7. Player Features

### Player Profiles

- ✅ **Display Name** - User identification
- ✅ **Customizable Colors** - Dart/jersey colors (UI ready)
- 📋 **Player QR Code** - Unique identifier for check-in
- 📋 **Player Statistics** - Detailed performance tracking
- 📋 **Match History** - Past games record
- 📋 **Ratings/Rankings** - Skill level tracking
- 💡 **Player Bio** - Profile description
- 💡 **Location** - Geographic data for local rankings

### Account Management

- ✅ **Email/Password Auth** - Secure login
- ✅ **Guest Mode** - Play without account
- 📋 **Account Settings** - Profile customization
- 📋 **Payment Account Linking** - Connect PayPal/Stripe
- 📋 **Notification Preferences** - Control alerts

### Current Status

- ✅ Basic profiles with name and colors
- ✅ Auth system functional
- Limited stat tracking (wins/losses only)

---

## 8. Reporting & Analytics

### Tournament Reports

- 📋 **Final Results Report** - Tournament outcome summary
- 📋 **Player Performance Reports** - Individual statistics
- 📋 **Payout Reports** - Prize money breakdown
- 📋 **Attendance Tracking** - Player participation data
- 📋 **Transaction Reports** - Payment records

### Performance Analytics

- 📋 **Win/Loss Records** - Basic statistics
- 📋 **Head-to-Head Records** - Player matchup history
- 📋 **Trend Analysis** - Performance over time
- 💡 **Heatmaps** - Dart placement visualization
- 💡 **Accuracy Tracking** - Precision metrics

### Current Status

- ✅ Basic win/loss tracking
- ✅ Match history view
- No advanced analytics or reporting

---

## 9. Social & Discovery Features

### Tournament Discovery

- 📋 **Find a Tournament** - Browse available events
- 📋 **Tournament Search** - Filter by location, date, type
- 📋 **Tournament Calendar** - View schedule
- 📋 **Club Pages** - Venue profiles with events

### Social Features

- 💡 **Follow Players** - Track other players
- 💡 **Friend Lists** - Connect with players
- 💡 **Player Messaging** - Direct communication
- 💡 **Share Results** - Post to social media

### Current Status

- No social or discovery features implemented

---

## 10. Payment & E-Commerce

### Payment Processing

- 📋 **PayPal Business Integration** - Collect tournament fees
- 📋 **Stripe Integration** - Alternative payment processor
- 📋 **Pre-Payment Collection** - Pay before tournament
- 📋 **Fee Structure Management** - Customize who pays fees
- 📋 **Multiple Currency Support** - International payments
- 📋 **Transaction Tracking** - View all payments
- 📋 **Refund Processing** - Issue refunds

### Revenue Management

- 📋 **Payout Calculator** - Prize distribution tool
- 📋 **Fee Transparency** - Show processing costs
- 📋 **Direct Payment Flow** - Money goes to organizer account

### Store Integration

- 💡 **Popdarts Store Link** - Equipment sales
- 💡 **In-App Purchases** - Digital items/features
- 💡 **Sponsor Integration** - Branded content

### Current Status

- No payment processing implemented
- No e-commerce features

---

## 11. Communication & Notifications

### Push Notifications

- 📋 **Match Assignment Alerts** - Notify players of games
- 📋 **Result Updates** - Score notifications
- 📋 **Schedule Changes** - Tournament updates
- 📋 **Registration Confirmations** - Sign-up receipts
- 📋 **Payment Confirmations** - Transaction notices

### Promotional Tools

- 📋 **Promotional Alerts** - Announce tournaments
- 📋 **Email Notifications** - Tournament reminders
- 📋 **Tournament Flyers** - Downloadable graphics
- 📋 **Share Links** - Distribute tournament info

### In-App Communication

- 💡 **Live Chat** - Support messaging
- 💡 **Tournament Chat** - Player communication
- 💡 **Organizer Announcements** - Broadcast messages

### Current Status

- No notification system implemented

---

## 12. Support & Help Features

### User Support

- 📋 **Live Chat Support** - Real-time help
- 📋 **Zoom Tutorials** - Scheduled training sessions
- 📋 **Video Tutorials** - Embedded help videos
- 📋 **Documentation** - Comprehensive guides
- 📋 **FAQs** - Common questions answered
- 📋 **Info Buttons** - Contextual help throughout app

### Troubleshooting

- 📋 **Score Edit Tools** - Fix mistakes
- 📋 **Device Compatibility Checker** - Ensure device works
- 📋 **Wi-Fi Setup Guide** - Network troubleshooting
- 📋 **Supported Devices List** - Compatible hardware

### Current Status

- No in-app support or help system

---

## 13. Subscription & Monetization

### Subscription Tiers

Scoreholio offers multiple subscription levels:

- **Free** - Basic tournament features
- **Pro** - Advanced features (waitlists, restrictions)
- **Advanced** - Remote control, premium features
- **Premium** - Full feature access

### Features to Consider

- 📋 **Subscription System** - Tiered access
- 📋 **Free Tier** - Basic functionality for all
- 📋 **Premium Features** - Advanced tools for paying users
- 📋 **Trial Periods** - Test premium features

### Current Status

- App is completely free (no monetization)

---

## 14. Technical Features

### Device Support

- 📋 **Cross-Platform** - iOS, Android, Web
- 📋 **Tablet Optimization** - Larger screen support
- 📋 **TV Display Support** - FireStick, Smart TVs
- 📋 **Offline Mode** - Function without internet
- 📋 **Data Sync** - Cloud backup and sync

### Performance

- 📋 **Real-Time Updates** - Instant score propagation
- 📋 **Multi-Device Sync** - Same tournament, multiple devices
- 📋 **Low Bandwidth Mode** - Works on slow connections

### Security

- ✅ **Secure Authentication** - Protected login
- 📋 **Data Privacy** - User data protection
- 📋 **Payment Security** - PCI compliance

### Current Status

- ✅ Mobile app (iOS/Android via Expo)
- ✅ Cloud sync with Supabase
- No offline mode or TV support

---

## 15. Unique Scoreholio Features

These are Scoreholio's standout features that differentiate them:

### Innovation

- 💡 **No-Crybaby Blind Draw** - Skill-balanced random teams
- 💡 **Switcholio** - Popular rotating partner format
- 💡 **Squadholio** - Unique team tournament system
- 💡 **Free Play Mode** - Quick scoring without tournament setup
- 💡 **Remote Control Tablets** - Centrally manage multiple scoreboards

### Automation

- 📋 **Automatic Winner Calculation** - No manual bracket updates
- 📋 **Auto-Generate Teams** - Intelligent team creation
- 📋 **Time Estimation** - Predict tournament duration
- 📋 **Seamless Tournament Flow** - Minimal organizer intervention

### Current Status

- These are advanced features requiring significant development

---

## 16. Tournament Bracket UI & Visualization

### Bracket Navigation & Display

- 📋 **Bracket Round Navigation** - Scrollable/button-based round selection
  - 8th Finals, Quarterfinals, Semifinals, Finals buttons
  - Animated snap-to behavior when selecting rounds
  - Smooth transitions between round views
- 📋 **Interactive Bracket Display** - Visual tournament progression
  - Real-time bracket updates
  - Click-to-view match details
  - Winner path highlighting
- 📋 **Losers Bracket Display** - Optional double elimination visualization
- 📋 **Bracket Lock Visualization** - Show when tournament is locked
- 📋 **Match Status Indicators** - Pending, in-progress, completed states

### Current Status

- No bracket UI visualization implemented
- Currently only scoring interface exists

---

## 18. Casual Gameplay Features

### Quick Scoring UI Enhancements

- 📋 **Victory Reminder / Points to Win Indicator**
  - Show points remaining when player approaches victory
  - Toggleable in Casual Competitive Settings
  - Example: "If you score this, Player wins!" or "2 points for Player 1, Victory"
  - Triggers when player reaches threshold (e.g., 11 points in 501)
  - Shows only when scoring opportunity could result in win this turn
  - Help players understand match state at a glance
  - Useful for casual players learning the game

- 💡 **Quick Match Tips** - Context-aware tips during casual play
- 💡 **Score Prediction** - Estimate final score based on current pace
- 💡 **Match Metrics** - Display average points per turn, darts efficiency

### Current Status

- ✅ Victory Reminder feature - Setting added to Casual Competitive Settings (toggleable)
- Not yet implemented in scoring interface
- Basic casual scoring interface exists

---

## 17. Strategic Competitive Features: PopDarts Differentiation Model

This section reframes competitive features specifically around **PopDarts' 1v1 advantage** and what differentiates it from Scoreholio.

---

## 🥇 Tier 1 — High-Impact Differentiators (Scoreholio Does NOT Do Well or At All)

### Strategic Focus: True Skill Tracking

These are your **biggest strategic wins**. They position PopDarts as "The competitive 1v1 app built specifically for serious skill tracking."

#### True ELO Rating System (Sport-Agnostic)

- 📋 **Dynamic ELO Calculation**
  - Transparent rating change formula
  - Show +15 / -8 ELO per match
  - Difficulty-adjusted gains (beating higher-rated player = more points)
  - Visible rating gain/loss in match result screen
  - Match impact explanation ("You gained X because opponent was Y-rated")

- 📋 **Rating Tiers**
  - Bronze (0-1200), Silver (1200-1600), Gold (1600-1900), Platinum (1900+)
  - Visual tier badges on profile
  - Tier-specific leaderboards
  - Auto-promotion/relegation between tiers each season

- 📋 **Match Impact Weighting**
  - Recent matches weighted more heavily
  - Tournament wins worth more than casual wins
  - Head-to-head record affects rating calculation
  - Margin of victory factored in (dominant vs narrow wins)

**Why It Matters**: Scoreholio has SPR (Skill Performance Rating) but not a full transparent ELO model. PopDarts' true ELO is understandable and fair.

#### Head-to-Head Player Pages

- 📋 **Lifetime Rivalry Records**
  - Lifetime record vs specific opponent (8-2 vs Player X)
  - Win streaks in rivalry (Currently on 3-match streak vs Player Y)
  - Head-to-head ELO differential
  - Most recent H2H matches listed

- 📋 **Rivalry Statistics**
  - Average score vs that opponent
  - Biggest upset in rivalry (lower-rated player beat higher-rated)
  - Match locations/dates of last 10 H2H matches
  - Performance trends (improving or declining vs this opponent)

- 📋 **H2H Prediction**
  - Expected winner based on ELO
  - Upset probability calculation
  - Historical H2H trend graph

**Why It Matters**: This is core 1v1 functionality. Scoreholio doesn't have dedicated H2H pages. Players LOVE rivalry tracking.

#### Match Result Confirmation System

- 📋 **Dual-Player Confirmation**
  - Both players must confirm result for permanent record
  - Can optionally assign referee/admin to confirm instead
  - 24-hour confirmation window with reminders
  - Auto-confirm if both agree immediately

- 📋 **Dispute Flagging & Workflow**
  - "Dispute this result" button if players disagree
  - Dispute reason/notes required
  - Admin/referee review queue
  - Resolution options: Confirm, Overturn, or Replay

- 📋 **Official Result Badge**
  - "Confirmed by both players" badge on match result
  - Distinguishes official vs disputed results
  - Provides confidence in rating calculations

**Why It Matters**: Prevents cheating/manipulation. Creates trustworthy rating system.

#### Bracket Lock Mode

- 📋 **Hard Lock After Tournament Starts**
  - No reseeding mid-tournament
  - No silent bracket edits
  - Visible "Official Tournament" badge
  - Lock confirmation before tournament begins

- 📋 **Lock Status Indicator**
  - Show which tournaments are locked/locked
  - Display lock time for reference

**Why It Matters**: Makes competitive tournaments actually competitive. Trust in bracket integrity.

#### Unified Lifetime Player Profile

- 📋 **Career Dashboard**
  - All tournaments in one searchable place
  - Total championships won (5x champion)
  - Overall win % (72% across career)
  - Career stats dashboard (1,247 matches, 897 wins)
  - Current rating & tier
  - Rating history graph (show progression over time)

- 📋 **Tournament History Tab**
  - Filter by year, tournament type, location
  - Placement tracking (1st, 2nd, 3rd, etc.)
  - Sort by recent, best result, most competitive

- 📋 **Public Profile View**
  - Customizable privacy (public/private/partial)
  - Appears in global rankings if public
  - Shareable profile link

**Why It Matters**: Creates persistent player identity. Build reputation over time.

#### Strength of Schedule (SOS) Metric

- 📋 **SOS Calculation**
  - Calculate average ELO of opponents faced
  - Show as "SOS Score" alongside ELO
  - Identify hardest path to victory

- 📋 **Adjusted Rating Display**
  - Show both "Raw Rating" and "SOS-Adjusted Rating"
  - Adjusted rating accounts for difficulty of opponents
  - Explains why lower-rated player might have easier/harder path

- 📋 **Tournament SOS**
  - Show tournament difficulty score
  - Help players understand relative achievement

**Why It Matters**: Scoreholio doesn't do this well. Fair rating comparison across different tournament strengths.

#### Rating Decay for Inactivity

- 📋 **Implements "Don't Rank Camp"**
  - Rating decays if inactive >90 days
  - Gradual decay curve (0.5% per week after 90 days)
  - Reactivation bonus to rejoin scene
  - Minimum rating floor (can't go below Bronze threshold)
  - Pre-decay notification (warn before decay applied)

**Why It Matters**: Keeps leaderboard fresh. Prevents inactive players dominating rankings forever.

---

## 🥈 Tier 2 — Competitive Enhancers (Somewhat Covered by Scoreholio but You Can Improve)

### Strategic Focus: Advancement & Achievement

These are strong features that Scoreholio partially covers, but PopDarts can optimize for 1v1 play:

#### Season-Based Rankings With Clear Promotion / Relegation

- 📋 **Division System**
  - Bronze → Silver → Gold promotion path
  - Automatic movement based on season performance
  - Seasonal reset (start fresh each season)
  - Season duration configurable (3 months, 6 months, etc.)

- 📋 **Promotion/Relegation Mechanics**
  - Auto-promote if finish top 20% of division
  - Auto-relegate if finish bottom 20% of division
  - Grace period for borderline players

- 📋 **Seasonal Rewards**
  - Seasonal achievement badges
  - Historical seasonal records
  - Compare your season rankings year-over-year

#### Advanced Performance Metrics

- 📋 **Clutch Win %**
  - Win % in deciding games (Game 3, etc.)
  - Identify who performs under pressure
  - Highlighted on profile if high clutch %

- 📋 **Comeback Wins**
  - Track wins from losing positions
  - Avg comeback margin of victory
  - Comeback success rate %

- 📋 **Margin of Victory**
  - Avg MOV in wins vs losses
  - Show dominant vs nail-biters
  - Trend analysis (getting more dominant?)

#### Upset Detection System

- 📋 **Auto-Flag Major Rating Gaps**
  - When lower-seeded/lower-rated player wins = upset
  - Calculate upset probability (was it shocking?)
  - "Biggest upset of the tournament" stat

- 📋 **Giant Killer Tracking**
  - Count upsets per player
  - Giant killer achievement badge for multiple upsets
  - Upset frequency metric

#### Tournament Tier Weighting

- 📋 **Casual vs Major Classification**
  - Organizers tag tournaments as casual/major
  - Major tournaments worth 1.5x rating multiplier
  - Casual worth 1.0x
  - Rating multiplier visible in match result

- 📋 **Event Importance Factoring**
  - League play vs one-off tournaments
  - Annual championships worth highest multiplier
  - Friendly casual matches worth lower

#### Live Real-Time Sync (Optimized for Small 1v1 Events)

- 📋 **Fast Multi-Device Sync**
  - Faster than Scoreholio's generic large-scale system
  - Designed for 8–16 player events (common for darts)
  - Clean minimal UI focused on user viewing

- 📋 **Spectator Bracket View**
  - Second device (tablet/TV) shows live bracket
  - Auto-refreshes when results entered
  - Read-only spectator view

---

## 🥉 Tier 3 — Social + Competitive Hybrid (Scoreholio Lacks These)

### Strategic Focus: Community & Engagement

#### Rivalry Tracker

- 📋 **Auto-Detect Most Played Opponent**
  - System identifies your "rival" (most H2H matchups)
  - Show rivalry badge next to their name
  - "Your rival is online" notification

- 📋 **Rivalry Leaderboard**
  - Global "Most Intense Rivalries" leaderboard
  - Ranked by total H2H matchups + closeness of record

#### Achievements / Badges System

- 📋 **Competitive Milestones**
  - "5 Tournament Wins" badge
  - "10-Match Win Streak" badge
  - "Giant Killer" (3 upsets in a row) badge
  - "Perfect Season" (undefeated season) badge
  - "Championship" badge for tournament wins

- 📋 **Achievement Display**
  - Show on profile with unlock date
  - Share achievements on social media (optional)
  - Notification when unlocked

#### Player Following System

- 📋 **Follow Favorite Competitors**
  - Follow specific players
  - Get notified when they enter tournaments
  - See their match results in feed
  - Build personal "watch list"

- 📋 **Follower Count**
  - Display follower/following counts on profile
  - Top players by followers leaderboard

#### Public Player Rankings Page

- 📋 **Global Popdarts Leaderboard**
  - Worldwide rankings by current ELO
  - Searchable by name
  - Filter by region/country (if geotagged)
  - Filter by tier (Bronze, Silver, Gold, Platinum)
  - Minimum match requirement (50+ matches to qualify)

- 📋 **Leaderboard Transparency**
  - Show recent tournament results
  - Show who they play most
  - Show rating trend (↑ +120 this season)

---

## 🧩 Tier 4 — Niche But Cool (Polish & Personality)

### Strategic Focus: Refinement & User Delight

#### Match Duration Tracking

- 📋 **Record Actual Match Time**
  - Start/end timer per match
  - Average game duration metric
  - Pace of play trends (getting faster/slower)
  - Identify quick-finishers vs grinders

#### Shot Clock Support

- 📋 **Optional Timed Rounds**
  - Configurable time limit per match
  - Visual countdown timer display
  - Time warnings (final 30 sec, etc.)
  - Timeout tracking
  - Auto-win if opponent times out

#### Custom Bracket Themes

- 📋 **Visual Customization**
  - Different bracket themes (modern, retro, minimalist)
  - Color scheme customization per tournament
  - Branded tournament themes

#### Animated Bracket Progression

- 📋 **Polish & Delight**
  - Animated match elimination
  - Flowing advancement animations
  - Celebration animations for winners
  - Smooth round transitions

#### Highlight Tagging ("Clutch", "Blowout")

- 📋 **Match Tagging**
  - Players can tag their own matches: "Clutch", "Blowout", "Comeback"
  - Creates highlight reel automatically
  - Shareable highlight moments

#### Match Timeline Replay

- 📋 **Stats Replay**
  - Point-by-point statistics timeline
  - Game-by-game progression viewer
  - Interactive scrubbing through match
  - Export replay stats as image/GIF

#### Custom Tournament Branding

- 📋 **Organizer Customization**
  - Upload tournament logo
  - Custom tournament name/tagline
  - Branded bracket display
  - Shareable branded tournament link

---

## 🚀 Features Scoreholio Already Covers Well (Lower Priority)

**These are less urgent for differentiation** — but you still need them. Build them AFTER Tier 1-3:

- ✅ **Single Elimination** - Winning formula, don't reinvent
- ✅ **Double Elimination** - Standard bracket format
- ✅ **Manual Seeding** - Organizer assigns seeds
- ✅ **Round Robin** - Every player plays every other
- ✅ **Swiss System** - Pairs based on similar records
- ✅ **Best-of Formats** - Bo3, Bo5, etc.
- ✅ **Detailed Score Entry** - Player enters individual game scores
- ✅ **Admin Assist Tools** - Help organizers run tournaments
- ✅ **Live Dashboards** - Real-time tournament overview
- ✅ **Player Import** - Upload spreadsheet of entrants

**Build these after your differentiators are solid.** They're table-stakes, not table-winners.

---

## 🚀 Recommended Smart Build Order

**If you want to position your PopDarts app as: "The competitive 1v1 app built specifically for serious skill tracking."**

**Build in THIS order:**

### Phase 1: Foundation (Weeks 1-4)

1. ✅ Basic tournament bracketing (if not already done)
2. 📋 **True ELO System** — Tier 1 (foundational — everything builds on this)
3. 📋 Result confirmation system (anti-cheat foundation)

### Phase 2: Player Identity (Weeks 5-8)

4. 📋 Unified lifetime player profiles — Tier 1 (ASAP — players need identity)
5. 📋 Head-to-head player pages — Tier 1 (high engagement feature)
6. 📋 Strength of Schedule metric — Tier 1

### Phase 3: Competitive Integrity (Weeks 9-12)

7. 📋 Bracket lock mode — Tier 1 (legitimate tournaments require this)
8. 📋 Rating decay for inactivity — Tier 1 (keep leaderboard fresh)
9. 📋 Seasonal rankings with promotion/relegation — Tier 2

### Phase 4: Engagement & Polish (Weeks 13-16)

10. 📋 Achievements / badges system — Tier 3
11. 📋 Rivalry tracker — Tier 3
12. 📋 Player following system — Tier 3
13. 📋 Public leaderboard — Tier 3 (showcase your competitive ecosystem)

### Phase 5: Advanced Metrics (Weeks 17-20)

14. 📋 Clutch win % and advanced stats — Tier 2
15. 📋 Upset detection system — Tier 2
16. 📋 Tournament tier weighting — Tier 2

### Phase 6: Polish & Personality (Weeks 21+)

17. 💡 Animated bracket progression — Tier 4
18. 💡 Custom bracket themes — Tier 4
19. 💡 Highlight tagging — Tier 4
20. 💡 Match timeline replay — Tier 4

**After Phase 6:** Add Scoreholio features (double elimination, round robin, payment, etc.). By then you'll have built a **genuinely competitive platform** that Scoreholio lacks.

---

## Competitive Settings for Players (Profile Feature)

- 📋 **Competitive Settings Panel** (In Profile Settings → "Competitive Settings")
  - **ELO & Rating**:
    - Display public ELO rating (toggle on/off)
    - Rating decay preference (yes/no)
    - Career stats visibility (public/private)
  - **Tournament Preferences**:
    - Preferred match formats (Bo3/Bo5/etc.)
    - Tier preference (casual/serious)
    - Auto-accept tournament invites (yes/no)
  - **Notifications**:
    - Rival player notifications
    - Result confirmation reminders
    - Achievement unlock notifications
    - League/seasonal notifications
  - **Privacy Settings**:
    - Public vs private profile
    - Match history visibility
    - Head-to-head stats visibility
    - Follower access to stats

### Current Status

- No ELO system implemented
- No lifetime player profiles
- No H2H tracking pages
- No result confirmation workflow
- No rating decay
- Minimal competitive infrastructure

---

## Priority Implementation Order (Legacy - See "Recommended Smart Build Order" Instead)

Based on current Popdarts App status. **Note**: See the "Recommended Smart Build Order" section above for the optimal strategy to differentiate from Scoreholio.

### Phase 2 - Essential Foundations (Next)

1. ✅ **Tournament Brackets** - Single elimination basics
2. 📋 **Bracket UI & Visualization** - Round navigation with animated snapping
3. 📋 **Competitive Settings (Profile)** - Player preferences for tournament types
4. 📋 **Doubles Support** - 2v2 team matches
5. 📋 **Match History Improvements** - Better stat tracking
6. 📋 **Basic Leaderboards** - Win/loss rankings

### Phase 3 - Tournament Core + Tier 1 Competitive

7. 📋 **ELO Rating System** - Tier 1: Player Rating System (NEW)
8. 📋 **Round Robin Format** - Full round robin support
9. 📋 **Tournament Creation** - Setup tournaments from app
10. 📋 **Better Score Entry** - Tier 1: Detailed Score Entry (NEW)
11. 📋 **Player Registration** - Sign up for tournaments
12. 📋 **Live Scoreboard** - Real-time display on second device
13. 📋 **Best-of-X Formats** - Tier 1: Bo3, Bo5, Win-by-2 (NEW)
14. 📋 **Double Elimination** - Losers bracket + Tier 1: Third-place match (NEW)

### Phase 4 - Advanced Tournament + Tier 1-2 Competitive

15. 📋 **Seeding System** - Tier 1: Manual & auto-seeding (NEW)
16. 📋 **Match Confirmation** - Tier 1: Result confirmation by both players (NEW)
17. 📋 **Bracket Locking** - Tier 1: Bracket lock after start (NEW)
18. 📋 **Pool Play** - Group stages
19. 📋 **Upset Detection** - Tier 2: Identify upsets (NEW)
20. 📋 **Head-to-Head Tracking** - Tier 1: H2H records (NEW)
21. 📋 **Win Streak Tracking** - Tier 2: Streak counters (NEW)
22. 📋 **Dispute System** - Tier 2: Dispute submission (NEW)
23. 📋 **Tournament Archive** - Tier 2: Historical records (NEW)
24. 📋 **Push Notifications** - Match alerts

### Phase 5 - Tier 2-3 Competitive Features

25. 📋 **Official Tournament Mode** - Tier 2: Locked official tournaments (NEW)
26. 📋 **Admin/Referee Role** - Tier 2: Admin capabilities (NEW)
27. 📋 **Global Leaderboard** - Tier 2: Worldwide rankings (NEW)
28. 📋 **Seasonal Rankings** - Tier 2: Season-based tiers (NEW)
29. 📋 **Performance Stats** - Tier 2: Points/game metrics (NEW)
30. 📋 **Placement Tracking** - Tier 2: 1st/2nd/3rd counts (NEW)
31. 📋 **Real-Time Bracket Sync** - Tier 3: Multi-device sync (NEW)
32. 📋 **Tournament Discovery** - Find tournaments near you
33. 📋 **Player Verification** - Tier 3: Verification badge (NEW)

### Phase 6 - Payment & E-Commerce

34. 📋 **Pre-Registration** - Online sign-up system
35. 📋 **Payment Integration** - PayPal/Stripe
36. 📋 **Payout Calculator** - Prize distribution

### Phase 7 - Tier 3-4 Competitive + Social

37. 📋 **Match Duration Tracking** - Tier 3: Time metrics (NEW)
38. 📋 **Shot Clock** - Tier 3: Timed rounds (NEW)
39. 📋 **Tournament Tier Weighting** - Tier 3: Major vs casual weighting (NEW)
40. 📋 **Rating Decay** - Tier 3: Inactivity penalties (NEW)
41. 📋 **Private/Invite Tournaments** - Tier 3: Tournament privacy (NEW)
42. 📋 **Achievements/Badges** - Tier 4: Achievement system (NEW)
43. 📋 **Player Profiles Enhancement** - Stats, bio, ratings
44. 📋 **Bracket Export** - Tier 4: PDF/Image export (NEW)
45. 📋 **Shareable Brackets** - Tier 4: Share bracket links (NEW)
46. 📋 **Following Players** - Tier 4: Player following (NEW)
47. 📋 **Rivalry Tracking** - Tier 4: H2H rivals (NEW)

### Phase 8 - Tier 4-5 Enhanced Social + Polish

48. 💡 **Tournament MVP Voting** - Tier 4: Community voting (NEW)
49. 💡 **Match Comments** - Tier 4: Discussion threads (NEW)
50. 💡 **Notifications** - Tier 4: Result alerts (NEW)
51. 💡 **Custom Bracket Themes** - Tier 5: Visual customization (NEW)
52. 💡 **Animated Bracket** - Tier 5: Bracket animations (NEW)
53. 💡 **Upset Alerts** - Tier 5: Highlight surprises (NEW)
54. 💡 **Highlight Tagging** - Tier 5: Memorable moments (NEW)
55. 💡 **Custom Rule Presets** - Tier 5: Template rules (NEW)
56. 💡 **Player Tiers** - Tier 5: Tier badging (NEW)
57. 💡 **Chat/Messaging** - Player communication
58. 💡 **Strength of Schedule** - Tier 3: SOS metrics (NEW)

### Phase 9 - League & TV Display

59. 📋 **League Management** - Season tracking
60. 💡 **Advanced Team Formats** - Switcholio, MLP, etc.
61. 💡 **TV Display Mode** - Cast to external displays
62. 💡 **Offline Mode** - Function without internet

---

## Strategic Notes

### PopDarts' Competitive Advantage vs Scoreholio

PopDarts can dominate the **competitive 1v1 niche** that Scoreholio doesn't fully serve:

| Feature                    | Scoreholio                | PopDarts (Proposed)                              |
| -------------------------- | ------------------------- | ------------------------------------------------ |
| **ELO System**             | SPR-based (opaque)        | True transparent ELO with visible gains/losses   |
| **H2H Pages**              | Minimal                   | Dedicated lifetime rivalry pages                 |
| **Result Confirmation**    | Limited                   | Dual-player approval + dispute system            |
| **1v1 Focus**              | Multi-sport, multi-format | Optimized specifically for 1v1 darts             |
| **Skill Tracking**         | Basic                     | Advanced metrics (clutch %, SOS, tier weighting) |
| **Lifetime Value**         | Per-tournament view       | Unified career dashboard                         |
| **Anti-Cheat**             | Loose                     | Result confirmation + official tournament mode   |
| **Rating Decay**           | Not standard              | Inactivity prevention built-in                   |
| **Community Leaderboards** | Global but generic        | Tiered, searchable, transparent                  |

### Why This Build Order Works

1. **ELO First** — Everything competitive flows from rating. Players need to see their rating clearly.
2. **Player Profiles** — Players need persistent identity. Build out career records immediately.
3. **H2H Pages** — High engagement feature. Players LOVE rivalry tracking and personal records.
4. **Integrity Features** — Result confirmation + bracket locking make tournaments legitimate.
5. **Leaderboards** — Showcase your ecosystem. Make players feel like they're part of a competitive community.
6. **Polish Last** — Animations and themes only matter once you have solid competitive mechanics.

### Scoreholio Features We Can Deprioritize (Build Later)

These are table-stakes but not table-winners:

- Single/double elimination (standard brackets)
- Round robin (common format)
- Manual/auto seeding (basic)
- Best-of formats (expected)
- Admin assist tools (necessary but not differentiating)
- Live dashboards (nice but not unique)
- Player import (utility, not engagement)

**Build these AFTER Tier 1-3**, when you've locked in your competitive differentiation.

---

## Summary Statistics (Updated for Strategic Refocus)

**Total Identified Competitive Features**: ~80+  
**Strategic High-Impact Features (Tier 1-4)**: ~50  
**Deprioritized "Table-Stakes" Features**: ~30+

### By Tier

- **Tier 1 (High-Impact Differentiators)**: 6 core systems
- **Tier 2 (Competitive Enhancers)**: 6 advanced features
- **Tier 3 (Social + Hybrid)**: 4 engagement features
- **Tier 4 (Niche But Cool)**: 7 polish features

### Implementation Timeline

- **Phase 1 (Weeks 1-4)**: ELO + result confirmation = **Competitive foundation**
- **Phase 2 (Weeks 5-8)**: Player profiles + H2H = **Player identity**
- **Phase 3 (Weeks 9-12)**: Bracket lock + decay = **Competitive integrity**
- **Phase 4 (Weeks 13-16)**: Achievements + leaderboard = **Community showcase**
- **Phase 5 (Weeks 17-20)**: Advanced metrics = **Sophisticated analysis**
- **Phase 6 (Weeks 21+)**: Polish + animations = **User delight**

**Total Estimated Development**: 20-24 weeks for full Tier 1-4 suite (working in parallel where possible)

### Positioning Statement

**"PopDarts is the competitive 1v1 app built specifically for serious skill tracking."**

By building Tier 1-2 features first, you own a differentiated market position that Scoreholio doesn't serve well. Scoreholio is great for multi-format tournaments. PopDarts will be unbeatable for serious 1v1 competitive play.

---

**Last Updated**: February 18, 2026  
**Major Restructure**: Shifted focus from "all Scoreholio features" to "PopDarts differentiation model"  
**Strategic Direction**: Build for 1v1 skill tracking, not tournament management  
**Review Frequency**: Update after each major feature milestone
