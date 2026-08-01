-- Phase 7: personalization profiles

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age_group TEXT CHECK (age_group IN ('child', 'adult', 'senior')),
  has_respiratory_condition BOOLEAN NOT NULL DEFAULT false,
  has_cardiovascular_condition BOOLEAN NOT NULL DEFAULT false,
  outdoor_activity_level TEXT CHECK (outdoor_activity_level IN ('low', 'moderate', 'high')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
