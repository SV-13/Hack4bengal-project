-- Manual Migration: Add missing lender fields and RPC functions
-- Applied manually via Supabase SQL Editor on 2025-06-22
-- This file documents the changes made directly in the database

-- 1. Add missing lender fields to loan_agreements table
ALTER TABLE public.loan_agreements 
ADD COLUMN IF NOT EXISTS lender_name TEXT,
ADD COLUMN IF NOT EXISTS lender_email TEXT;

-- 2. RPC function for creating loan requests
CREATE OR REPLACE FUNCTION request_loan(
  p_borrower_id uuid,
  p_borrower_name text,
  p_borrower_email text,
  p_amount numeric,
  p_purpose text,
  p_duration_months integer,
  p_interest_rate numeric DEFAULT 0,
  p_description text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  new_request_id uuid;
  result json;
BEGIN
  -- Validate input parameters
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;
  
  IF p_duration_months <= 0 THEN
    RAISE EXCEPTION 'Duration must be greater than 0 months';
  END IF;
  
  -- Insert the loan request
  INSERT INTO loan_agreements (
    borrower_id,
    borrower_name,
    borrower_email,
    amount,
    purpose,
    duration_months,
    interest_rate,
    conditions,
    status,
    lender_id,
    lender_name,
    lender_email,
    created_at
  ) VALUES (
    p_borrower_id,
    p_borrower_name,
    p_borrower_email,
    p_amount,
    p_purpose,
    p_duration_months,
    p_interest_rate,
    p_description,
    'pending',
    NULL,
    NULL,
    NULL,
    NOW()
  ) RETURNING id INTO new_request_id;

  -- Return success response
  result := json_build_object(
    'success', true,
    'request_id', new_request_id,
    'message', 'Loan request created successfully'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Return error response
  result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to create loan request'
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC function for claiming/accepting a loan request
CREATE OR REPLACE FUNCTION claim_request(
  p_request_id uuid,
  p_lender_id uuid,
  p_lender_name text,
  p_lender_email text
) RETURNS json AS $$
DECLARE
  current_status text;
  result json;
BEGIN
  -- Check if the request exists and is still available
  SELECT status INTO current_status
  FROM loan_agreements
  WHERE id = p_request_id;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Loan request not found';
  END IF;

  IF current_status != 'pending' THEN
    RAISE EXCEPTION 'Loan request is no longer available';
  END IF;

  -- Update the request with lender information
  UPDATE loan_agreements
  SET 
    lender_id = p_lender_id,
    lender_name = p_lender_name,
    lender_email = p_lender_email,
    status = 'accepted',
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Return success response
  result := json_build_object(
    'success', true,
    'message', 'Loan request accepted successfully'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to accept loan request'
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: These changes were applied manually via Supabase SQL Editor
-- and are now live in the database. This file serves as documentation.
