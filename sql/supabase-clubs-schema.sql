-- Popdarts App - Clubs Feature Schema
-- Run this in Supabase SQL Editor after the main schema

-- Clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  
  -- Location information
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact information
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  
  -- Club settings
  is_public BOOLEAN DEFAULT true,
  is_listed BOOLEAN DEFAULT true, -- Show in "Find a Club" search
  
  -- Ownership
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Club members table (for tracking favorites and membership)
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Member status
  is_favorite BOOLEAN DEFAULT false,
  is_member BOOLEAN DEFAULT false,
  is_organizer BOOLEAN DEFAULT false,
  
  -- Metadata
  joined_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique club-user pairs
  UNIQUE(club_id, user_id)
);

-- Club events table (for league nights, tournaments, etc.)
CREATE TABLE club_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  
  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('league', 'tournament', 'casual', 'other')),
  
  -- Schedule
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  recurring_schedule TEXT, -- e.g., "weekly", "bi-weekly", "monthly"
  
  -- Registration
  max_participants INTEGER,
  registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMP,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Club event participants table
CREATE TABLE club_event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES club_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no-show', 'cancelled')),
  
  -- Metadata
  registered_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique event-user pairs
  UNIQUE(event_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_clubs_owner ON clubs(owner_id);
CREATE INDEX idx_clubs_city_state ON clubs(city, state);
CREATE INDEX idx_clubs_is_listed ON clubs(is_listed) WHERE is_listed = true;
CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_favorites ON club_members(user_id) WHERE is_favorite = true;
CREATE INDEX idx_club_events_club ON club_events(club_id);
CREATE INDEX idx_club_events_start_time ON club_events(start_time);
CREATE INDEX idx_club_event_participants_event ON club_event_participants(event_id);
CREATE INDEX idx_club_event_participants_user ON club_event_participants(user_id);

-- View for club stats
CREATE OR REPLACE VIEW club_stats AS
SELECT
  c.id,
  c.name,
  COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.is_member = true) AS member_count,
  COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.is_favorite = true) AS favorite_count,
  COUNT(DISTINCT ce.id) AS event_count,
  MAX(ce.start_time) FILTER (WHERE ce.start_time > NOW()) AS next_event_time
FROM clubs c
LEFT JOIN club_members cm ON cm.club_id = c.id
LEFT JOIN club_events ce ON ce.club_id = c.id
GROUP BY c.id, c.name;

-- Updated_at trigger for clubs
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for club_members
CREATE TRIGGER update_club_members_updated_at
  BEFORE UPDATE ON club_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for club_events
CREATE TRIGGER update_club_events_updated_at
  BEFORE UPDATE ON club_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for club_event_participants
CREATE TRIGGER update_club_event_participants_updated_at
  BEFORE UPDATE ON club_event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row-level security (RLS)
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs table

-- Everyone can read public clubs
CREATE POLICY "Everyone can read public clubs"
  ON clubs FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

-- Authenticated users can create clubs
CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

-- Club owners can update their clubs
CREATE POLICY "Club owners can update their clubs"
  ON clubs FOR UPDATE
  USING (auth.uid() = owner_id);

-- Club owners can delete their clubs
CREATE POLICY "Club owners can delete their clubs"
  ON clubs FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for club_members table

-- Users can read all club memberships
CREATE POLICY "Users can read all club memberships"
  ON club_members FOR SELECT
  USING (true);

-- Users can add themselves to clubs
CREATE POLICY "Users can add themselves to clubs"
  ON club_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership
CREATE POLICY "Users can update their own membership"
  ON club_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can remove themselves from clubs
CREATE POLICY "Users can remove themselves from clubs"
  ON club_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for club_events table

-- Everyone can read events for public clubs
CREATE POLICY "Everyone can read club events"
  ON club_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = club_events.club_id 
      AND (clubs.is_public = true OR clubs.owner_id = auth.uid())
    )
  );

-- Club owners and organizers can create events
CREATE POLICY "Club owners and organizers can create events"
  ON club_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = club_events.club_id 
      AND clubs.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_events.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.is_organizer = true
    )
  );

-- Event creators can update their events
CREATE POLICY "Event creators can update events"
  ON club_events FOR UPDATE
  USING (auth.uid() = created_by);

-- Event creators can delete their events
CREATE POLICY "Event creators can delete events"
  ON club_events FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for club_event_participants table

-- Users can read all event participants
CREATE POLICY "Users can read event participants"
  ON club_event_participants FOR SELECT
  USING (true);

-- Users can register themselves for events
CREATE POLICY "Users can register for events"
  ON club_event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registration
CREATE POLICY "Users can update their registration"
  ON club_event_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can cancel their own registration
CREATE POLICY "Users can cancel their registration"
  ON club_event_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON clubs TO authenticated;
GRANT ALL ON club_members TO authenticated;
GRANT ALL ON club_events TO authenticated;
GRANT ALL ON club_event_participants TO authenticated;
GRANT SELECT ON club_stats TO authenticated, anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Popdarts clubs schema created successfully!';
  RAISE NOTICE 'Tables: clubs, club_members, club_events, club_event_participants';
  RAISE NOTICE 'Views: club_stats';
  RAISE NOTICE 'RLS policies: enabled';
END $$;
