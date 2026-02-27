# Popdarts App - AI Coding Agent Instructions

## Project Overview

**Popdarts App** is a React Native mobile scoring application for competitive Popdarts matches. It uses **Expo** for cross-platform support, **Supabase** for backend/auth, and **React Navigation** for a tab-based UI. The app supports multiple game modes (1v1, 2v2, tournaments), player profiles, match history, ELO ranking, and push notifications.

**Tech Stack**: React Native 0.81 + Expo 54 + Supabase + React Navigation + Expo Linear Gradient

---

## Critical Architecture Patterns

### 1. **Context API State Management**

- **AuthContext** (`src/contexts/AuthContext.js`): Manages user sessions, guest mode, and push token registration
  - Custom hook: `useAuth()` - Use this in any component needing auth state
  - Handles OAuth callbacks, persistent sessions via AsyncStorage
  - Registers push tokens on signup/login
- **PlayerPreferencesContext** (`src/contexts/PlayerPreferencesContext.js`): Tracks user preferences (colors, tracking mode)

→ **Pattern**: Always wrap providers in App.js → Always use hooks to access context, never import context directly

### 2. **Supabase Integration**

- Client initialized in `src/lib/supabase.js` with AsyncStorage persistence
- **RLS Policies** enforced server-side for row-level security
- Tables: `users` (profiles), `matches` (scored games), `push_tokens`, `notification_logs`, `clubs`, `club_members`
- **Key pattern**: Auth state changes trigger DB lookups; use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars

→ **Action**: Always check `.env` exists before running; Supabase setup SQL files in `sql/` folder

### 3. **Navigation Structure** (App.js)

- Bottom Tab Navigator: Home, Matches, New Match, (Local/Store), Profile
- Stack Navigators for sub-flows (Local tab has LocalHome → CreateClub nested stacks)
- Linking config for web URLs: `https://popdarts.expo.app` and `popdarts://`

→ **Pattern**: Tab screens are top-level; use Stack.Navigator for modal-like UX within tabs

---

## React Native / Expo Clean Code Standards

All code in this project must strictly adhere to these architectural rules for maintainability, scalability, and clarity.

### 1. Screen Responsibilities

**Screens are orchestration layers only.**

#### A Screen MUST:

- Compose and arrange components
- Connect navigation (navigation props)
- Consume context/hooks (`useAuth()`, `usePlayerPreferences()`)
- Arrange screen layout (flex, padding, spacing)

#### A Screen MUST NOT:

- Contain large JSX blocks (>100 lines total)
- Define reusable components inline
- Define modal components inline
- Contain business logic
- Contain constants (magic strings/numbers)
- Handle complex state logic independently

**Example Structure:**

```javascript
export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScreenContainer>
      <Header user={user} />
      <ContentSection />
      <ActionBar onPress={() => navigation.navigate("Matches")} />
    </ScreenContainer>
  );
}
```

### 2. Strict Folder Structure

```
src/
  /components
    /ui           # Reusable UI components
    /modals       # Modal components (PreGameModal, etc.)
    /forms        # Form components
    /layout       # Layout wrappers & containers
  /screens        # Full-screen components (NewMatchScreen, etc.)
  /context        # Global state (AuthContext, etc.)
  /hooks          # Custom hooks (useMatchState, etc.)
  /constants      # All constants & enums
  /utils          # Pure helper functions
  /services       # API, external logic, notifications
  /styles         # StyleSheets & theme
  /lib            # Third-party client initialization
```

**Rule**: If something doesn't fit neatly into one of these folders, create a new subfolder or reconsider the component's responsibility.

### 3. Component Rules

All components must follow Single Responsibility Principle (SRP):

- **Single Responsibility**: Component does ONE thing well
- **Small & Focused**: <100 lines of JSX when possible
- **Reusable where possible**: Accept data via props, not hardcoded
- **No hidden dependencies**: All dependencies passed as props
- **No business logic**: Pure presentation + state management only

