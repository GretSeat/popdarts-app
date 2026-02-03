# Popdarts App - Change Log

## Recent Updates (February 3, 2026)

### ✅ Gradient Progress Bar - ACTUALLY FIXED NOW

**Issue:**
- At 1 point: Only seeing black (first color), no blue (second color) visible
- At 7 points: Mostly black, tiny bit of blue showing
- At 21 points: Finally seeing the full bright blue
- User wanted: Both colors visible at ALL score levels (1, 7, 21, etc.)

**Root Cause (REAL ONE):**
- The gradient was set to full screen width
- The clip container was only showing score percentage of that full-width gradient
- At 1 point (4.76% of screen), you only saw the leftmost 4.76% of the gradient
- This leftmost slice was almost entirely the first color - explaining why only black showed

**What User Actually Wanted:**
- Gradient should **fill the progress bar** (the scored area), not span the full screen
- At 1 point: small bar = 50% black, 50% blue
- At 11 points: medium bar = 50% black, 50% blue  
- At 21 points: full bar = 50% black, 50% blue
- The bar grows, showing the full gradient at every size

**Solution:**
- Removed fixed width from gradient completely
- Set `gradientFull` style to use `right: 0` instead of `width`
- Now gradient fills its parent container (`gradientClipContainer`)
- The container is already sized to score percentage
- Result: Gradient adapts to whatever size the scored area is = always 50/50 colors

**Files Updated:**
- `src/screens/NewMatchScreen.js`:
  - Removed Dimensions import (not needed)
  - Removed screenWidth constant (not needed)
  - Updated gradientFull style: `right: 0` instead of fixed width
  - Removed inline width override from both player gradients
- `src/components/DartColorManager.jsx`:
  - Updated gradient `locations` from `[0.33, 0.67]` to `[0, 1]`

---

## Previous Updates (January 2, 2026)

### ✅ UX Architecture Overhaul - Progressive Disclosure & Card-Based Design

**Design Philosophy:**

- Scoreholio-style, Popdarts-first mobile app
- No feature hiding - only deprioritization based on user preference
- Progressive disclosure through behavior-driven exposure
- Dark mode default with optimized clarity

**Welcome Screen Redesign:**

- **Natural Language Question**: "Do you see yourself being competitive, or mostly playing for fun with friends and family?"
- **NOT a permanent fork** - just a preference signal for:
  - Home screen emphasis
  - Default feature priority
  - Messaging and prompts
- **Two Options:**
  - **Playing for Fun 🎲**: Quick game access, stats/leagues available when wanted
  - **Being Competitive 🏆**: Emphasize stats, history, leagues (features unlock progressively)
- Clear messaging: "You'll have access to all features either way"
- Location permission note for competitive mode (local tournaments)
- Can change preference anytime in settings

**Home Screen Complete Redesign:**

