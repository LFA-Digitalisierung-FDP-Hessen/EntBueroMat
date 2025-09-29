-- Migration: Add pending_approval status to issues table
-- This migration adds 'pending_approval' to the allowed status values
-- and changes the default status to 'pending_approval'

-- First, drop the existing check constraint
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check;

-- Add the new check constraint with 'pending_approval' included
ALTER TABLE issues ADD CONSTRAINT issues_status_check 
    CHECK (status IN ('pending_approval', 'submitted', 'in_progress', 'resolved', 'rejected'));

-- Change the default status to 'pending_approval'
ALTER TABLE issues ALTER COLUMN status SET DEFAULT 'pending_approval';

-- Update any existing issues that have 'submitted' status but no approved_at timestamp
-- These should be considered as pending approval
UPDATE issues 
SET status = 'pending_approval' 
WHERE status = 'submitted' AND approved_at IS NULL;
