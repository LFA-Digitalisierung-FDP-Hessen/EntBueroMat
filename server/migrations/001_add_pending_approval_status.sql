-- Migration: Add 'pending_approval' status to issues table
-- This migration adds the new status and migrates existing data

-- Step 1: Add the new status to the check constraint
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE issues ADD CONSTRAINT issues_status_check 
    CHECK (status IN ('pending_approval', 'submitted', 'in_progress', 'resolved', 'rejected'));

-- Step 2: Migrate existing data
-- Issues that are not approved yet (approved_at IS NULL) should be 'pending_approval'
-- Issues that are approved should keep their current status
UPDATE issues 
SET status = 'pending_approval' 
WHERE approved_at IS NULL AND status != 'rejected';

-- Step 3: Set default status to 'pending_approval' for new issues
ALTER TABLE issues ALTER COLUMN status SET DEFAULT 'pending_approval';

-- Note: We keep the approved_at and rejected_at columns for now during transition
-- They will be removed in a future migration once everything is working
