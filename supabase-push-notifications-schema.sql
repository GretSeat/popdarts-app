-- Push Notifications Schema for Popdarts
-- This file contains the database schema for managing push notification tokens and preferences

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  preferences JSONB DEFAULT '{
    "storeUpdates": true,
    "flashSales": true,
    "leaguesNearby": true,
    "tournamentTurns": true,
    "matchReminders": true,
    "clubAnnouncements": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_push_token ON push_tokens(push_token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON push_tokens(platform);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER trigger_update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

-- Create notification_logs table to track sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'delivered', 'opened')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ
);

-- Create indexes for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_tokens
-- Users can view their own tokens
CREATE POLICY "Users can view own push tokens"
  ON push_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notification_logs
-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can insert notification logs
CREATE POLICY "Service can insert notification logs"
  ON notification_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only service role can update notification logs
CREATE POLICY "Service can update notification logs"
  ON notification_logs FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to send push notification (to be called from backend)
-- This is a placeholder - actual implementation would use Expo Push API
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_tokens RECORD;
  v_result JSONB;
  v_sent_count INTEGER := 0;
  v_failed_count INTEGER := 0;
BEGIN
  -- Get all active push tokens for the user with notification type enabled
  FOR v_tokens IN
    SELECT push_token, preferences
    FROM push_tokens
    WHERE user_id = p_user_id
      AND last_used_at > NOW() - INTERVAL '90 days' -- Only active tokens
  LOOP
    -- Check if user has this notification type enabled
    DECLARE
      v_pref_key TEXT;
      v_enabled BOOLEAN := true;
    BEGIN
      -- Map notification types to preference keys
      v_pref_key := CASE p_notification_type
        WHEN 'store_update' THEN 'storeUpdates'
        WHEN 'flash_sale' THEN 'flashSales'
        WHEN 'league_nearby' THEN 'leaguesNearby'
        WHEN 'tournament_turn' THEN 'tournamentTurns'
        WHEN 'match_reminder' THEN 'matchReminders'
        WHEN 'club_announcement' THEN 'clubAnnouncements'
        ELSE NULL
      END;

      IF v_pref_key IS NOT NULL THEN
        v_enabled := COALESCE((v_tokens.preferences ->> v_pref_key)::boolean, true);
      END IF;

      IF v_enabled THEN
        -- Log the notification (actual sending would happen in backend service)
        INSERT INTO notification_logs (
          user_id,
          push_token,
          notification_type,
          title,
          body,
          data,
          status
        ) VALUES (
          p_user_id,
          v_tokens.push_token,
          p_notification_type,
          p_title,
          p_body,
          p_data,
          'sent' -- Would be updated by backend service
        );

        v_sent_count := v_sent_count + 1;
      END IF;
    END;
  END LOOP;

  v_result := jsonb_build_object(
    'sent', v_sent_count,
    'failed', v_failed_count
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_push_notification TO authenticated;

-- Create helper function to get user's notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_preferences JSONB;
BEGIN
  SELECT preferences INTO v_preferences
  FROM push_tokens
  WHERE user_id = p_user_id
  LIMIT 1;

  RETURN COALESCE(v_preferences, '{
    "storeUpdates": true,
    "flashSales": true,
    "leaguesNearby": true,
    "tournamentTurns": true,
    "matchReminders": true,
    "clubAnnouncements": true
  }'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_notification_preferences TO authenticated;

-- Comments for documentation
COMMENT ON TABLE push_tokens IS 'Stores Expo push notification tokens for registered users';
COMMENT ON TABLE notification_logs IS 'Tracks all push notifications sent to users';
COMMENT ON FUNCTION send_push_notification IS 'Sends a push notification to all active devices for a user (respects preferences)';
COMMENT ON FUNCTION get_notification_preferences IS 'Retrieves notification preferences for a user';
