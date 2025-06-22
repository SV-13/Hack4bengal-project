-- Migration: Add missing lender fields to loan_agreements table
-- This fixes the "lender_email column not found" error

-- Add lender_name and lender_email columns to loan_agreements table
ALTER TABLE public.loan_agreements 
ADD COLUMN IF NOT EXISTS lender_name TEXT,
ADD COLUMN IF NOT EXISTS lender_email TEXT;

-- Update the table comment to reflect the complete structure
COMMENT ON TABLE public.loan_agreements IS 'Loan agreements table with complete borrower and lender information';
