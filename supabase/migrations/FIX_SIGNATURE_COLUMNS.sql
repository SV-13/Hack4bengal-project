-- Fix for migration column mismatch
-- This should be added to fix the borrower_signed_at/lender_signed_at columns

ALTER TABLE loan_agreements 
ADD COLUMN IF NOT EXISTS borrower_signed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS lender_signed_at TIMESTAMP;

-- Update existing records to use the signature timestamps
UPDATE loan_agreements 
SET 
  lender_signed_at = lender_signature,
  borrower_signed_at = borrower_signature
WHERE lender_signature IS NOT NULL OR borrower_signature IS NOT NULL;
