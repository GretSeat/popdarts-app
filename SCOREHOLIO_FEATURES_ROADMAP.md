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

## Priority Implementation Order

Based on current Popdarts App status, recommended implementation order:

### Phase 2 - Essential Foundations (Next)
1. ✅ **Tournament Brackets** - Single elimination basics
2. 📋 **Doubles Support** - 2v2 team matches
3. 📋 **Match History Improvements** - Better stat tracking
4. 📋 **Basic Leaderboards** - Win/loss rankings

### Phase 3 - Tournament Core
5. 📋 **Round Robin Format** - Full round robin support
6. 📋 **Tournament Creation** - Setup tournaments from app
7. 📋 **Player Registration** - Sign up for tournaments
8. 📋 **Live Scoreboard** - Real-time display on second device

### Phase 4 - Advanced Tournament
9. 📋 **Double Elimination** - Losers bracket
10. 📋 **Pool Play** - Group stages
11. 📋 **Tournament Discovery** - Find tournaments near you
12. 📋 **Push Notifications** - Match alerts

### Phase 5 - Payment & E-Commerce
13. 📋 **Pre-Registration** - Online sign-up system
14. 📋 **Payment Integration** - PayPal/Stripe
15. 📋 **Payout Calculator** - Prize distribution

### Phase 6 - Social & Community
16. 📋 **Player Profiles Enhancement** - Stats, bio, ratings
17. 📋 **QR Code Check-In** - Quick tournament registration
18. 💡 **Player Following** - Social connections
19. 💡 **Chat/Messaging** - Player communication

### Phase 7 - League & Advanced
20. 📋 **League Management** - Season tracking
21. 💡 **Advanced Team Formats** - Switcholio, MLP, etc.
22. 💡 **TV Display Mode** - Cast to external displays
23. 💡 **Offline Mode** - Function without internet

---

## Notes

### What Makes Scoreholio Successful
- **Automation** - Minimal manual intervention required
- **Multi-Device Support** - Works on phones, tablets, TVs
- **Real-Time Sync** - All devices update instantly
- **Payment Integration** - Easy money collection
- **Tournament Variety** - Multiple formats and team types
- **Support** - Live chat, tutorials, documentation

### Opportunities for Popdarts App
- **Sport-Specific Features** - Popdarts has unique rules
- **Practice Mode** - Heatmaps and accuracy tracking (Scoreholio doesn't have this)
- **Video Integration** - Record/replay matches
- **Community Features** - Social aspects beyond tournaments
- **Equipment Store** - Direct integration with Popdarts shop

### Features We Shouldn't Copy
- Some Scoreholio features are for multi-sport platforms
- We should focus on Popdarts-specific innovations
- Our practice mode concept is unique and valuable

---

## Summary Statistics

**Total Features Identified**: ~100+  
**Currently Implemented**: ~8-10 (10%)  
**High Priority (Phase 2-3)**: ~15-20 features  
**Medium Priority (Phase 4-5)**: ~20-25 features  
**Low Priority (Phase 6-7)**: ~30+ features  

---

**Last Updated**: February 3, 2026  
**Review Frequency**: Update after each major feature implementation
