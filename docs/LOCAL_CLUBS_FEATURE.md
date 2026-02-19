# Local Clubs Feature Documentation

## Overview

The Local Clubs feature enables players to discover clubs, venues, and leagues in their area, as well as create and manage their own club pages. This feature is inspired by Scoreholio's "Find a Club" functionality.

**Key Difference from Scoreholio**: In Scoreholio, club creation is under the "Run a Tournament" tab. In Popdarts, both finding clubs and creating clubs are unified under the "Local" tab for better user experience.

---

## Feature Components

### 1. LocalScreen (src/screens/LocalScreen.js)

The main clubs discovery and management screen.

#### Features:

- **Search Clubs**: Search by club name, city, state, or description
- **Filter Options**:
  - All Clubs: Shows all publicly listed clubs
  - Favorites: Shows clubs the user has favorited (requires authentication)
  - My Clubs: Shows clubs owned by the current user (requires authentication)
- **Club Cards**: Display key club information
  - Club name and location
  - Description
  - Member count
  - Event count
  - Next scheduled event
- **Favorite System**: Users can favorite clubs for quick access
- **Guest Handling**: Prompts guest users to sign in for favorite/club creation features

#### Navigation:

- Tab: "Local" (icon: map-marker)
- Can navigate to:
  - CreateClubScreen: Create a new club
  - ClubDetailsScreen: View full club details (to be implemented)

---

### 2. CreateClubScreen (src/screens/CreateClubScreen.js)

Form for creating a new club page.

#### Form Fields:

**General Information** (Required: \*)

- Club Name \*
- Description (multiline)

**Location** (Required: \*)

- Address
- City \*
- State \*
- ZIP Code

**Contact Information**

- Contact Email (validated)
- Contact Phone
- Website URL (validated)
- Facebook URL (validated)
- Instagram URL (validated)

**Club Settings**

- List in "Find a Club" (toggle, default: ON)
- Public Club (toggle, default: ON)

#### Validation:

- Required fields enforced
- Email format validation
- URL format validation
- Real-time error display

#### User Flow:

1. User taps "Create Club Page" button on LocalScreen
2. Guest users are prompted to sign in
3. Authenticated users see the create club form
4. Form validates inputs in real-time
5. On submit, club is created in database
6. Success message shown
7. User navigated back to LocalScreen

---

## Database Schema

### Tables

#### clubs

Main table for club information.

| Column        | Type      | Description                |
| ------------- | --------- | -------------------------- |
| id            | UUID      | Primary key                |
| name          | TEXT      | Club name (required)       |
| description   | TEXT      | About the club             |
| logo_url      | TEXT      | Club logo (future feature) |
| address       | TEXT      | Street address             |
| city          | TEXT      | City                       |
| state         | TEXT      | State/Province             |
| zip_code      | TEXT      | Postal code                |
| country       | TEXT      | Country (default: USA)     |
| latitude      | DECIMAL   | Geolocation latitude       |
| longitude     | DECIMAL   | Geolocation longitude      |
| contact_email | TEXT      | Public contact email       |
| contact_phone | TEXT      | Public contact phone       |
| website_url   | TEXT      | Club website               |
| facebook_url  | TEXT      | Facebook page              |
| instagram_url | TEXT      | Instagram profile          |
| is_public     | BOOLEAN   | Visible to everyone        |
| is_listed     | BOOLEAN   | Show in search results     |
| owner_id      | UUID      | Club owner (FK to users)   |
| created_at    | TIMESTAMP | Creation timestamp         |
| updated_at    | TIMESTAMP | Last update timestamp      |

#### club_members

Tracks club memberships and favorites.

| Column       | Type      | Description              |
| ------------ | --------- | ------------------------ |
| id           | UUID      | Primary key              |
| club_id      | UUID      | FK to clubs              |
| user_id      | UUID      | FK to users              |
| is_favorite  | BOOLEAN   | User favorited this club |
| is_member    | BOOLEAN   | User is a member         |
| is_organizer | BOOLEAN   | User can manage events   |
| joined_at    | TIMESTAMP | When user joined         |
| updated_at   | TIMESTAMP | Last update              |

**Constraint**: Unique (club_id, user_id) - one membership record per user per club

#### club_events

Events hosted by clubs.

