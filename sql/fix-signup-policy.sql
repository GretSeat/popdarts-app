-- Fix RLS policy for user signup
-- Run this in Supabase SQL Editor

-- Drop the old policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a new policy that properly handles signup
-- This allows any authenticated user to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile';
