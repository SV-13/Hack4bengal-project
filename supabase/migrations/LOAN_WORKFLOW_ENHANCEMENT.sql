-- Enhanced Loan Agreement Workflow Migration
-- This migration adds support for digital signatures and proper agreement workflow

-- Update loan_agreements table structure
ALTER TABLE loan_agreements 
ADD COLUMN IF NOT EXISTS lender_signature TIMESTAMP,
ADD COLUMN IF NOT EXISTS borrower_signature TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_details JSONB,
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lender_name TEXT,
ADD COLUMN IF NOT EXISTS borrower_name TEXT;

-- Add new status types
-- proposed: Lender has created offer, waiting for borrower
-- active: Both parties have signed, agreement is active
-- rejected: Borrower declined the offer
-- completed: Loan fully repaid
-- defaulted: Loan payment overdue

-- Update existing records to have proper structure
UPDATE loan_agreements 
SET 
  lender_signature = created_at,
  pdf_generated = FALSE
WHERE lender_signature IS NULL;

-- Create function to handle loan acceptance
CREATE OR REPLACE FUNCTION accept_loan_agreement(agreement_id UUID, borrower_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Update agreement status and add borrower signature
  UPDATE loan_agreements 
  SET 
    borrower_signature = NOW(),
    status = 'active',
    pdf_generated = TRUE,
    borrower_id = borrower_user_id
  WHERE id = agreement_id AND status = 'proposed';

  -- Check if update was successful
  IF FOUND THEN
    -- Create notification for lender
    INSERT INTO notifications (user_id, type, title, message, agreement_id, read)
    SELECT 
      lender_id,
      'loan_accepted',
      'Loan Agreement Accepted! 🎉',
      'Your loan offer has been accepted and is now active.',
      agreement_id,
      FALSE
    FROM loan_agreements 
    WHERE id = agreement_id;

    result := json_build_object('success', true, 'message', 'Agreement accepted successfully');
  ELSE
    result := json_build_object('success', false, 'message', 'Agreement not found or already processed');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle loan rejection
CREATE OR REPLACE FUNCTION reject_loan_agreement(agreement_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Update agreement status
  UPDATE loan_agreements 
  SET 
    borrower_signature = NOW(),
    status = 'rejected'
  WHERE id = agreement_id AND status = 'proposed';

  -- Check if update was successful
  IF FOUND THEN
    -- Create notification for lender
    INSERT INTO notifications (user_id, type, title, message, agreement_id, read)
    SELECT 
      lender_id,
      'loan_rejected',
      'Loan Offer Declined',
      'Your loan offer has been declined.',
      agreement_id,
      FALSE
    FROM loan_agreements 
    WHERE id = agreement_id;

    result := json_build_object('success', true, 'message', 'Agreement rejected successfully');
  ELSE
    result := json_build_object('success', false, 'message', 'Agreement not found or already processed');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to handle new workflow
DROP POLICY IF EXISTS "Users can view relevant loan agreements" ON loan_agreements;

CREATE POLICY "Users can view relevant loan agreements" ON loan_agreements
  FOR SELECT USING (
    auth.uid() = lender_id OR 
    auth.uid() = borrower_id OR
    borrower_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow borrowers to accept/reject offers even if not registered yet
CREATE POLICY "Borrowers can update their agreements" ON loan_agreements
  FOR UPDATE USING (
    auth.uid() = borrower_id OR
    borrower_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_loan_agreements_status ON loan_agreements(status);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_signatures ON loan_agreements(lender_signature, borrower_signature);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_borrower_email ON loan_agreements(borrower_email);

-- Add comment to document the new workflow
COMMENT ON TABLE loan_agreements IS 'Enhanced loan agreements with digital signature workflow. Status flow: proposed -> active/rejected -> completed/defaulted';