| Column                | Type      | Description                               |
| --------------------- | --------- | ----------------------------------------- |
| id                    | UUID      | Primary key                               |
| club_id               | UUID      | FK to clubs                               |
| title                 | TEXT      | Event name                                |
| description           | TEXT      | Event details                             |
| event_type            | TEXT      | 'league', 'tournament', 'casual', 'other' |
| start_time            | TIMESTAMP | Event start                               |
| end_time              | TIMESTAMP | Event end                                 |
| recurring_schedule    | TEXT      | Recurrence pattern                        |
| max_participants      | INTEGER   | Max player count                          |
| registration_required | BOOLEAN   | Requires signup                           |
| registration_deadline | TIMESTAMP | Signup deadline                           |
| created_by            | UUID      | FK to users                               |
| created_at            | TIMESTAMP | Creation timestamp                        |
| updated_at            | TIMESTAMP | Last update                               |

#### club_event_participants

Tracks event registrations.

| Column        | Type      | Description                                      |
| ------------- | --------- | ------------------------------------------------ |
| id            | UUID      | Primary key                                      |
| event_id      | UUID      | FK to club_events                                |
| user_id       | UUID      | FK to users                                      |
| status        | TEXT      | 'registered', 'attended', 'no-show', 'cancelled' |
| registered_at | TIMESTAMP | Registration time                                |
| updated_at    | TIMESTAMP | Last update                                      |

**Constraint**: Unique (event_id, user_id) - one registration per user per event

### Views

#### club_stats

Aggregated club statistics.

| Column          | Type      | Description                   |
| --------------- | --------- | ----------------------------- |
| id              | UUID      | Club ID                       |
| name            | TEXT      | Club name                     |
| member_count    | INTEGER   | Number of members             |
| favorite_count  | INTEGER   | Number of users who favorited |
| event_count     | INTEGER   | Total events                  |
| next_event_time | TIMESTAMP | Next upcoming event           |

---

## Row-Level Security (RLS) Policies

### clubs table

- **SELECT**: Everyone can read public clubs OR club owners can read their own
- **INSERT**: Authenticated users can create clubs (must be owner)
- **UPDATE**: Club owners can update their clubs
- **DELETE**: Club owners can delete their clubs

### club_members table

- **SELECT**: Everyone can read memberships
- **INSERT**: Users can add themselves to clubs
- **UPDATE**: Users can update their own membership
- **DELETE**: Users can remove themselves from clubs

### club_events table

- **SELECT**: Everyone can read events for public clubs
- **INSERT**: Club owners and organizers can create events
- **UPDATE**: Event creators can update their events
- **DELETE**: Event creators can delete their events

### club_event_participants table