**JSX Extraction Rule**: If JSX exceeds ~50 lines, extract subcomponents into separate files.

**Anti-pattern:**

```javascript
// DON'T: Component with mixed concerns
function ScoreCard() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    // API call + complex logic
  }, []);

  return <View>{/* 80 lines of JSX */}</View>;
}
```

**Pattern:**

```javascript
// Components/ui/ScoreCard.jsx
export function ScoreCard({ matches }) {
  return <View>{/* 30 lines of UI */}</View>;
}

// Hooks/useMatches.js
export function useMatches() {
  const [matches, setMatches] = useState([]);
  useEffect(() => {
    /* logic */
  }, []);
  return matches;
}

// Screen/HomeScreen.js
const matches = useMatches();
return <ScoreCard matches={matches} />;
```

### 4. Modal Rules

Modals are special components with strict rules:

#### Modals MUST:

- Live in `/components/modals/`
- Be standalone, reusable components
- Accept `visible`, `onClose`, and data via props
- Never be defined inline inside screens

#### Modals MUST NOT:

- Import the screen that uses them
- Manage global state creation
- Navigate between screens

**Pattern:**

```javascript
// /components/modals/ConfirmScoringModal.jsx
export default function ConfirmScoringModal({ visible, onClose, score }) {
  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <Text>Confirm score: {score}</Text>
      <Button onPress={onClose} title="Confirm" />
    </Modal>
  );
}

// /screens/ScoringScreen.js
export default function ScoringScreen() {
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setIsConfirmVisible(true)} title="Submit Score" />
      <ConfirmScoringModal
        visible={isConfirmVisible}
        onClose={() => setIsConfirmVisible(false)}
        score={currentScore}
      />
    </>
  );
}
```

### 5. Constants

**NO magic numbers. NO inline strings. NO inline theme values.**

All constants belong in `/constants/`:

```
/constants
  colors.js        # Color palette & theme
  layout.js        # Spacing, dimensions, borders
  routes.js        # Navigation route names
  gameRules.js     # Game-specific constants
  messages.js      # UI text strings
```

**Pattern:**

```javascript
// ✅ GOOD
import { COLORS } from "../constants/colors";
import { SPACING, BORDER_RADIUS } from "../constants/layout";

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
});

// ❌ BAD
const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#1E88E5",
  },
});
```

### 6. Business Logic Separation

**Keep screens and UI clean by extracting logic:**

- **Data Transformation** → `/utils` (pure functions)
- **API Calls** → `/services` (async logic)
- **Complex State** → custom hooks in `/hooks`
- **Global State** → `/context` (AuthContext, PreferencesContext)

**Pattern:**

```javascript
// /utils/scoringCalculations.js - Pure function
export function calculateRoundScore(darts) {
  return darts.reduce((sum, val) => sum + val, 0);
}

// /services/matchService.js - API calls
export async function submitMatch(matchData) {
  const response = await supabase.from('matches').insert(matchData);
  return response.data;
}

// /hooks/useMatchLogic.js - Complex state logic
export function useMatchLogic(matchId) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(501);

  const subtractScore = useCallback((value) => {
    setScore(prev => Math.max(0, prev - value));
  }, []);

  return { currentRound, score, subtractScore };
}

// /screens/NewMatchScreen.js - Only orchestration
export default function NewMatchScreen() {
  const { currentRound, score, subtractScore } = useMatchLogic(matchId);

  return (
    <ScoringDisplay score={score} />
    <DartInput onDartEntered={subtractScore} />
  );
}
```

### 7. Custom Hooks

Extract reusable or state-heavy logic into custom hooks in `/hooks`:

#### Hooks MUST:

- Contain no JSX/rendering logic
- Be prefixed with `use` (e.g., `useMatchState`)
- Have clear, single responsibility
- Be documented with JSDoc

#### Hooks can:

- Use `useState`, `useEffect`, `useCallback`, `useContext`
- Call services or utilities
- Return state + methods as object

**Pattern:**

