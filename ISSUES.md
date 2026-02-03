# Known Issues & Future Fixes

This document tracks bugs, UI issues, and features that need improvement but are not blocking current development.

---

## ✅ Recently Resolved

### Gradient Colors Not Visible at Low Score Values

**Priority:** High  
**Status:** RESOLVED ✅  
**Date Added:** February 3, 2026  
**Date Resolved:** February 3, 2026

**Problem:**  
When using gradient dart colors during scoring, players could not see both colors at low point values. At 1 point, only the first color was visible (e.g., only black with no blue). The second color only became visible around 7 points, and the full gradient wasn't visible until 21 points.

**User Expectation:**  
Both colors should be visible at ALL score levels (1, 7, 21, etc.) with a 50/50 distribution. The progress bar should grow while maintaining the full gradient at any size.

**Root Cause:**  
The gradient was configured to fill its container, but the container had no proper width constraint. This caused the gradient to either:
1. Use a fixed width (1000px) showing only a tiny slice at low scores
2. Span the full screen showing only a cross-section at low scores

Neither approach made the gradient fill the progress bar itself.

**Solution Implemented:**

1. **Updated gradient style** to fill container with `right: 0` instead of fixed width
2. **Updated gradient locations** from `[0.33, 0.67]` to `[0, 1]` for full color range
3. **Removed width constraints** allowing gradient to adapt to progress bar size
4. **Container sizing** already handled by `gradientClipContainer` with score percentage

**Technical Details:**

- `gradientClipContainer` sets width based on score: `{ width: \`\${(playerScore / 21) * 100}%\` }`
- `gradientFull` now uses `position: absolute` with `left: 0` and `right: 0`
- Gradient fills whatever size the container is (1 point = small bar, 21 points = full bar)
- Both colors always display in 50/50 proportion

**Result:**  
✅ At 1 point: Small progress bar shows 50% color 1, 50% color 2  
✅ At 11 points: Medium progress bar shows 50% color 1, 50% color 2  
✅ At 21 points: Full progress bar shows 50% color 1, 50% color 2  
✅ Progress bar grows smoothly while maintaining full gradient visibility

---

### Tournament Bracket - Connector Line Alignment & Positioning

**Priority:** Medium  
**Status:** RESOLVED ✅  
**Date Added:** January 7, 2026  
**Date Resolved:** January 8, 2026

**Problem:**  
Tournament bracket connector lines were not aligning properly with match cards, and subsequent round matches were not positioned at the visual midpoint between their source matches.

**Issues Identified:**

1. **Lines coming from wrong position:** Lines originated from top of cards instead of center
2. **Connector lines going wrong direction:** Lines connected to right side of next match instead of left side
3. **Fixed grid positioning:** Matches positioned using mathematical grid (matchHeight × spacing) but actual card heights varied (93px, 122px, 89px, etc.)
4. **SVG coordinate system:** Position tracking wasn't accounting for ScrollView padding and round title offsets correctly
5. **Touch blocking:** SVG overlay was blocking touches on match cards

**Root Causes:**

- onLayout position tracking was relative to parent container, not absolute
- Y position calculations added offsets incorrectly (double-counting padding)
- Grid formula used fixed matchHeight but actual cards varied based on content ("Tap to Play" text, player names length)
- Next round matches positioned at arbitrary grid points instead of junction midpoints

**Solution Implemented:**

1. **Calculated round X offsets:** Each round positioned at `roundIndex * (cardWidth + connectorWidth)`
2. **Used pre-calculated centerY:** Stored during onLayout instead of recalculating with wrong offsets
3. **Dynamic Y positioning:** Subsequent rounds positioned based on actual measured source match positions:
   ```javascript
   const junctionY = (pos1.centerY + pos2.centerY) / 2;
   yPosition = junctionY - estimatedHalfHeight;
   ```
4. **Adaptive height estimation:** Uses actual measured card height from previous render (or 60px default)
5. **Fixed SVG touch blocking:** Changed to `pointerEvents="box-none"` with `zIndex: -1`
6. **Three-segment path drawing:**
   - Horizontal from match → vertical junction
   - Separate horizontal from match2 → junction
   - Right-angle path from junction → next match (horizontal then vertical)

**Technical Details:**

- **Position tracking:** onLayout stores {x, y, width, height, centerY, roundIndex}
- **SVG coordinates:** Add scrollPadding (20) and roundTitleHeight (35) to centerY
- **Convergence:** First render uses grid + estimate, re-render uses measured heights for perfect alignment
- **Spacing adjusted:** matchHeight=150, matchGap=50 for better initial approximation

**Result:**  
✅ Lines extend from center of match cards  
✅ Lines connect to left center of next round matches  
✅ All right-angle connectors (no diagonal lines)  
✅ Subsequent rounds perfectly centered at junction midpoints  
✅ Touch interactions work properly  
✅ Visual alignment converges after one re-render

---

## 🐛 Known Bugs

### Tournament Bracket - Back Button Loses Player State

**Priority:** Medium  
**Status:** Open  
**Date Added:** January 8, 2026

**Description:**  
When viewing a tournament bracket and pressing the back button, the user is returned to tournament setup but all players are cleared. The setup screen shows "Add players to continue" instead of preserving the existing tournament configuration.

