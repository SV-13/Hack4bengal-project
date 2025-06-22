# Supabase Row Level Security (RLS) Policy Fixes

## Issue
The current RLS policies prevent users from creating loan requests, causing the error:
"new row violates row level security policy for table loan_agreements"

## Solution
Run these SQL commands in your **Supabase Dashboard → SQL Editor**:

```sql
-- Fix RLS policies for loan_agreements to allow borrowers to create requests

-- 1. Drop the old restrictive policy
DROP POLICY IF EXISTS "Lenders can create agreements" ON public.loan_agreements;

-- 2. Create new policy that allows both borrowers and lenders to create records
CREATE POLICY "Users can create loan requests" ON public.loan_agreements
  FOR INSERT WITH CHECK (
    auth.uid() = borrower_id OR 
    auth.uid() = lender_id OR 
    (auth.uid() = borrower_id AND lender_id IS NULL)
  );

-- 3. Allow public viewing of pending requests (so people can see available loans to lend)
CREATE POLICY "Public can view pending loan requests" ON public.loan_agreements
  FOR SELECT USING (
    status = 'pending' OR 
    auth.uid() = lender_id OR 
    auth.uid() = borrower_id
  );

-- 4. Update the existing update policy to be more permissive
DROP POLICY IF EXISTS "Involved users can update agreements" ON public.loan_agreements;

CREATE POLICY "Users can update related agreements" ON public.loan_agreements
  FOR UPDATE USING (
    auth.uid() = lender_id OR 
    auth.uid() = borrower_id OR
    (status = 'pending' AND lender_id IS NULL)
  );
```

## What These Policies Do

1. **Create Loan Requests**: Allows users to create loan requests where they are the borrower
2. **View Requests**: Allows anyone to view pending loan requests (needed for the "Browse" feature)
3. **Update Agreements**: Allows users to update loan agreements they're involved in
4. **Claim Requests**: Allows lenders to claim pending requests by updating them

## Expected Results After Applying

- ✅ Loan request submission should work without RLS errors
- ✅ Browse loan requests should show available requests
- ✅ Lending money (claiming requests) should work
- ✅ All dashboard functionality should work properly

## Note
These policies balance security with functionality, ensuring users can only access and modify records they're involved in while allowing the necessary public viewing for the P2P lending marketplace.
