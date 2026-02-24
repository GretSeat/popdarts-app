-- Add state column to users table
-- Run this in Supabase SQL Editor

-- Add state column (nullable to support existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS state TEXT;

-- Add index for state lookups (for future state-wide stats)
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);

-- Add comment to document the column
COMMENT ON COLUMN users.state IS 'US state abbreviation (e.g., "CA", "NY") - extracted from Google sign-in metadata';