```javascript
// /hooks/useMatchState.js
/**
 * Manages match state, scoring, and turn logic
 * @param {number} matchId - The match identifier
 * @returns {Object} state and handlers
 */
export function useMatchState(matchId) {
  const [score, setScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(0);

  const scoreRound = useCallback((roundScore) => {
    setScore((prev) => prev + roundScore);
  }, []);

  return { score, currentPlayer, scoreRound };
}
```

### 8. Clean Code Standards

Always follow these principles:

1. **Single Responsibility Principle**: One reason to change
2. **Small Functions**: <30 lines when possible; early returns
3. **Avoid Nesting**: Max 2–3 levels deep
4. **No Anonymous Functions**: Define named functions or use `useCallback`
5. **Destructuring**: Extract props/state destructuring at top of function
6. **Descriptive Names**: `handleScoreSubmit` not `handleClick`
7. **Type Safety**: Use PropTypes or TypeScript interfaces
8. **DRY**: Don't repeat yourself; extract duplicated logic

**Anti-pattern:**

```javascript
function Dashboard() {
  const [data, setData] = useState(null);

  return (
    <View>
      {data?.matches?.map((match) => (
        <TouchableOpacity
          onPress={() => {
            const newScore = match.score + 10;
            setData({
              ...data,
              matches: data.matches.map((m) =>
                m.id === match.id ? { ...m, score: newScore } : m,
              ),
            });
          }}
        >
          {/* JSX */}
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

**Pattern:**

```javascript
// /utils/matchHelpers.js
export function updateMatchScore(matches, matchId, scoreIncrement) {
  return matches.map((m) =>
    m.id === matchId ? { ...m, score: m.score + scoreIncrement } : m,
  );
}

// /components/ui/MatchCard.jsx
function MatchCard({ match, onScoreUpdate }) {
  const handlePress = () => onScoreUpdate(match.id, 10);
  return <TouchableOpacity onPress={handlePress}>...</TouchableOpacity>;
}