- **SELECT**: Everyone can read participants
- **INSERT**: Users can register themselves for events
- **UPDATE**: Users can update their own registration
- **DELETE**: Users can cancel their own registration

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @react-navigation/stack
```

### 2. Run Database Migration

Execute `supabase-clubs-schema.sql` in your Supabase SQL Editor:

```sql
-- File: supabase-clubs-schema.sql
-- Run this after the main schema
```

### 3. Verify Navigation

The Local tab should now be functional with:

- LocalScreen as the main view
- CreateClubScreen accessible via "Create Club Page" button

---

## Future Enhancements

### Phase 2 (Planned)

- [ ] **ClubDetailsScreen**: Full club profile view with events list
- [ ] **ClubEditScreen**: Edit club information
- [ ] **Club Events**: Create and manage events
- [ ] **Event Registration**: Sign up for club events
- [ ] **Club Logo Upload**: Add custom club logos
- [ ] **Geolocation**: Distance-based search and sorting
- [ ] **Notifications**: Event reminders and club updates

### Phase 3 (Planned)

- [ ] **Club Chat**: Member messaging
- [ ] **Club Leaderboards**: Club-specific rankings
- [ ] **Club Tournaments**: Tournament integration
- [ ] **Club Analytics**: Attendance and engagement metrics
- [ ] **Verified Clubs**: Badge system for official clubs

---

## User Flows

### Find a Club

1. User taps "Local" tab
2. Sees list of all clubs in area
3. Can search by name, city, or state
4. Can filter by favorites or owned clubs
5. Taps club card to view details
6. Can favorite club for quick access

### Create a Club

1. User taps "Local" tab
2. Sees "Create Club Page" card at top
3. Taps "Create Club Page" button
4. If guest: prompted to sign in
5. If authenticated: sees create club form
6. Fills out required fields (name, city, state)
7. Optionally adds contact info and social links
8. Sets visibility preferences
9. Taps "Create Club" button
10. Club created and user returned to local screen
11. New club appears in "My Clubs" filter

### Favorite a Club

1. User viewing clubs on LocalScreen
2. Taps star icon on club card
3. If guest: prompted to sign in
4. If authenticated: club added to favorites
5. Club now appears in "Favorites" filter

---

## Testing Checklist

### LocalScreen

- [ ] Screen loads without errors
- [ ] All clubs displayed correctly
- [ ] Search filters clubs by name, city, state
- [ ] Filter tabs work (All, Favorites, My Clubs)
- [ ] Favorite button works for authenticated users
- [ ] Favorite button prompts sign-in for guests
- [ ] Create Club button navigates to CreateClubScreen
- [ ] Create Club button prompts sign-in for guests
- [ ] Empty states display appropriately
- [ ] Loading states work correctly
- [ ] Club stats display correctly

### CreateClubScreen

- [ ] Form displays all fields
- [ ] Required fields marked with \*
- [ ] Validation works for all fields
- [ ] Email validation works
- [ ] URL validation works
- [ ] Toggles work correctly
- [ ] Submit button creates club in database
- [ ] Success message shown after creation
- [ ] Navigation returns to LocalScreen
- [ ] New club appears in club list
- [ ] Cancel button works
- [ ] Loading overlay shown during submission

### Database

- [ ] Clubs table accepts all valid data
- [ ] RLS policies enforce correct permissions
- [ ] club_stats view calculates correctly
- [ ] Triggers update timestamps
- [ ] Foreign keys enforce referential integrity

---

## Known Limitations

1. **No Geolocation Yet**: Distance-based search not implemented
2. **No Logo Uploads**: Club logos require future implementation
3. **No ClubDetailsScreen**: Full club view not yet available
4. **No Events Management**: Event creation UI not implemented
5. **Basic Search**: Only text-based search, no filters for distance, event type, etc.

---

## Related Scoreholio Features

### Implemented ✅

- Search for clubs by name/location
- Add clubs to favorites
- Filter favorite clubs
- Create club page with general information
- Set club location
- Add contact information
- Set club visibility (public/listed)

### Not Yet Implemented ⏳

- Club page customization (logo, banner)
- Event scheduling and management
- Member management
- Club chat/messaging
- Tournament integration
- Club analytics and insights

---

## API Reference

### Supabase Queries Used

#### Load All Clubs

```javascript
const { data, error } = await supabase
  .from("clubs")
  .select(
    `
    *,
    club_stats (
      member_count,
      favorite_count,
      event_count,
      next_event_time
    )
  `,
  )
  .eq("is_listed", true)
  .order("name");
```

#### Load User Favorites

```javascript
const { data, error } = await supabase
  .from("club_members")
  .select("club_id, club:clubs(*)")
  .eq("user_id", user.id)
  .eq("is_favorite", true);
```

#### Toggle Favorite

```javascript
// Add favorite
const { error } = await supabase.from("club_members").upsert({
  club_id: clubId,
  user_id: user.id,
  is_favorite: true,
});

// Remove favorite
const { error } = await supabase
  .from("club_members")
  .delete()
  .eq("club_id", clubId)
  .eq("user_id", user.id);
```

#### Create Club

```javascript
const { data, error } = await supabase
  .from("clubs")
  .insert([
    {
      name: clubName,
      description: description,
      city: city,
      state: state,
      // ... other fields
      owner_id: user.id,
    },
  ])
  .select()
  .single();
```

---

## Changelog

### Version 1.0.0 (February 4, 2026)

- ✅ Initial implementation of Local Clubs feature
- ✅ LocalScreen with search and filtering
- ✅ CreateClubScreen with full form validation
- ✅ Database schema with clubs, members, events, and participants tables
- ✅ RLS policies for security
- ✅ Favorite clubs functionality
- ✅ Navigation integration with App.js
- ✅ Guest user handling with sign-in prompts

---

_This documentation reflects the current state of the Local Clubs feature. Updates will be made as new functionality is added._
