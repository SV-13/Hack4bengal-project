-- COMPLETE DATABASE FIX FOR LOAN REQUEST CREATION
-- Run this entire script in Supabase SQL Editor to fix all issues

-- 1. Fix the NOT NULL constraint on lender_id
ALTER TABLE public.loan_agreements 
ALTER COLUMN lender_id DROP NOT NULL;

-- 2. Add missing lender fields if they don't exist
ALTER TABLE public.loan_agreements 
ADD COLUMN IF NOT EXISTS lender_name TEXT,
ADD COLUMN IF NOT EXISTS lender_email TEXT;

-- 3. Drop all existing restrictive RLS policies
DROP POLICY IF EXISTS "Lenders can create agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Involved users can update agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Users can view loan agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Users can create loan requests" ON public.loan_agreements;
DROP POLICY IF EXISTS "Public can view pending loan requests" ON public.loan_agreements;
DROP POLICY IF EXISTS "Users can update related agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Users can view relevant loan agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Borrowers can create loan requests" ON public.loan_agreements;
DROP POLICY IF EXISTS "Parties can update their agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "No direct deletes" ON public.loan_agreements;
DROP POLICY IF EXISTS "Borrowers can update their agreements" ON public.loan_agreements;

-- 4. Create new permissive RLS policies
CREATE POLICY "Allow borrowers to create loan requests" ON public.loan_agreements
  FOR INSERT WITH CHECK (
    auth.uid() = borrower_id AND 
    lender_id IS NULL AND 
    status = 'pending'
  );

CREATE POLICY "Allow public to view pending loan requests" ON public.loan_agreements
  FOR SELECT USING (
    status = 'pending' OR 
    auth.uid() = lender_id OR 
    auth.uid() = borrower_id
  );

CREATE POLICY "Allow parties to update their agreements" ON public.loan_agreements
  FOR UPDATE USING (
    auth.uid() = borrower_id OR 
    auth.uid() = lender_id OR
    (status = 'pending' AND lender_id IS NULL)
  );

-- 5. Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_loan_agreements_borrower_id ON public.loan_agreements(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_lender_id ON public.loan_agreements(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_status ON public.loan_agreements(status);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_pending_requests ON public.loan_agreements(status, lender_id) WHERE lender_id IS NULL;

-- 6. Verify the changes
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'loan_agreements' 
AND column_name IN ('lender_id', 'lender_name', 'lender_email');

-- 7. Test insert (this should work without errors)
INSERT INTO public.loan_agreements (
  borrower_id,
  borrower_name,
  borrower_email,
  lender_id,
  amount,
  purpose,
  duration_months,
  status
) VALUES (
  auth.uid(),
  'Test User',
  'test@example.com',
  NULL,
  100,
  'Test loan request',
  6,
  'pending'
);

-- Clean up the test record
DELETE FROM public.loan_agreements 
WHERE borrower_name = 'Test User' AND amount = 100;

-- 8. Final verification - show current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'loan_agreements'
ORDER BY ordinal_position;
