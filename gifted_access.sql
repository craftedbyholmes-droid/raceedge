-- Run this in Supabase SQL Editor
-- Adds the gifted_access table for admin-granted free access

CREATE TABLE IF NOT EXISTS gifted_access (
  email       TEXT PRIMARY KEY,
  plan        TEXT NOT NULL DEFAULT 'pro',
  expires_at  TIMESTAMPTZ,
  granted_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gifted_access ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (API uses service role key)
-- No public policies needed