// /screens/DashboardScreen.js
function Dashboard() {
  const [data, setData] = useState(null);

  const handleScoreUpdate = (matchId, increment) => {
    const updated = updateMatchScore(data.matches, matchId, increment);
    setData((prev) => ({ ...prev, matches: updated }));
  };

  return (
    <View>
      {data?.matches?.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onScoreUpdate={handleScoreUpdate}
        />
      ))}
    </View>
  );
}
```

### 9. Composition Over Complexity

Prefer composing small, focused components over creating monolithic screens:

**Anti-pattern:**

```javascript
// 300+ lines in a single screen
export default function NewMatchScreen() {
  return (
    <View>
      {/* Header logic, styling */}
      {/* Player setup logic */}
      {/* Scoring interface */}
      {/* Results modal */}
      {/* All mixed together */}
    </View>
  );
}
```

**Pattern:**

```javascript
export default function NewMatchScreen() {
  return (
    <ScreenContainer>
      <MatchHeader />
      <PlayerSetup />
      <ScoringInterface />
      <MatchResultsModal />
    </ScreenContainer>
  );
}
```

### 10. When in Doubt: Extract

If any code block:

- Can be reused across components
- Exceeds 30–50 lines
- Has its own state
- Has its own UI structure
- Handles a distinct feature/responsibility

**Extract it into its own component.**

**Rule of thumb**: If you're thinking "this might be reusable," extract it now. You can always inline later if needed, but refactoring large files is tedious.

---

## Developer Workflows

### Setup & Run

```bash
npm install                    # Install dependencies
cp .env.example .env           # Copy template and add Supabase credentials
npm start                      # Start Expo dev server
npm run android|ios|web        # Platform-specific builds
npm start --clear              # Clear cache if changes not reflecting
```

### Database Operations

1. **View schema**: Supabase Dashboard → Table Editor
2. **Run migrations**: SQL Editor → paste from `sql/*.sql` → Run
3. **Check auth users**: Authentication → See all users

### Push Notifications Setup

- Requires physical device (not emulator)
- Run `supabase-push-notifications-schema.sql` for tables
- Android: Configure Firebase → `google-services.json` in root
- iOS: Configure APNs via `eas credentials`
- Service: `src/services/pushNotificationService.js` (350+ lines)

### Component Extraction Pattern

NewMatchScreen.js is 7200+ lines. Use this pattern for extraction:

- **Pure utilities** → `src/utils/` (scoringCalculations.js, tournamentBracket.js, colorUtils.js)
- **Modal components** → `src/components/modals/` (PreGameModal.jsx, MatchResultsModal.jsx)
- **Views** → `src/views/` (planned: TournamentBracketView, SimplifiedScoringView for large sections)
- Keep state in screen, pass as props or via context

---

## Key File Reference

| Purpose                               | File                                       | Notes                                                          |
| ------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Root navigation, theme, providers     | `App.js`                                   | Theme defined here; add new screens/tabs here                  |
| Auth state, session mgmt, push tokens | `src/contexts/AuthContext.js`              | Always use `useAuth()` hook to access                          |
| User preferences persistence          | `src/contexts/PlayerPreferencesContext.js` | Stores chosen colors, tracking mode                            |
| Supabase client config                | `src/lib/supabase.js`                      | AsyncStorage-backed persistence                                |
| Scoring logic (pure functions)        | `src/utils/scoringCalculations.js`         | calculateRoundScore(), calculateDartValue()                    |
| Tournament bracket generation         | `src/utils/tournamentBracket.js`           | generateBracket(), advanceTournamentWinner()                   |
| Color utilities                       | `src/utils/colorUtils.js`                  | getColorLuminance(), getContrastingTextColor()                 |
| Main scoring UI (7200 lines)          | `src/screens/NewMatchScreen.js`            | **TODO: Extract views/modals further**                         |
| Modal components                      | `src/components/modals/`                   | PreGameModal, MatchResultsModal                                |
| Push notifications                    | `src/services/pushNotificationService.js`  | registerForPushNotificationsAsync(), savePushTokenToDatabase() |
| Styling for NewMatchScreen            | `src/styles/newMatchScreen.styles.js`      | All StyleSheets defined here                                   |
| Database schema SQL                   | `sql/*.sql`                                | Run in Supabase dashboard                                      |

---

## Project-Specific Conventions

**These conventions build on the React Native / Expo Clean Code Standards above. Always apply both.**

### Naming & Structure

- **Screens**: `SrcScreen.js` (e.g., `NewMatchScreen.js`, `ProfileScreen.js`)
- **Modals**: `ComponentNameModal.jsx` in `src/components/modals/`
- **Utilities**: Pure functions in `src/utils/` with descriptive names
- **Contexts**: `NameContext.js` with custom hook `useName()`
- **Components**: Reusable UI in `src/components/` (e.g., `PartyVanillaSprinkles.jsx`)

### Import Patterns

```javascript
// Contexts
import { useAuth } from "../contexts/AuthContext";
import { usePlayerPreferences } from "../contexts/PlayerPreferencesContext";

// Utils (pure functions)
import { calculateRoundScore } from "../utils/scoringCalculations";
import { generateBracket } from "../utils/tournamentBracket";

// Services
import { registerForPushNotificationsAsync } from "../services/pushNotificationService";

// Modals
import PreGameModal from "../components/modals/PreGameModal";

// Config
import { POPDARTS_COLORS } from "../constants/colors";
```

### React Native Paper Component Pattern

Most UI uses React Native Paper (Material Design). Access theme and components:

```javascript
import { useTheme, Button, TextInput, Chip } from "react-native-paper";
const theme = useTheme();
// Use theme.colors.primary, etc.
```

### State & Lifecycle

- Use `useState` for local state, Context API for global state
- Use `useFocusEffect` from React Navigation when screen needs to refresh on focus
- Use `useRef` for animation values, scroll positions
- AsyncStorage operations: Always await and error-handle

---

## Critical Game Mechanics

### Match Scoring

- **Round-based**: Each round scores independently (dart values: 1-20 per dart, max ~100/round)
- **Win condition**: First to 501 (classic Darts) or tournament-specific rules
- **Scoring calculation**: `calculateRoundScore()` validates dart values (1-20, no 0)
- **Specialty shots**: Lippy, Wiggle Nobber, T-Nobber, Tower, Fender Bender, Inch Worm (tracked separately)

### Match Types

- **Casual**: No ranking impact, for fun
- **Official**: Ranked matches affecting ELO (draft spec in `SUPABASE_SETUP.md`)
- **Editions**: Classic vs. Board variants
- **Formats**: Single (1v1) or Tournament (bracket-based)
- **Modes**: 1v1, 2v2, Party

### Tournament System

- Brackets generated via `generateBracket()` → converted to seeds format
- Winners advanced with `advanceTournamentWinner()`
- Use `convertToSeedsFormat()` for bracket display

### Push Notifications

- Types: Store updates, flash sales, leagues nearby, tournament turns, match reminders, club announcements
- Tokens stored in `push_tokens` table with user preferences
- Auto-registered on signup; can be toggled in Profile settings
- Requires physical device (FCM token on Android, APNS on iOS)

---

## Common Gotchas & Solutions

| Issue                              | Why                                 | Solution                                                        |
| ---------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| `.env` missing → "Failed to fetch" | Supabase credentials not found      | Create `.env` from `.env.example` and add real Supabase URL/key |
| Changes not showing                | Expo cache stale                    | Run `npm start --clear`                                         |
| Push tokens not working            | Only works on physical device       | Use physical device or configure emulator; FCM for Android      |
| AsyncStorage not persisting        | Auth provider not wrapping children | Check App.js has AuthProvider at root level                     |
| State undefined after navigate     | Context not accessible in screen    | Ensure screen wrapped in AuthProvider; use `useAuth()` hook     |
| New Match Screen very slow         | 7200 lines + complex state          | Extract views/modals (see src/REFACTORING_GUIDE.md)             |

---

## Deployment & Testing

### Local Testing

```bash
npm start
# Scan QR with Expo Go (iOS) or enter URL in Expo app (Android)
```

### Platforms

- **iOS**: Run via `npm run ios` on macOS with simulator, or physical device with Expo Go
- **Android**: Run via `npm run android` with emulator/device, or physical device with Expo Go
- **Web**: Run via `npm run web` for quick browser testing (limited features)

### Build for Production

Use EAS CLI (Expo App Services):

```bash
eas build --platform ios  # or android
eas update               # Push updates to production
```

---

## Roadmap & Future Work

### Implemented ✅

- Authentication (email/password + OAuth + guest mode)
- Match scoring (1v1, 2v2, tournaments)
- Match history and stats
- Player profiles with color customization
- Push notifications
- Local clubs feature
- Navigation structure

### Planned (See `SUPABASE_SETUP.md`, `ELO_RANKING_SYSTEM_SPEC.md`)

- ELO ranking system with tier badges
- Seasonal rewards and achievements
- Global & regional leaderboards
- Tournament organizer features
- Advanced stats (win streaks, head-to-head records)

---

## Before You Code

**Read this FIRST:** Review the "React Native / Expo Clean Code Standards" section above before coding.

1. **Follow Clean Code Standards** (above) - Non-negotiable for this project
   - Screens are orchestration only
   - No inline components, modals, or business logic
   - Extract reusable code immediately
2. **Always check** if context/utils you need already exist (grep for function names)
3. **Follow folder structure strictly**: Components → /components/ui, /components/modals, etc. Constants → /constants, etc.
4. **Follow extraction pattern**: Large files → split into utils + modals + views
5. **Test in browser first** (`npm run web`) for quick iteration
6. **Use simulator for notifications only after** running push schema SQL
7. **Document new utilities** with JSDoc (function purpose, params, returns)
8. **Check REFACTORING_GUIDE.md** for planned extractions before creating components