**Current Behavior:**

- User creates tournament with players
- Views bracket
- Presses back button
- Returns to setup screen with no players shown
- Must re-add all players to see bracket again

**Expected Behavior:**  
Back button should return to tournament setup with all players, settings, and tournament state preserved, allowing user to add/remove players or view bracket again without starting over.

**Technical Notes:**

- `tournamentPlayers` state is cleared when navigating back
- Need to preserve tournament configuration when returning to setup
- Should maintain full state: players, tournament size, bracket structure, completed matches

**Impact:** Moderate - prevents users from easily modifying tournament after viewing bracket

---

### Tournament Setup - Player List UI Scalability

**Priority:** Low  
**Status:** Open  
**Date Added:** January 8, 2026

**Description:**  
Tournament setup player list uses large card sizes that cause players to disappear off-screen when more than ~6 players are added. Should support 10+ visible players with better layout.

**Current Behavior:**

- Player cards are large (similar to match lobby size)
- Around 6 players, cards scroll off screen
- Difficult to see full player list for larger tournaments

**Expected Behavior:**

- Use compact player list layout (like 1v1 lobby)
- Show player profile picture, name, and color selector in condensed format
- Support viewing 10+ players on screen at once
- Maintain scrollability for tournaments with 16+ players

**Design Notes:**

- Reference 1v1 lobby player card layout (horizontal compact style)
- Reduce vertical spacing between players
- Smaller profile pictures and color selectors
- Consider two-column layout for even more density

**Impact:** Low - cosmetic issue, doesn't block functionality

---

## 📋 Future Enhancements

### Tournament Features

- [ ] Add tournament champion celebration screen
- [ ] Show tournament statistics (total games, highest score, etc.)
- [ ] Export tournament results
- [ ] Save tournament brackets for later viewing
- [ ] Add double elimination bracket option

### UI/UX Improvements

- [ ] Add pinch-to-zoom for bracket view
- [ ] Improve bracket scrolling on smaller devices
- [ ] Add animations when winners advance to next round
- [ ] Better mobile landscape mode support

---

## 🎯 Scoreholio Feature Parity Roadmap

### Core Features

- [ ] Dark Mode
- [ ] Notification Center

### Troubleshooting & Support

- [ ] Fixing a Score Error
- [ ] Supported Devices
- [ ] WiFi and Hotspots
- [ ] Fixing - Changing Team Generation

### Player Profile System

- [ ] Account Setup
- [ ] SPR+ (Premium Rating System)
- [ ] SPR (Scoreholio Player Rating)
- [ ] Scouting Report and Compare
- [ ] Game History and Charts
- [ ] Bag/Tag Breakdown
- [ ] Global and Club Rankings
- [ ] Practice Tab
- [ ] Editing Profile

### Find & Discover

- [ ] Search for a Tournament
- [ ] Share a Tournament
- [ ] Organizer Contact Information
- [ ] Find a Club
- [ ] Search for a Club
- [ ] Create Your Club Page

### Tournament Planning

- [ ] Tournament Calculator
- [ ] Tournament Formats
- [ ] Team Generation
- [ ] Running a Weekly League
- [ ] Types of Weekly Leagues
- [ ] Best Of - Must Play Set Schedule
- [ ] Set Schedule Switcholio
- [ ] Switcholio/Blind Draw League
- [ ] Scoreholio Seasons

### Run a Tournament

- [ ] Creating a Tournament
- [ ] Editing a Tournament
- [ ] Tournament Templates
- [ ] Promotional Alerts
- [ ] Cloning a Tournament
- [ ] Editing Organizer Profile
- [ ] Organizer Assist

### Adding Teams & Registration

- [ ] Pre-registration/Prepay
- [ ] Scan QR codes
- [ ] Mass Import Spreadsheet
- [ ] Manually Add Players
- [ ] Waitlist
- [ ] Restrictions
- [ ] Self-Checkin Alert
- [ ] Standardize Names

### Tournament Admin

- [ ] Manage Courts
- [ ] Court Blocking
- [ ] Import Button
- [ ] Pause Button
- [ ] Additional Brackets
- [ ] Bracket Control
- [ ] Best Of
- [ ] Split Tournament
- [ ] Split Brackets
- [ ] Starting a Tournament
- [ ] Stats and Logs

### Scoreholio Seasons

- [ ] What is Scoreholio Seasons
- [ ] Getting Started
- [ ] Season Setup
- [ ] Season Options
- [ ] Organizers
- [ ] Tournaments
- [ ] Memberships
- [ ] Player Rankings
- [ ] Submitting a Tournament to a Season
- [ ] Seeding a Tournament based on Season Points
- [ ] Season Ratings

### Scoreboards and Dashboards

- [ ] ScoreMagic
- [ ] Free Play Scoreboard
- [ ] Player Scoring
- [ ] Tablet Scoreboards
- [ ] Kiosk Mode
- [ ] Remote Mode
- [ ] Dashboard on TV
- [ ] Live Streaming

---

## 💡 Notes

- This file should be updated whenever a known issue is discovered but deferred
- Issues should be moved to GitHub Issues when prioritized for active development
- Mark items as resolved with ~~strikethrough~~ and resolution date
