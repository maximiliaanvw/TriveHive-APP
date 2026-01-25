-- Create the user_settings table for storing user Vapi configuration
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vapi_assistant_id TEXT UNIQUE NOT NULL,
  vapi_phone_number_id TEXT,
  business_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on vapi_assistant_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_vapi_assistant_id ON user_settings(vapi_assistant_id);

-- Create the calls table for storing Vapi call data
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assistant_id TEXT,
  customer_number TEXT,
  status TEXT,
  duration_seconds NUMERIC,
  started_at TIMESTAMPTZ,
  summary TEXT,
  transcript TEXT,
  recording_url TEXT,
  ended_reason TEXT,
  analysis_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id ON calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_assistant_id ON calls(assistant_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at);

-- Optional: Add a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at 
  BEFORE UPDATE ON calls 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on calls table
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own calls
CREATE POLICY "Users can view own calls"
  ON calls
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service Role can insert calls (for webhook)
-- This allows the webhook to insert calls using the service role key
CREATE POLICY "Service Role can insert calls"
  ON calls
  FOR INSERT
  WITH CHECK (true);

-- Optional: Policy for users to update their own calls (if needed in the future)
-- CREATE POLICY "Users can update own calls"
--   ON calls
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- Enable RLS on user_settings table (optional, but recommended)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
