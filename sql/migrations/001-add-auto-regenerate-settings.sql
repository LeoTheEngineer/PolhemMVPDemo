-- ============================================
-- Migration: Add auto-regeneration settings
-- Date: 2026-01-19
-- Description: Adds columns to settings table for auto-regeneration feature
-- ============================================

-- Add auto_regenerate column
-- When true, the system will automatically regenerate the schedule 2 minutes after data changes
ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_regenerate BOOLEAN NOT NULL DEFAULT false;

-- Add needs_regeneration column
-- This flag is set to true when data changes that affect the schedule
-- It's reset to false after the schedule is regenerated
ALTER TABLE settings ADD COLUMN IF NOT EXISTS needs_regeneration BOOLEAN NOT NULL DEFAULT false;

-- Update the existing 'main' row to ensure both columns exist with defaults
UPDATE settings 
SET 
    auto_regenerate = COALESCE(auto_regenerate, false),
    needs_regeneration = COALESCE(needs_regeneration, false)
WHERE id = 'main';
