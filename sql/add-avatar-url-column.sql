-- Add avatar_url column to users table for storing Google profile pictures

-- Add avatar_url column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the trigger to handle Google's full_name and picture from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',  -- Google OAuth: full_name
      NEW.raw_user_meta_data->>'display_name',  -- Email signup: display_name
      'Player'  -- Fallback
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'picture',  -- Google OAuth: picture URL
      NULL
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, that's fine
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Verify the change
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('display_name', 'avatar_url');