- **Card-Based Architecture** answering "What should I do right now?"
- **Dark Mode Default** (#1A1A1A background)

**1. PRIMARY ACTION CARD** (Always Visible):

- Most prominent element at top
- Casual: "🎯 Quick Play - Jump into a game with friends"
- Competitive: "🏆 Start Match - Track your stats and compete"
- Large orange (#FF6B35) card with white button
- Instant navigation to Play screen

**2. CONTEXTUAL HIGHLIGHTS** (Max 2 Cards, Behavior-Driven):

- **Stats Unlock Prompt**: Shows after 5 games played
  - "📊 You've played X games! View your stats..."
  - Dismissible with X button
- **League Discovery**: Shows for competitive OR after 10 games
  - "🎯 Local League Nights - Find leagues near you"
  - "Coming Soon" badge
  - Dismissible
- **Guest Upgrade**: For guest users only
  - "⭐ Save Your Progress - Create account..."
  - Dismissible

**3. Progressive Exposure System:**

- Stats feature unlocks after 5 games
- League feature surfaces after 10 games (or immediately for competitive)
- Dismissed cards stored in AsyncStorage
- Features never hidden, only deprioritized

**4. Content Fatigue Prevention:**

- Max 2 contextual cards shown at once
- All cards dismissible (except primary action)
- Smart rotation based on user behavior
- No promotional spam

**Key Improvements:**

- Removed static stats dashboard from home
- Removed "Welcome back" greeting clutter
- Simplified to action-first design
- Contextual discovery instead of feature dump
- Trust-building through earned feature unlocking

### ✅ Major UI Overhaul & Welcome Screen

**Match Setup Screen Redesign:**

- **Match Type Selection** (Casual/Official):

  - Large buttons now take up ~50% of screen height each
  - Image placeholders added (📸 Image Coming Soon)
  - Vertically stacked for easy selection
  - Official mode shows "Coming Soon"

- **Edition Selection** (Classic/Board):

  - Same large button layout (~50% each)
  - Image placeholders for future product images
  - Board edition shows "Coming Soon"

- **Match Mode Selection** (1v1/2v2/Party):
  - Medium buttons (~33% screen height each)
  - Image placeholders on all options
  - 2v2 and Party show "Coming Soon"
  - Only 1v1 is currently active

**1v1 Lobby Redesign:**

- Vertically centered layout for better balance
- **Reordered Player Row** (left to right):
  1. **Profile Picture** (left): 👤 placeholder icon, rounded square (50x50px)
  2. **Player Name** (center): Text input field
  3. **Color Indicator** (right): Rounded square instead of circle
- Profile picture feature marked for future implementation
- Improved visual hierarchy and modern appearance

**Bottom Navigation Update:**

- New order: **Home | Store | Play | Local | Profile**
- Profile moved to rightmost position
- Store and Local remain grayed out (coming soon)
- Play button stays prominent in center

**Welcome Screen** (NEW):

- Shows on first app launch (or after logout)
- Asks: "How do you see yourself playing?"
- Two options:
  - **Casually 🎲**: Quick access to scoring, optimized for casual play
  - **Competitively 🏆**: Stats tracking, match history, league notifications
- Sets default experience based on choice
- Competitive mode includes privacy note about location permissions
- Can skip or change later in settings
- Preference saved to AsyncStorage

**Quick Score Cap:**

- Dart counts now capped at maximum of 3 per player
- - buttons disabled when reaching 3 darts
- Matches real-world Popdarts gameplay

### ✅ Quick Score Improvements & Pre-Game Flow

- **Fixed Quick Score Labels**:

  - Changed "Darts on board:" → "Darts Landed:"
  - Changed "Closest to bullseye:" → "Closest to Target Marker:"

- **Implemented Cancellation Scoring**:

  - Closest dart now worth 3 points total (1 for landing + 2 bonus)
  - Other darts worth 1 point each
  - Only winner gets net points (winner's score - loser's score)
  - Winner of round becomes first thrower for next round
  - If tied, no points awarded, first thrower stays same

- **Added Validation**:

  - Closest player buttons disabled/grayed out when that player has 0 darts landed
  - Prevents invalid closest selection

- **Added Stat Tracker Button**:

  - "Stat Tracker" button in Quick Score modal
  - Currently disabled with "COMING SOON" text
  - Will connect to Stat Track modal in future update

- **First Thrower Indication**:

  - Gold (#FFD700) border highlights current first thrower's half of screen
  - Updates after each round based on who won
  - Persists throughout match

- **Pre-Game Flow** (NEW):
  - Shows after "Continue to Match" button
  - **Step 1**: Reminder to flip coin or play Rock-Paper-Scissors
  - **Step 2**: Select winner of coin flip/RPS
  - **Step 3**: Winner chooses:
    - "Go First" → Winner throws first
    - "Choose Side" → Opponent throws first
  - Sets `firstThrower` state and proceeds to match with highlight

### ✅ Scoring Screen Gradient Update

- **Changed gradient ratio from smooth fade to 33/33/33 split**
  - First 33%: Primary color (solid)
  - Middle 33%: Gradient transition
  - Last 33%: Secondary color (solid)
  - Applied to both player 1 and player 2 score displays
  - Matches color picker gradient display for consistency

### ✅ Stat Track Dialog Redesign

- **Completely redesigned from list layout to grid layout**
  - **Dark Theme**: Black background (#000000) with white text
  - **Grid Layout**: 2 columns, 3 rows for 6 stats
  - **Title Section**: "Stat Track" heading with subtitle "Track the number of trick shots players achieve during the game"
  - **Player Name**: Displays which player's stats are being tracked
  - **Stats Tracked**:
    - Wiggle Nobbers
    - T-Nobbers
    - Fender Benders
    - Inch Worms
    - Lippies
    - Tower
  - **Controls**: Blue (#007AFF) +/- buttons with white text
  - **Save Button**: Large green (#4CAF50) with black text and black border, centered at bottom
  - **Removed**: Portal wrapper, replaced with native Modal for better performance

### ✅ Quick Score Feature Restored

- **Overlay Modal**: Dark semi-transparent background
- **Functionality**:
  - Enter dart count for each player
  - Select which player is closest to bullseye (gets +1 bonus point)
  - Quick apply scores without individual tapping
- **UI Design**:
  - Dark theme matching Stat Track
  - Blue +/- buttons for dart counts
  - Player selection buttons (highlights when selected)
  - Cancel (gray) and Apply (green) action buttons
- **Accessible via**: "QUICK SCORE" button on scoring screen

### ✅ Color Picker Behavior Updates

- **Player 1 (You)**:

  - Sees ALL 26 colors (not limited to owned)
  - Owned colors display green border and appear at top of list
  - Can select any color (owned or not)
  - Auto-fills with home favorite color on match start
  - Taken colors show dark overlay + "TAKEN" (disabled)

- **Player 2 (Opponent)**:

  - Sees ALL 26 colors
  - NO green borders (doesn't show your ownership)
  - Can select any color except taken ones
  - No default color selected (must choose manually)
  - Taken colors show dark overlay + "TAKEN" (disabled)

- **Border System**:

  - Gray (#888888): Default unselected
  - Green (#4CAF50, 3px): Owned by you (Player 1 only)
  - Blue (#007AFF, 4px): Currently selected
  - Dark Blue (#1A237E, 3px) + overlay: Taken by other player (disabled)

- **Player 2 Color Initialization**:
  - Starts with `null` color (gray placeholder)
  - Must select color before starting match
  - Prevents automatic color assignment that could conflict with Player 1

### ✅ Profile Color Management

- **Dart Color Manager Modal**:
  - Three modes: Own, Home Fav, Away Fav
  - Mark which colors you own
  - Set home and away favorite colors
  - Favorites auto-apply in casual matches
  - Dark theme (future: could match app theme)
- **Favorite Color Filtering**:
  - Home/Away favorite modes now only show colors you've marked as owned
  - Prevents favoriting colors you don't physically own
  - Cleaner UI when selecting favorites

---

## Implementation Notes

### Technical Changes

1. **Removed react-native-paper Portal**: Replaced with native React Native Modal for better performance
2. **Gradient locations prop**: Added `locations={[0.33, 0.67]}` to all LinearGradient components in scoring
3. **TouchableOpacity buttons**: Replaced IconButton with custom TouchableOpacity for better styling control
4. **Modal transparency**: Used `transparent` prop with custom overlay views for proper dark backgrounds
5. **Grid layout**: Used flexWrap and percentage widths for responsive 2-column grid

### Future Features (Not Yet Implemented)

- Different scoring layouts for 2v2 and party modes
- Replace gradient representations with actual popdart images
- Tournament features with QR code player profiles
- Player history / recently played matches
- Save match results to database

### Developer Notes

- **Documentation Policy**: All major changes MUST be documented in this file immediately after implementation
- **Update Process**: When implementing features from user requests:
  1. Implement the feature
  2. Test thoroughly
  3. Update CHANGE_LOG.md with details
  4. Update any relevant instruction files
  5. Commit with descriptive message
- **Code Organization**:
  - All game logic in Redux slice (gameSlice.js) - NOT YET IMPLEMENTED, currently in component state
  - UI components are presentational
  - Color constants in colors.js
  - Player preferences in PlayerPreferencesContext.js

---

## Version History

### v1.0.0 (MVP)

- Fullscreen 50/50 split scoring interface
- Progressive gradient fill (width-based, 0-21 points)
- Color picker with 26 Popdarts colors
- Player profile with color ownership and favorites
- Stat tracking for trick shots
- Quick scoring overlay
- Back confirmation dialog
- Victory screen

---

## Current Status

**Working Features**:

- ✅ Fullscreen 1v1 scoring
- ✅ Progressive gradient display (33/33/33 ratio)
- ✅ Color selection with ownership tracking
- ✅ Favorite color auto-selection for Player 1
- ✅ Stat tracking with dark grid UI
- ✅ Quick score overlay
- ✅ Color taken/disabled system
- ✅ Player preferences persistence (AsyncStorage)

**In Progress**:

- 🚧 2v2 mode scoring layout
- 🚧 Party mode scoring layout (3+ players)

**Planned**:

- 📋 Replace gradients with actual popdart images
- 📋 Tournament mode
- 📋 Match history
- 📋 Player stats over time
- 📋 QR code player profiles
