-- Fix NOT NULL constraint on lender_id column
-- This allows loan requests where lender_id is NULL (no lender assigned yet)

-- Remove NOT NULL constraint from lender_id
ALTER TABLE public.loan_agreements 
ALTER COLUMN lender_id DROP NOT NULL;

-- Verify the constraint was removed
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'loan_agreements' 
AND column_name = 'lender_id';

-- This should now show is_nullable = 'YES' for lender_id
