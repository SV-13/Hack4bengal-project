-- COMPREHENSIVE DATABASE SCHEMA FIX
-- Copy and paste this ENTIRE script into your Supabase SQL Editor
-- This will create the correct schema for loan agreements

-- Step 1: Drop existing table if it has wrong structure (CAUTION: This deletes all data)
-- Only uncomment the next line if you want to start fresh
-- DROP TABLE IF EXISTS public.loan_agreements CASCADE;

-- Step 2: Create the loan_agreements table with correct structure
CREATE TABLE IF NOT EXISTS public.loan_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Borrower information
  borrower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT NOT NULL,
  
  -- Lender information (nullable for loan requests)
  lender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lender_name TEXT,
  lender_email TEXT,
  
  -- Loan details
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  interest_rate DECIMAL(5,2) DEFAULT 0 CHECK (interest_rate >= 0),
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  purpose TEXT CHECK (purpose IN ('business', 'education', 'medical', 'home_improvement', 'debt_consolidation', 'wedding', 'travel', 'other')),
  conditions TEXT,
  
  -- Status and workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'accepted', 'rejected', 'active', 'completed', 'defaulted')),
  
  -- Payment and contract details
  payment_method TEXT DEFAULT 'upi' CHECK (payment_method IN ('upi', 'bank', 'wallet', 'crypto', 'cash')),
  smart_contract BOOLEAN DEFAULT FALSE,
  contract_address TEXT,
  
  -- Digital signatures (for future use)
  lender_signature TIMESTAMP,
  borrower_signature TIMESTAMP,
  lender_signed_at TIMESTAMP,
  borrower_signed_at TIMESTAMP,
  pdf_generated BOOLEAN DEFAULT FALSE,
  
  -- Additional data
  data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loan_agreements_borrower_id ON public.loan_agreements(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_lender_id ON public.loan_agreements(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_status ON public.loan_agreements(status);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_created_at ON public.loan_agreements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_amount ON public.loan_agreements(amount);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_purpose ON public.loan_agreements(purpose);

-- Step 4: Enable Row Level Security
ALTER TABLE public.loan_agreements ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view agreements they're involved in" ON public.loan_agreements;
DROP POLICY IF EXISTS "Lenders can create agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Involved users can update agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Users can view their own loan agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Users can insert their own loan agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Users can update their own loan agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Authenticated users can view pending loan requests" ON public.loan_agreements;
DROP POLICY IF EXISTS "Users can view relevant loan agreements" ON public.loan_agreements;
DROP POLICY IF EXISTS "Borrowers can update their agreements" ON public.loan_agreements;

-- Step 6: Create RLS policies
-- Policy 1: Users can view agreements where they are borrower or lender
CREATE POLICY "loan_agreements_select_policy" ON public.loan_agreements
  FOR SELECT USING (
    auth.uid() = borrower_id OR 
    auth.uid() = lender_id OR 
    borrower_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    lender_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy 2: Authenticated users can insert loan agreements
CREATE POLICY "loan_agreements_insert_policy" ON public.loan_agreements
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = borrower_id OR 
      auth.uid() = lender_id OR
      borrower_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
      lender_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policy 3: Users can update agreements they're involved in
CREATE POLICY "loan_agreements_update_policy" ON public.loan_agreements
  FOR UPDATE USING (
    auth.uid() = borrower_id OR 
    auth.uid() = lender_id OR
    borrower_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    lender_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy 4: Users can delete their own agreements (optional)
CREATE POLICY "loan_agreements_delete_policy" ON public.loan_agreements
  FOR DELETE USING (
    auth.uid() = borrower_id OR 
    auth.uid() = lender_id
  );

-- Step 7: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_loan_agreements_updated_at ON public.loan_agreements;
CREATE TRIGGER update_loan_agreements_updated_at 
  BEFORE UPDATE ON public.loan_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_agreements TO authenticated;
GRANT SELECT ON public.loan_agreements TO anon;

-- Step 10: Create helper function for loan requests (borrowers requesting loans)
CREATE OR REPLACE FUNCTION create_loan_request(
  p_borrower_id UUID,
  p_borrower_name TEXT,
  p_borrower_email TEXT,
  p_amount DECIMAL,
  p_purpose TEXT,
  p_duration_months INTEGER,
  p_interest_rate DECIMAL DEFAULT 0,
  p_conditions TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_loan_id UUID;
BEGIN
  -- Insert loan request (no lender yet)
  INSERT INTO public.loan_agreements (
    borrower_id,
    borrower_name,
    borrower_email,
    lender_id,
    amount,
    purpose,
    duration_months,
    interest_rate,
    conditions,
    status
  ) VALUES (
    p_borrower_id,
    p_borrower_name,
    p_borrower_email,
    NULL, -- No lender yet
    p_amount,
    p_purpose,
    p_duration_months,
    p_interest_rate,
    p_conditions,
    'pending'
  ) RETURNING id INTO new_loan_id;
  
  RETURN new_loan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create helper function for loan offers (lenders offering loans)
CREATE OR REPLACE FUNCTION create_loan_offer(
  p_lender_id UUID,
  p_lender_name TEXT,
  p_lender_email TEXT,
  p_borrower_email TEXT,
  p_borrower_name TEXT,
  p_amount DECIMAL,
  p_purpose TEXT,
  p_duration_months INTEGER,
  p_interest_rate DECIMAL,
  p_conditions TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_loan_id UUID;
BEGIN
  -- Insert loan offer (lender offering to specific borrower)
  INSERT INTO public.loan_agreements (
    lender_id,
    lender_name,
    lender_email,
    borrower_id,
    borrower_name,
    borrower_email,
    amount,
    purpose,
    duration_months,
    interest_rate,
    conditions,
    status,
    lender_signature
  ) VALUES (
    p_lender_id,
    p_lender_name,
    p_lender_email,
    NULL, -- Will be set when borrower accepts
    p_borrower_name,
    p_borrower_email,
    p_amount,
    p_purpose,
    p_duration_months,
    p_interest_rate,
    p_conditions,
    'pending',
    NOW() -- Lender signs when creating offer
  ) RETURNING id INTO new_loan_id;
  
  RETURN new_loan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('loan_request', 'loan_accepted', 'loan_rejected', 'payment_due', 'payment_received', 'payment_overdue', 'agreement_completed', 'system')),
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  related_agreement_id UUID REFERENCES public.loan_agreements(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Grant permissions for notifications
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema setup completed successfully!';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '1. Create loan requests (borrowers)';
  RAISE NOTICE '2. Create loan offers (lenders)';
  RAISE NOTICE '3. Update loan statuses';
  RAISE NOTICE '4. Generate notifications';
END $$;
