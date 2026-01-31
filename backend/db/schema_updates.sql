-- LinkOps Database Schema Updates for Onboarding
-- Add columns to users table for onboarding tracking

-- Add onboarding_completed column (if not exists)
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_step column (if not exists)
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;

-- Add first_name column (if not exists)
ALTER TABLE users ADD COLUMN first_name VARCHAR(50);

-- Add last_name column (if not exists)
ALTER TABLE users ADD COLUMN last_name VARCHAR(50);

-- Add email column (if not exists)
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
