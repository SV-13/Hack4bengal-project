-- Migration: Add loan_requests table for borrowers to request loans
-- This table allows borrowers to post loan requests that lenders can see and respond to

CREATE TABLE IF NOT EXISTS loan_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  borrower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  purpose TEXT NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  requested_interest_rate DECIMAL(5,2), -- Optional, borrower's preferred rate
  collateral TEXT, -- Optional description of collateral
  monthly_income DECIMAL(15,2), -- Optional financial info
  employment_status TEXT, -- employed, self_employed, freelancer, etc.
  credit_score INTEGER, -- Optional credit score
  description TEXT, -- Additional details from borrower
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days'), -- Auto-expire after 30 days
  
  -- Indexes for performance
  CONSTRAINT valid_purpose CHECK (purpose IN ('business', 'education', 'medical', 'home_improvement', 'debt_consolidation', 'wedding', 'travel', 'other'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loan_requests_borrower_id ON loan_requests(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON loan_requests(status);
CREATE INDEX IF NOT EXISTS idx_loan_requests_created_at ON loan_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loan_requests_amount ON loan_requests(amount);
CREATE INDEX IF NOT EXISTS idx_loan_requests_purpose ON loan_requests(purpose);

-- Enable Row Level Security (RLS)
ALTER TABLE loan_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Borrowers can only see and edit their own requests
CREATE POLICY "Users can view their own loan requests" ON loan_requests
  FOR SELECT USING (auth.uid() = borrower_id);

CREATE POLICY "Users can insert their own loan requests" ON loan_requests
  FOR INSERT WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Users can update their own loan requests" ON loan_requests
  FOR UPDATE USING (auth.uid() = borrower_id);

-- Lenders (other authenticated users) can view all pending requests
CREATE POLICY "Authenticated users can view pending loan requests" ON loan_requests
  FOR SELECT USING (auth.role() = 'authenticated' AND status = 'pending');

-- Create table for loan offers from lenders to borrowers
CREATE TABLE IF NOT EXISTS loan_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES loan_requests(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lender_name TEXT NOT NULL,
  lender_email TEXT NOT NULL,
  offered_amount DECIMAL(15,2) NOT NULL CHECK (offered_amount > 0),
  offered_interest_rate DECIMAL(5,2) NOT NULL CHECK (offered_interest_rate >= 0),
  offered_duration_months INTEGER NOT NULL CHECK (offered_duration_months > 0),
  conditions TEXT, -- Any special conditions from lender
  message TEXT, -- Personal message from lender
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for loan_offers
CREATE INDEX IF NOT EXISTS idx_loan_offers_request_id ON loan_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_loan_offers_lender_id ON loan_offers(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_offers_status ON loan_offers(status);
CREATE INDEX IF NOT EXISTS idx_loan_offers_created_at ON loan_offers(created_at DESC);

-- Enable RLS for loan_offers
ALTER TABLE loan_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for loan_offers
-- Lenders can manage their own offers
CREATE POLICY "Users can view their own loan offers" ON loan_offers
  FOR SELECT USING (auth.uid() = lender_id);

CREATE POLICY "Users can insert their own loan offers" ON loan_offers
  FOR INSERT WITH CHECK (auth.uid() = lender_id);

CREATE POLICY "Users can update their own loan offers" ON loan_offers
  FOR UPDATE USING (auth.uid() = lender_id);

-- Borrowers can view offers on their requests
CREATE POLICY "Borrowers can view offers on their requests" ON loan_offers
  FOR SELECT USING (
    auth.uid() IN (
      SELECT borrower_id FROM loan_requests WHERE id = request_id
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_loan_requests_updated_at BEFORE UPDATE ON loan_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_offers_updated_at BEFORE UPDATE ON loan_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON loan_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON loan_offers TO authenticated;
