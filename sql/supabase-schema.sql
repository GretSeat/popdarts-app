-- Popdarts App - Database Schema (Phase 1 MVP)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  dart_color TEXT DEFAULT '#FF6B35', -- Popdarts orange
  jersey_color TEXT DEFAULT '#004E89', -- Popdarts blue
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player1_name TEXT NOT NULL, -- Denormalized for guest players
  player1_score INTEGER NOT NULL CHECK (player1_score >= 0),
  player2_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player2_name TEXT NOT NULL,
  player2_score INTEGER NOT NULL CHECK (player2_score >= 0),
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  duration_seconds INTEGER,
  played_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_players CHECK (
    player1_id IS NULL OR 
    player2_id IS NULL OR 
    player1_id != player2_id
  ),
  CONSTRAINT valid_winner CHECK (
    winner_id IS NULL OR
    winner_id = player1_id OR
    winner_id = player2_id
  )
);

-- Indexes for performance
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);
CREATE INDEX idx_matches_played_at ON matches(played_at DESC);
CREATE INDEX idx_users_email ON users(email);

-- User stats view (derived from matches)
CREATE OR REPLACE VIEW user_stats WITH (security_invoker = true) AS
SELECT
  u.id,
  u.display_name,
  COUNT(m.id) AS total_matches,
  COUNT(CASE WHEN m.winner_id = u.id THEN 1 END) AS wins,
  COUNT(CASE WHEN m.winner_id IS NOT NULL AND m.winner_id != u.id THEN 1 END) AS losses,
  CASE 
    WHEN COUNT(m.id) > 0 THEN
      ROUND(COUNT(CASE WHEN m.winner_id = u.id THEN 1 END)::NUMERIC / COUNT(m.id)::NUMERIC * 100, 1)
    ELSE 0
  END AS win_rate
FROM users u
LEFT JOIN matches m ON (m.player1_id = u.id OR m.player2_id = u.id)
GROUP BY u.id, u.display_name;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row-level security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table

-- Users can read all profiles (needed for opponent selection)
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can only insert their own profile (handled by signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for matches table

-- Users can read all matches (public match history)
CREATE POLICY "Users can read all matches"
  ON matches FOR SELECT
  USING (true);

-- Authenticated users can create matches
CREATE POLICY "Authenticated users can create matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only match participants can update their matches
CREATE POLICY "Participants can update matches"
  ON matches FOR UPDATE
  USING (
    auth.uid() = player1_id OR
    auth.uid() = player2_id
  );

-- Only match participants can delete their matches (optional - consider if you want this)
CREATE POLICY "Participants can delete matches"
  ON matches FOR DELETE
  USING (
    auth.uid() = player1_id OR
    auth.uid() = player2_id
  );

-- Function to automatically set winner based on scores
CREATE OR REPLACE FUNCTION set_match_winner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.player1_score > NEW.player2_score THEN
    NEW.winner_id := NEW.player1_id;
  ELSIF NEW.player2_score > NEW.player1_score THEN
    NEW.winner_id := NEW.player2_id;
  ELSE
    NEW.winner_id := NULL; -- Tie
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply winner trigger
CREATE TRIGGER calculate_match_winner
  BEFORE INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION set_match_winner();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON matches TO authenticated;
GRANT SELECT ON user_stats TO authenticated, anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Popdarts database schema created successfully!';
  RAISE NOTICE 'Tables: users, matches';
  RAISE NOTICE 'Views: user_stats';
  RAISE NOTICE 'RLS policies: enabled';
END $$;
