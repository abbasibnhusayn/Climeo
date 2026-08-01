-- Phase 8: monetization — subscription tier on users

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium', 'enterprise'));

CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
