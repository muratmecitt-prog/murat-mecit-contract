-- Add Google Calendar integration columns to settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS google_refresh_token text,
ADD COLUMN IF NOT EXISTS google_calendar_id text DEFAULT 'primary';

-- Create a comment for clarity
COMMENT ON COLUMN public.settings.google_refresh_token IS 'OAuth2 refresh token for Google Calendar access';
COMMENT ON COLUMN public.settings.google_calendar_id IS 'Specific Google Calendar ID to sync with (default: primary)';
