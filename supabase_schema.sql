-- ============================================================
-- RaceEdge Supabase Schema
-- Paste this entire file into Supabase > SQL Editor > Run
-- ============================================================

CREATE TABLE IF NOT EXISTS races (
  race_id           TEXT PRIMARY KEY,
  course            TEXT,
  race_name         TEXT,
  race_type         TEXT,
  going             TEXT,
  distance_furlongs NUMERIC,
  off_time          TEXT,
  field_size        INT,
  race_date         DATE
);

CREATE TABLE IF NOT EXISTS runners (
  runner_id  TEXT PRIMARY KEY,
  race_id    TEXT REFERENCES races(race_id),
  horse_name TEXT NOT NULL,
  horse_id   TEXT,
  jockey     TEXT,
  trainer    TEXT,
  age        INT,
  draw       INT,
  form       TEXT,
  rpr        INT,
  race_type  TEXT,
  race_date  DATE,
  odds_raw   JSONB
);

CREATE TABLE IF NOT EXISTS scores (
  score_id  BIGSERIAL PRIMARY KEY,
  runner_id TEXT UNIQUE REFERENCES runners(runner_id),
  race_id   TEXT,
  race_date DATE,
  scores    JSONB,
  total     NUMERIC
);

CREATE TABLE IF NOT EXISTS results (
  result_id  TEXT PRIMARY KEY,
  race_id    TEXT,
  course     TEXT,
  race_date  DATE,
  horse_name TEXT NOT NULL,
  horse_id   TEXT,
  position   INT,
  sp_decimal NUMERIC,
  field_size INT
);

CREATE TABLE IF NOT EXISTS cache (
  key        TEXT PRIMARY KEY,
  value      JSONB,
  date       DATE,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS persona_picks (
  pick_id      TEXT PRIMARY KEY,
  persona      TEXT,
  horse_name   TEXT,
  race_id      TEXT,
  course       TEXT,
  race_type    TEXT,
  race_date    DATE,
  score        NUMERIC,
  score_gap    NUMERIC,
  is_best_pick BOOLEAN DEFAULT TRUE,
  tip_text     TEXT,
  odds         TEXT,
  position     INT,
  sp_decimal   NUMERIC,
  field_size   INT,
  is_nr        BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS persona_season (
  persona        TEXT PRIMARY KEY,
  total_staked   NUMERIC DEFAULT 0,
  total_returned NUMERIC DEFAULT 0,
  total_picks    INT DEFAULT 0,
  winners        INT DEFAULT 0,
  placed         INT DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO persona_season (persona) VALUES ('AJ'), ('TC') ON CONFLICT (persona) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID UNIQUE REFERENCES auth.users(id),
  plan       TEXT DEFAULT 'free',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION settle_persona(
  p_persona  TEXT, p_staked NUMERIC, p_returned NUMERIC, p_won INT, p_placed INT
) RETURNS VOID AS $$
BEGIN
  UPDATE persona_season SET
    total_staked   = total_staked   + p_staked,
    total_returned = total_returned + p_returned,
    total_picks    = total_picks    + 1,
    winners        = winners        + p_won,
    placed         = placed         + p_placed,
    updated_at     = NOW()
  WHERE persona = p_persona;
END;
$$ LANGUAGE plpgsql;

CREATE INDEX IF NOT EXISTS idx_runners_race_date  ON runners(race_date);
CREATE INDEX IF NOT EXISTS idx_runners_race_id    ON runners(race_id);
CREATE INDEX IF NOT EXISTS idx_scores_race_date   ON scores(race_date);
CREATE INDEX IF NOT EXISTS idx_results_race_date  ON results(race_date);
CREATE INDEX IF NOT EXISTS idx_picks_persona      ON persona_picks(persona);
CREATE INDEX IF NOT EXISTS idx_picks_race_date    ON persona_picks(race_date);

ALTER TABLE races           ENABLE ROW LEVEL SECURITY;
ALTER TABLE runners         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache           ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_picks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_season  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS pub_read_races   ON races          FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS pub_read_cache   ON cache          FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS pub_read_picks   ON persona_picks  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS pub_read_season  ON persona_season FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS pub_read_results ON results        FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS own_sub          ON subscriptions  FOR SELECT USING (auth.uid() = user_id);