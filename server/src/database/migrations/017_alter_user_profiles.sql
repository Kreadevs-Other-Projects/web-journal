-- Migration 017: Add editorial profile fields to user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS degrees TEXT[],
  ADD COLUMN IF NOT EXISTS profile_pic_url TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
