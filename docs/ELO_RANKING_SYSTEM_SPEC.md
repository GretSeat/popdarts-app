# Popdarts ELO Ranking System Specification

**Document Version**: 1.0  
**Created**: February 5, 2026  
**Last Updated**: February 5, 2026  
**Status**: Draft - Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [System Philosophy](#system-philosophy)
3. [Core Mechanics](#core-mechanics)
4. [Placement System](#placement-system)
5. [Rank Tiers & Progression](#rank-tiers--progression)
6. [Match Types](#match-types)
7. [Seasonal System](#seasonal-system)
8. [Rewards & Achievements](#rewards--achievements)
9. [User Interface](#user-interface)
10. [Database Schema](#database-schema)
11. [Implementation Phases](#implementation-phases)
12. [Edge Cases & Rules](#edge-cases--rules)

---

## Overview

### Purpose

Create a competitive ranking system for Popdarts that allows players to:

- Track skill progression over time
- Earn visible ranks and seasonal rewards
- Compete in official ranked matches at tournaments and clubs
- Climb global and local leaderboards
- Display achievement badges and rank history

### Key Differentiators

Unlike online games (League of Legends, Rocket League), Popdarts is an **in-person sport**:

- ✅ Players physically attend tournaments/clubs
- ✅ Matches are played face-to-face
- ✅ No automated matchmaking (players/organizers choose opponents)
- ✅ Rank updates happen **immediately after each match**
- ✅ Players can climb tiers **during a tournament** (not just at end)
- ✅ Tournaments can have mix of ranked and unranked players
- 🌍 **Top 20 Elite players compete in World Championships**

### Inspiration

This system combines elements from:

- **Chess/Tennis**: Per-match rating changes, visible ELO
- **Rocket League**: Transparent MMR display
- **League of Legends**: Seasonal rewards and tier badges
- **Clash of Clans**: Regional leaderboards and club rankings

---

## System Philosophy

### Design Principles

1. **Immediate Gratification**
   - Rank updates after each match, not at tournament end
   - Players can see MMR gains/losses instantly
   - Tier promotions happen in real-time

2. **Transparent Rating**
   - Show actual MMR number (not hidden like LoL)
   - Display MMR change after each match (+18, -12, etc.)
   - Explain why gain/loss happened (opponent strength)

3. **Fair for In-Person Play**
   - Handle mismatched opponents gracefully
   - Reward upsets heavily (Bronze beating Gold)
   - Protect against "farming" lower players
   - Allow unranked players in same tournament

4. **Inclusive Yet Competitive**
   - Casual "friendly" matches don't affect rank
   - "Official" matches require both players to opt-in
   - New players aren't penalized during placement
   - Can't lose MMR during first 10 matches

5. **Community Focused**
   - Club-based leaderboards (local pride)
   - Global rankings (worldwide competition)
   - Seasonal badges for bragging rights
   - Historical record of peak achievements

---

## Core Mechanics

### MMR (Matchmaking Rating)

#### **Base Formula**

Modified ELO system with adjustments for in-person play:

```javascript
// Expected win probability
expectedScore = 1 / (1 + 10^((opponentMMR - playerMMR) / 400))

// MMR change
mmrChange = K-Factor × (actualScore - expectedScore)

// New MMR
newMMR = oldMMR + mmrChange
```

#### **K-Factor (Volatility)**

Controls how much MMR changes per match:

| Player Status                | K-Factor | Reasoning                                  |
| ---------------------------- | -------- | ------------------------------------------ |
| Placement (0-9 matches)      | 50       | High volatility to find true skill quickly |
| New Ranked (10-50 matches)   | 40       | Still calibrating                          |
| Established (50-100 matches) | 32       | Standard volatility                        |
| Veteran (100+ matches)       | 24       | Stable, harder to move                     |
| Elite (Top 5%)               | 20       | Protect elite rankings                     |

#### **Starting MMR**

- **Default**: 800 MMR (Rookie II)
- **Practice Bonus**: +0 to +200 MMR based on practice mode performance
  - Exceptional accuracy (80%+ bullseyes) → Start at 1050 (Silver III)
  - This encourages practicing before ranked play

#### **MMR Boundaries**

- **Minimum**: 0 MMR (cannot go negative)
- **Maximum**: No cap (theoretically infinite, realistically ~3500+)
- **Average**: 1200 MMR (Gold II tier)

---

## Placement System

### Overview

New players must complete **10 placement matches** before receiving an official rank.

### Placement Rules

#### **During Placement (Matches 1-10)**:

- ✅ Can only play "Official" matches
- ✅ MMR calculated normally but **hidden from player**
- ✅ **Cannot lose MMR** (losses give 0 change, wins give full points)
- ✅ Matches count toward opponent's MMR normally
- ✅ Display "Placement Match 3/10" instead of rank
- ✅ Show provisional MMR range after 5 matches (e.g., "~900-1100")

#### **After 10th Match**:

- 🎉 Rank reveal animation
- 📊 Display starting rank and MMR
- 🏆 Award "Ranked Player" badge
- 📈 Show projected climb path

#### **Why 10 Matches?**

- Enough data for accurate skill assessment
- Not so many that players quit before completing
- Standard in competitive games (CS2, Valorant use 10)
- Prevents smurfing/account abuse

### Example Placement Journey

```
Player: "DartMaster99" (New Player)

Match 1: vs Rookie II (820 MMR) → Win → Gain +40 → 840 MMR
Match 2: vs Bronze III (910 MMR) → Loss → Gain +0 → 840 MMR (protected)
Match 3: vs Rookie I (880 MMR) → Win → Gain +38 → 878 MMR
Match 4: vs Silver II (1120 MMR) → Win → Gain +60 → 938 MMR
Match 5: vs Bronze II (980 MMR) → Win → Gain +42 → 980 MMR
  → Display: "Provisional Rank: ~900-1000 (Bronze III–II)"
Match 6: vs Silver III (1050 MMR) → Win → Gain +40 → 1020 MMR
Match 7: vs Gold III (1200 MMR) → Loss → Gain +0 → 1020 MMR (protected)
Match 8: vs Silver II (1100 MMR) → Win → Gain +38 → 1058 MMR
Match 9: vs Gold II (1270 MMR) → Loss → Gain +0 → 1058 MMR (protected)
Match 10: vs Silver III (1050 MMR) → Win → Gain +40 → 1098 MMR

🎉 PLACEMENT COMPLETE 🎉
Final Rank: Silver II (1098 MMR)
Record: 7-3
```

---

## Rank Tiers & Progression

### Tier Structure

8 tiers with 3 divisions each (24 total ranks) + Unranked placement:

| Tier         | Division | MMR Range   | % of Players                 | Color                 |
| ------------ | -------- | ----------- | ---------------------------- | --------------------- |
| **Rookie**   | III → I  | 700 - 899   | 10%                          | #7A7A7A (Rookie Gray) |
| **Bronze**   | III → I  | 900 - 1049  | 15%                          | #CD7F32 (Bronze)      |
| **Silver**   | III → I  | 1050 - 1199 | 20%                          | #C0C0C0 (Silver)      |
| **Gold**     | III → I  | 1200 - 1349 | 20%                          | #FFD700 (Gold)        |
| **Platinum** | III → I  | 1350 - 1499 | 12%                          | #E5E4E2 (Platinum)    |
| **Diamond**  | III → I  | 1500 - 1699 | 10%                          | #B9F2FF (Diamond)     |
| **Pro**      | III → I  | 1700 - 1899 | 8%                           | #9D4EDD (Pro Purple)  |
| **Elite**    | -        | 1900+       | Top 20 Players (Fixed Slots) | #FFD60A (Elite Gold)  |

**Elite is a fixed-slot tier**: Only the **top 20 players globally** by MMR hold Elite status at any time. If a Pro player surpasses the 20th-ranked Elite MMR, they take that slot and the previous #20 drops to Pro I. Elite players are invited to compete in the annual **World Championships**.

### Sweet Spot for ~400 Ranked Players

**Recommended structure**: 8 tiers + 3 divisions each (24 ranks), plus Unranked placement.

**Why this works for 400 players**:

- Keeps each rank populated (roughly 15-25 players per rank on average)
- Avoids empty tiers at the top
- Makes weekly movement meaningful without being too volatile
- Matches in-person cadence (weekly official matches)

### Points Per Win/Loss (MMR Change Targets)

Popdarts should treat "points" as **MMR change per match** (no separate LP system). Use ELO with K-Factor tuning to produce these **target ranges**:

| Match Context                | Typical Win | Typical Loss | Notes               |
| ---------------------------- | ----------- | ------------ | ------------------- |
| Even matchup (±50 MMR)       | +14 to +18  | -14 to -18   | Most common outcome |
| Underdog wins by 150-250 MMR | +22 to +30  | -10 to -14   | Reward upsets       |
| Underdog wins by 300-450 MMR | +30 to +40  | -6 to -10    | Big swing           |
| Favorite wins by 150-250 MMR | +6 to +10   | -22 to -30   | Discourage farming  |

**Recommended K-Factor** for Popdarts cadence:

- Placement (0-9 matches): K=50
- New ranked (10-50): K=40
- Established (50-100): K=32
- Veteran (100+): K=24
- Elite (Top 5%): K=20

This creates **meaningful weekly movement** without making ranks feel random.

### Division Thresholds

Each tier has 3 divisions (except Elite):

```javascript
// Example: Gold tier (1200-1349)
Gold III: 1200-1249 MMR
Gold II: 1250-1299 MMR
Gold I: 1300-1349 MMR

// Formula
divisionThreshold = tierMin + (tierRange / 3) × divisionNumber
```

### Promotion & Demotion

#### **Instant Promotion**

- Cross division threshold → Immediate promotion
- No "promotion series" (not practical for in-person)
- Example: 1348 MMR (Gold I) → Win +20 → 1368 MMR (Platinum III)

#### **Instant Demotion**

- Fall below division threshold → Immediate demotion
- **5-match grace period** for tier demotions only
- Example: 1208 MMR (Gold III) → Lose -18 → 1190 MMR (Silver I)
  - If this is your first loss in Gold, demotion delayed
  - After 5 losses below threshold, demote to Silver I

#### **Demotion Protection**

To prevent frustrating rank bouncing:

- **Tier protection**: 5 matches below threshold before demotion
- **Division protection**: None (immediate demotion)
- **Reset**: Protection resets if you climb back above threshold

---

## Match Types

### Official Matches (Ranked)

**What counts as "official"?**

- ✅ Tournament matches at registered clubs
- ✅ Club league matches
- ✅ Sanctioned club events
- ✅ Matches where both players agree to "ranked" before starting
- ❌ Casual practice games
- ❌ Training mode
- ❌ Matches against unranked players still in placement

**Requirements:**

- Both players must have accounts
- Both players must opt-in to "Official Match"
- Match must be recorded in app (not retroactive)
- Clubs can designate events as "auto-official" (all matches ranked by default)

### Friendly Matches (Unranked)

- No MMR change
- Still recorded in match history
- Counts toward total games played
- Can earn achievement badges
- Good for practicing against friends

### Mixed Matches

What if one player is ranked and one is in placement?

- ✅ Ranked player's MMR affected normally
- ✅ Placement player gains MMR (protected from losses)
- ✅ Counts toward placement player's 10 matches

---

## Seasonal System

### Season Length

**12 weeks (3 months)** per season

- 4 seasons per year
- Season 1: Jan-Mar
- Season 2: Apr-Jun
- Season 3: Jul-Sep
- Season 4: Oct-Dec

### Season Structure

#### **Week 1-10: Regular Season**

- Climb ranks normally
- All match types available
- Leaderboards update live

#### **Week 11-12: Season Finals**

- Top 10% can compete in "Championship Events"
- Bonus MMR for wins during finals period (+25% MMR gains)
- Last chance to push for rewards

#### **Season End**

- Rewards distributed based on **peak rank** (not final rank)
- Historical badge awarded
- Season statistics locked in

### World Championships (Elite Only)

**Eligibility**: Top 20 Elite players at season end qualify for Worlds

**Tournament Structure**:

- **Group Stage**: 4 groups of 5 players (round-robin format)
  - Each player plays 4 matches (one against each group member)
  - Top 4 players from each group advance (16 total)
- **Knockout Stage**: Single-elimination bracket (16 → 8 → 4 → 2 → Champion)
  - Best of 3 format for quarterfinals and semifinals
  - Best of 5 format for finals

**Seeding**: Groups are seeded by final season MMR:

- Group A: #1, #8, #9, #16, #17
- Group B: #2, #7, #10, #15, #18
- Group C: #3, #6, #11, #14, #19
- Group D: #4, #5, #12, #13, #20

**Prize**: World Champion receives:

- 🏆 Physical trophy and medal
- 👑 "World Champion" title (permanent)
- 🌟 Exclusive "Worlds Winner" badge
- 📸 Featured on app homepage
- 🎯 Automatic Elite status next season

**Timeline**: Held 2 weeks after season end (allows for travel/planning)

### Season Reset (Soft Reset)

#### **MMR Compression**

At season start, MMR is compressed toward average (1200):

```javascript
newMMR = (oldMMR + 1200) / 2

Examples:
Rookie II (820) → 1010 (Silver III)
Gold I (1320) → 1260 (Gold II)
Diamond II (1600) → 1400 (Platinum II)
Elite (2100) → 1700 (Pro III)
```

**Why compress?**

- Prevents runaway MMR inflation
- Gives all players opportunity to reclaim rank
- Creates exciting early-season matches
- Keeps leaderboard competitive

#### **Rank Hidden During Placement**

- Even veterans must complete 5 placement matches
- Previous season's rank shown as "Last Season: Gold I"
- Accelerated MMR gains (K=50) for first 5 matches
- After 5 matches, rank revealed

---

## Rewards & Achievements

### Season Rewards (Based on Peak Rank)

| Rank Tier    | Rewards                                                  |
| ------------ | -------------------------------------------------------- |
| **Rookie**   | Rookie border, "Getting Started" badge                   |
| **Bronze**   | Bronze border, "Competitor" badge                        |
| **Silver**   | Silver border, "Rising Star" badge                       |
| **Gold**     | Gold border, "Golden Player" badge                       |
| **Platinum** | Platinum border, "Elite Contender" badge                 |
| **Diamond**  | Diamond border, "Diamond League" badge                   |
| **Pro**      | Pro border, "Professional" badge                         |
| **Elite**    | Elite border, "World Elite" badge, **Worlds invitation** |

### Permanent Badges

Displayed on profile forever:

- "Season X - [Highest Rank]" badge (earned each season based on peak rank)
- "World Champion S1" badge (if won Worlds)
- "World Elite" badge (if reached Elite status)
- Total seasons played counter
- Peak MMR ever achieved
- Highest rank icon
- Special "Worlds Participant" badge for all 20 Elite qualifiers

### Achievement Badges (Non-Ranked)

Earned through gameplay, not rank. These are **permanent badges** displayed on your profile:

- 🎯 **Bullseye Master** - 100 bullseyes in ranked matches
- 🔥 **Win Streak** - 10 consecutive ranked wins
- 🏆 **Tournament Victor** - Win an official tournament
- 🎪 **Giant Slayer** - Beat opponent 500+ MMR higher
- 🛡️ **Gatekeeper** - Defend your tier by beating a promotion player
- 📈 **Climber** - Gain 200+ MMR in a single season
- 🌟 **Perfect Game** - Score 301 with zero misses
- 🌍 **Globetrotter** - Play ranked matches at 10+ different clubs
- 💎 **Consistency King** - Maintain 60%+ win rate over 50 matches
- ⚡ **Speed Demon** - Win 5 matches in a single day

---

## User Interface

### Profile Display

```
┌────────────────────────────────────────┐
│  [Profile Picture]  DartMaster99       │
│  ⭐ Gold I             1320 MMR         │
│                                        │
│  Season 1 Progress:                    │
│  ▓▓▓▓▓▓▓░░░ 1300 → 1350 (Gold I)      │
│  +30 MMR to Platinum III               │
│                                        │
│  📊 Ranked Stats:                      │
│  • Matches: 87 (54W - 33L)             │
│  • Win Rate: 62.1%                     │
│  • Peak Rank: Platinum II              │
│  • Peak MMR: 1468                      │
│                                        │
│  🏆 Season Badges:                     │
│  [Gold S1] [Silver S2] [Bronze S3]     │
│                                        │
│  🎖️ Achievements:                      │
│  🎯 Bullseye Master  🔥 Win Streak x5  │
│  🏆 Tournament Victor                  │
└────────────────────────────────────────┘
```

### Match Result Screen

```
┌────────────────────────────────────────┐
│          OFFICIAL MATCH RESULT          │
│                                        │
│  🏆 YOU WIN!                           │
│                                        │
│  You (Gold I, 1320)  vs  (Diamond III, 1540)  │
│  Score: 301 - 287                      │
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  📈 MMR CHANGE: +26                    │
│  1320 → 1346 MMR                       │
│                                        │
│  Expected Win Chance: 32%              │
│  Upset Victory Bonus: +12              │
│                                        │
│  🎉 PROMOTED TO PLATINUM III!          │
│  +4 MMR until Platinum II              │
│                                        │
│  [View Full Stats]  [Next Match]       │
└────────────────────────────────────────┘
```

### Leaderboard Views

#### **Global Top 50**

```
Rank  Player              MMR    Tier        W-L
───────────────────────────────────────────────
1.    TheDartKing        2156   Elite       287-89
2.    BullseyeQueen      2098   Elite       241-72
3.    PrecisionMaster    2044   Elite       198-64
...
47.   DartMaster99       1520   Diamond II  54-33
```

#### **Club Rankings**

```
Local Club: "Downtown Darts"
───────────────────────────────────────────────
1.    LocalLegend        2064   Elite       124-45
2.    ClubChamp          1788   Pro I       98-51
3.    DartMaster99       1520   Diamond II  54-33
```

### In-Match Rank Display

During tournament:

```
Match: Round 2
───────────────────────
Player 1: DartMaster99
Rank: Gold I (1320)
↑ +26 this tournament

Player 2: SilverSlinger
Rank: Silver II (1125)
↓ -15 this tournament
```

---

## Database Schema

### New Tables

#### **player_rankings**

```sql
CREATE TABLE player_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Current Season Stats
  current_mmr INTEGER NOT NULL DEFAULT 800,
  current_rank TEXT NOT NULL DEFAULT 'Unranked',
  current_division INTEGER, -- 1-3 for divisions, NULL for Elite

  -- Placement System
  is_placement BOOLEAN DEFAULT true,
  placement_matches_played INTEGER DEFAULT 0,
  placement_matches_required INTEGER DEFAULT 10,

  -- Match History
  total_matches INTEGER DEFAULT 0,
  ranked_wins INTEGER DEFAULT 0,
  ranked_losses INTEGER DEFAULT 0,

  -- Season Peaks
  peak_mmr INTEGER DEFAULT 1000,
  peak_rank TEXT DEFAULT 'Unranked',
  peak_rank_achieved_at TIMESTAMPTZ,

  -- Progression
  k_factor INTEGER DEFAULT 50, -- Adjusted based on matches played
  current_win_streak INTEGER DEFAULT 0,
  current_loss_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,

  -- Demotion Protection
  games_below_threshold INTEGER DEFAULT 0, -- For tier demotion grace
  tier_demotion_protected BOOLEAN DEFAULT false,

  -- Metadata
  last_match_at TIMESTAMPTZ,
  season_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(player_id, season_number)
);

CREATE INDEX idx_player_rankings_mmr ON player_rankings(current_mmr DESC);
CREATE INDEX idx_player_rankings_player ON player_rankings(player_id);
CREATE INDEX idx_player_rankings_season ON player_rankings(season_number);
```

#### **seasonal_rewards**

```sql
CREATE TABLE seasonal_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,

  -- Final Stats
  final_mmr INTEGER NOT NULL,
  final_rank TEXT NOT NULL,
  peak_mmr INTEGER NOT NULL,
  peak_rank TEXT NOT NULL,

  -- Performance
  total_matches INTEGER NOT NULL,
  total_wins INTEGER NOT NULL,
  win_rate DECIMAL(5,2),

  -- Rewards Earned
  badge_earned TEXT NOT NULL,
  border_earned TEXT NOT NULL,
  worlds_qualified BOOLEAN DEFAULT false, -- Top 20 Elite qualification
  cosmetics_unlocked TEXT[], -- Array of cosmetic IDs (jerseys, animations, etc.)

  -- Rankings
  global_rank_percentile DECIMAL(5,2),
  club_rank INTEGER,

  -- Metadata
  awarded_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(player_id, season_number)
);

CREATE INDEX idx_seasonal_rewards_player ON seasonal_rewards(player_id);
CREATE INDEX idx_seasonal_rewards_season ON seasonal_rewards(season_number);
```

#### **match_history** (extend existing matches table)

```sql
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'friendly'; -- 'official' or 'friendly'
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_ranked BOOLEAN DEFAULT false;

-- Player 1 MMR Tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player1_mmr_before INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player1_mmr_after INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player1_mmr_change INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player1_rank_before TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player1_rank_after TEXT;

-- Player 2 MMR Tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player2_mmr_before INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player2_mmr_after INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player2_mmr_change INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player2_rank_before TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player2_rank_after TEXT;

-- Match Context
ALTER TABLE matches ADD COLUMN IF NOT EXISTS expected_win_probability DECIMAL(5,2);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS was_upset BOOLEAN DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_number INTEGER;

CREATE INDEX idx_matches_ranked ON matches(is_ranked) WHERE is_ranked = true;
CREATE INDEX idx_matches_season ON matches(season_number);
```

#### **achievements**

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'bullseye_master', 'win_streak_10', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or image URL
  tier TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'legendary'
  requirement_type TEXT NOT NULL, -- 'count', 'streak', 'single_match'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(player_id, achievement_id)
);

CREATE INDEX idx_player_achievements_player ON player_achievements(player_id);
CREATE INDEX idx_player_achievements_completed ON player_achievements(completed) WHERE completed = true;
```

### Modified Tables

#### **profiles** (add rank display preference)

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_rank BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_mmr BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_season_badge TEXT;
```

#### **clubs** (add club rankings)

```sql
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS average_mmr INTEGER DEFAULT 1000;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS total_ranked_players INTEGER DEFAULT 0;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS club_tier TEXT DEFAULT 'Bronze'; -- Based on avg MMR
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic MMR system working

- [ ] Create database tables (player_rankings, seasonal_rewards)
- [ ] Implement ELO calculation function
- [ ] Add "Official Match" toggle to NewMatchScreen
- [ ] Store MMR before/after in matches table
- [ ] Display MMR on ProfileScreen
- [ ] Basic rank tier assignment (no divisions yet)

**Deliverables**:

- Players can opt-in to ranked matches
- MMR calculated and stored after each match
- Profile shows current MMR and basic rank

### Phase 2: Placement System (Week 3)

**Goal**: New player onboarding

- [ ] Implement placement match tracking (0-10)
- [ ] Hide rank during placement
- [ ] Protect from MMR loss during placement
- [ ] Show "Placement Match X/10" UI
- [ ] Rank reveal screen after 10th match
- [ ] Award "Ranked Player" achievement

**Deliverables**:

- New players complete 10 placement matches
- Smooth onboarding experience
- Fair starting rank assignment

### Phase 3: Rank Tiers & Divisions (Week 4)

**Goal**: Full tier system

- [ ] Implement 32 rank divisions (8 tiers × 4 divisions)
- [ ] Create rank badge graphics/icons
- [ ] Add rank color coding
- [ ] Implement promotion/demotion logic
- [ ] Add tier demotion protection (5 games)
- [ ] Show progress bar to next rank

**Deliverables**:

- Visual rank system with badges
- Smooth tier transitions
- Clear progression feedback

### Phase 4: Leaderboards (Week 5)

**Goal**: Competitive rankings

- [ ] Create global leaderboard view
- [ ] Create club leaderboard view
- [ ] Add percentile rankings
- [ ] Implement "Top 20" badge for Elite players
- [ ] Add search/filter to leaderboards
- [ ] Show player position in leaderboard

**Deliverables**:

- Global and local rankings
- Competitive drive for players
- Social proof of skill

### Phase 5: Match Results UI (Week 6)

**Goal**: Clear feedback

- [ ] Redesign match result screen for ranked
- [ ] Show MMR change prominently (+18, -12, etc.)
- [ ] Display opponent strength comparison
- [ ] Show expected win probability
- [ ] Highlight upset victories
- [ ] Add rank change notifications

**Deliverables**:

- Players understand why MMR changed
- Transparent ranking system
- Celebration of achievements

### Phase 6: Seasonal System (Week 7-8)

**Goal**: Season cycle and Worlds qualification

- [ ] Implement season tracking (season_number)
- [ ] Create season start/end logic
- [ ] Implement soft MMR reset
- [ ] Add seasonal placement (5 matches)
- [ ] Create season rewards table
- [ ] Award badges at season end
- [ ] **Identify top 20 Elite players for Worlds**
- [ ] **Generate World Championship brackets**
- [ ] Send Worlds invitations to Elite players

**Deliverables**:

- 12-week season cycle
- Rewards distribution
- World Championships qualification system
- Historical badge storage

### Phase 7: Achievements (Week 9)

**Goal**: Extra engagement

- [ ] Create achievement system
- [ ] Implement 15-20 achievements
- [ ] Add achievement progress tracking
- [ ] Show achievements on profile
- [ ] Achievement unlock notifications
- [ ] Achievement showcase screen

**Deliverables**:

- Non-ranked progression path
- Extra motivation to play
- Profile customization

### Phase 8: Polish & Testing (Week 10)

**Goal**: Smooth experience

- [ ] Add animations for rank up/down
- [ ] Improve rank badge designs
- [ ] Add sound effects for achievements
- [ ] Performance optimization (leaderboard queries)
- [ ] Edge case testing
- [ ] Beta testing with real players

**Deliverables**:

- Production-ready ranking system
- Polished user experience
- Bug-free operation

---

## Edge Cases & Rules

### Smurfing Prevention

**Problem**: Experienced players creating new accounts to beat beginners

**Solutions**:

1. Practice Mode Boost: Strong practice performance = higher starting MMR
2. Accelerated Placement: K=50 during first 10 matches (quick rise to true skill)
3. Upset Detection: System notices consistent wins against higher ranks
4. Account Linking: Optional phone verification for competitive events

### Tanking Prevention

**Problem**: Players intentionally losing to lower MMR

**Solutions**:

1. Loss Streaks: After 5 losses in a row, show warning popup
2. MMR Floor: Can't drop below certain MMR for your experience level
3. Reporting: Players can report suspicious behavior
4. Statistics Review: Unusual loss patterns flagged for review

### Rating Manipulation

**Problem**: Friends playing each other repeatedly to trade MMR

**Solutions**:

1. Diminishing Returns: Repeated matches vs same opponent = reduced MMR change
   - 1st match: Normal MMR
   - 2nd match (same day): -25% MMR change
   - 3rd+ match (same day): -50% MMR change
2. Match Frequency Limit: Max 3 ranked matches vs same player per day
3. Pattern Detection: System flags unusual win trading

### Tournament Mid-Climb

**Problem**: Player ranks up during tournament, creating bracket imbalance

**Solution**:

- ✅ Allow it! This is the system working as intended
- Tournament bracket doesn't change (they finish as original seed)
- Their rank badge updates in real-time
- Other players can see opponent's new rank
- Creates excitement and drama

**Example**:

```
Tournament Start:
Player enters as Bronze II (980 MMR)

Round 1: Beat Silver I (+35 MMR) → 1015 MMR (Silver IV)
Round 2: Beat Gold III (+45 MMR) → 1060 MMR (Silver III)
Round 3: Beat Gold I (+50 MMR) → 1110 MMR (Silver I)

Tournament End:
Player finishes tournament in Silver I!
Started Bronze II, ended Silver I (+130 MMR in one tournament)
```

### Inactive Players

**Problem**: Players who stop playing retain high ranks

**Solutions**:

1. MMR Decay: After 30 days inactive, lose 10 MMR/day
2. Decay Cap: Max 200 MMR loss from inactivity
3. Decay Stops: At tier threshold (can't decay out of tier)
4. Return Bonus: First 3 matches back give +50% MMR
5. Seasonal Reset: Inactivity doesn't matter if season ends

### Club vs Global MMR

**Question**: Should clubs have separate rankings?

**Answer**: No, use single unified MMR system

- Global MMR applies everywhere
- Clubs show leaderboard of their members
- Encourages clubs to recruit strong players
- Prevents rating inflation from separate pools

### Unranked vs Ranked in Same Tournament

**Question**: Can placement players compete with ranked players?

**Answer**: Yes, with caveats

- Placement players can join any tournament
- Ranked players' MMR affected normally
- Placement players protected from losses
- Both players must agree to "official" match
- Tournament organizers can make all matches official

---

## Technical Considerations

### Performance Optimization

#### **Leaderboard Queries**

```sql
-- Indexed query for global top 50
SELECT
  p.display_name,
  pr.current_mmr,
  pr.current_rank,
  pr.ranked_wins,
  pr.ranked_losses,
  ROW_NUMBER() OVER (ORDER BY pr.current_mmr DESC) as rank
FROM player_rankings pr
JOIN profiles p ON pr.player_id = p.id
WHERE pr.season_number = (SELECT MAX(season_number) FROM player_rankings)
  AND pr.placement_matches_played >= 10
ORDER BY pr.current_mmr DESC
LIMIT 50;
```

#### **Caching Strategy**

- Cache leaderboards for 5 minutes (update every 5 min)
- Cache player rank on profile (update after each match)
- Real-time updates only for active matches

### Real-Time Updates

Use Supabase Realtime for:

- Match results pushing to both players
- Leaderboard position changes
- Achievement unlocks
- Rank promotions

### Data Validation

```javascript
// Validate MMR change is within acceptable range
function validateMMRChange(change, kFactor) {
  const maxChange = kFactor * 1.2; // Max possible with bonus
  if (Math.abs(change) > maxChange) {
    throw new Error("Invalid MMR change detected");
  }
  return true;
}

// Validate match result integrity
function validateMatchResult(match) {
  if (match.player1_id === match.player2_id) {
    throw new Error("Cannot play against yourself");
  }
  if (match.player1_score === match.player2_score) {
    throw new Error("Ties not allowed in ranked");
  }
  return true;
}
```

---

## Testing Strategy

### Unit Tests

- ELO calculation accuracy
- Rank tier assignment
- Placement match progression
- Demotion protection logic

### Integration Tests

- Match creation with MMR updates
- Leaderboard sorting and filtering
- Season rewards distribution
- Achievement unlocking

### User Acceptance Tests

- 10 beta testers complete placement
- Host tournament with mixed ranks
- Verify MMR gains/losses feel fair
- Test edge cases (disconnects, ties, etc.)

---

## Future Enhancements (Post-Launch)

### Version 2.0 Features

- 🎮 Team-based MMR (doubles partnerships)
- 📊 Advanced statistics (accuracy rating, consistency score)
- 🏆 Regional championships for top players
- 💰 MMR-based tournament brackets (auto-seed by rank)
- 🎯 Practice mode affects MMR slightly (calibration)
- 🌍 International leaderboards by country
- 📱 Push notifications for rank changes

### Version 3.0 Features

- 🤖 AI opponent with dynamic difficulty (matches your MMR)
- 📺 Spectator mode for top-ranked matches
- 🎥 Match replays with highlights
- 🏅 Hall of Fame for season champions
- 💎 Prestige system (reset to Bronze for special badge)

---

## Success Metrics

### Key Performance Indicators (KPIs)

| Metric                       | Target           | Measurement                           |
| ---------------------------- | ---------------- | ------------------------------------- |
| Placement Completion Rate    | >80%             | % of players finishing 10 matches     |
| Daily Active Ranked Players  | 30% of user base | Players with ≥1 ranked match/day      |
| Match Quality (Avg MMR Diff) | <300 MMR         | How balanced matches are              |
| Rank Distribution            | Matches target % | Are tiers properly distributed?       |
| Season Retention             | >60%             | Players active in consecutive seasons |
| Average Matches per Season   | 25+              | Engagement level                      |

### User Satisfaction Goals

- 90%+ satisfaction with rank accuracy
- 85%+ feel MMR changes are fair
- 95%+ understand why they gained/lost MMR
- 80%+ excited about seasonal rewards

---

## FAQ

### For Players

**Q: How many matches until I'm ranked?**  
A: 10 placement matches. You can't lose MMR during these.

**Q: Can I lose my rank?**  
A: Yes, but you have 5-match protection when dropping tiers.

**Q: Do I have to play ranked?**  
A: No! You can play friendly matches forever if you want.

**Q: What if my opponent is much higher/lower rank?**  
A: That's fine! You gain more for beating higher ranks, lose less to lower ranks.

**Q: Can I see my rank during a tournament?**  
A: Yes! It updates after each match in real-time.

**Q: Do seasons reset my rank?**  
A: Partially. Your MMR is compressed toward average, but you'll climb back quickly.

**Q: How do I get invited to Worlds?**  
A: Finish the season as one of the top 20 Elite players globally. All Elite players receive an invitation to the World Championships.

**Q: Are there any pay-to-win elements?**  
A: No! All rewards are earned through skill and gameplay. There are no coins, purchases, or advantages you can buy.

### For Tournament Organizers

**Q: Can I make all tournament matches ranked?**  
A: Yes! Toggle "Official Tournament" and all matches count automatically.

**Q: What if players have different ranks?**  
A: That's expected! The system handles it fairly with MMR adjustments.

**Q: Do brackets need to be seeded by rank?**  
A: No, but you can! The app can auto-seed by MMR if desired.

**Q: Can unranked players compete?**  
A: Yes! They'll complete placement matches during tournament.

---

## Appendix

### A. MMR Change Examples

```javascript
// Example 1: Even matchup
Player A (1500 MMR) vs Player B (1500 MMR)
Expected: 50% win chance
Win: +16 MMR
Loss: -16 MMR

// Example 2: Favored player wins
Player A (1800 MMR) vs Player B (1400 MMR)
Expected: 91% win chance for A
A wins: +2 MMR (expected outcome)
B wins: +42 MMR (massive upset!)

// Example 3: Underdog wins
Player A (1200 MMR) vs Player B (1600 MMR)
Expected: 15% win chance for A
A wins: +38 MMR (great upset!)
B wins: +8 MMR (expected outcome)
```

### B. Rank Distribution Goals

Target distribution (based on normal distribution):

```
Rookie:     10% (Bottom 10%)
Bronze:     15% (10-25th percentile)
Silver:     20% (25-45th percentile)
Gold:       20% (45-65th percentile)  ← Most players
Platinum:   12% (65-77th percentile)
Diamond:    10% (77-87th percentile)
Pro:        13% (87-99.5th percentile)
Elite:      Top 20 players exactly (fixed slots, ~0.5% with 4000 players)
```

**Note**: As player base grows, Elite remains fixed at 20 players. With 400 players, that's 5%. With 4000 players, that's 0.5%.

### C. Code Snippets

#### Calculate MMR Change

```javascript
/**
 * Calculate MMR change based on match result
 * @param {number} playerMMR - Player's current MMR
 * @param {number} opponentMMR - Opponent's current MMR
 * @param {boolean} didWin - Whether player won
 * @param {number} kFactor - Volatility factor (16-50)
 * @returns {number} MMR change (positive or negative)
 */
function calculateMMRChange(playerMMR, opponentMMR, didWin, kFactor = 32) {
  // Expected score (win probability) using ELO formula
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));

  // Actual score (1 for win, 0 for loss)
  const actualScore = didWin ? 1 : 0;

  // Calculate change
  const change = Math.round(kFactor * (actualScore - expectedScore));

  return change;
}

// Example usage
const change = calculateMMRChange(1200, 1500, true, 32);
console.log(change); // +38 (upset victory bonus)
```

#### Get Rank from MMR

```javascript
/**
 * Determine rank tier and division from MMR
 * @param {number} mmr - Player's MMR
 * @returns {Object} {tier, division, fullRank}
 */
function getRankFromMMR(mmr) {
  const tiers = [
    { name: "Rookie", min: 700, max: 899, color: "#7A7A7A" },
    { name: "Bronze", min: 900, max: 1049, color: "#CD7F32" },
    { name: "Silver", min: 1050, max: 1199, color: "#C0C0C0" },
    { name: "Gold", min: 1200, max: 1349, color: "#FFD700" },
    { name: "Platinum", min: 1350, max: 1499, color: "#E5E4E2" },
    { name: "Diamond", min: 1500, max: 1699, color: "#B9F2FF" },
    { name: "Pro", min: 1700, max: 1899, color: "#9D4EDD" },
    { name: "Elite", min: 1900, max: 9999, color: "#FFD60A" },
  ];

  const tier = tiers.find((t) => mmr >= t.min && mmr <= t.max);

  if (tier.name === "Elite") {
    return {
      tier: tier.name,
      division: null,
      fullRank: "Elite",
      color: tier.color,
    };
  }

  // Calculate division (III, II, I)
  const tierRange = tier.max - tier.min;
  const divisionSize = tierRange / 3;
  const positionInTier = mmr - tier.min;
  const divisionNum = Math.floor(positionInTier / divisionSize);
  const divisions = ["III", "II", "I"];
  const division = divisions[divisionNum];

  return {
    tier: tier.name,
    division: division,
    fullRank: `${tier.name} ${division}`,
    color: tier.color,
    mmr: mmr,
  };
}

// Example usage
console.log(getRankFromMMR(1320));
// { tier: 'Gold', division: 'I', fullRank: 'Gold I', color: '#FFD700', mmr: 1320 }
```

---

## Document History

| Version | Date        | Changes                       | Author         |
| ------- | ----------- | ----------------------------- | -------------- |
| 1.0     | Feb 5, 2026 | Initial specification created | GitHub Copilot |

---

**End of Specification Document**

_This document is a living specification and will be updated as features are implemented and refined based on player feedback._
