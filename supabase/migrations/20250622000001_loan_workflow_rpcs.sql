-- Migration: Add RPC functions and Row Level Security for loan workflow
-- This migration creates the necessary database functions and security policies

-- First, let's create the RPC function for creating loan requests
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
  
  IF p_interest_rate < 0 THEN
    RAISE EXCEPTION 'Interest rate cannot be negative';
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
    json_build_object(
      'description', p_description,
      'type', 'loan_request'
    )::jsonb,
    'pending',
    NULL,
    NULL,
    NULL,
    NOW()
  ) RETURNING id INTO new_request_id;

  -- Return success response with the new request ID
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

-- RPC function for claiming/accepting a loan request
CREATE OR REPLACE FUNCTION claim_request(
  p_request_id uuid,
  p_lender_id uuid,
  p_lender_name text,
  p_lender_email text
) RETURNS json AS $$
DECLARE
  current_status text;
  borrower_info record;
  result json;
BEGIN
  -- Check if the request exists and is still available
  SELECT status, borrower_name, borrower_email, amount, purpose, duration_months
  INTO current_status, borrower_info
  FROM loan_agreements 
  WHERE id = p_request_id AND lender_id IS NULL;

  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'error', 'Request not found or already claimed',
      'message', 'This loan request is no longer available'
    );
    RETURN result;
  END IF;

  IF current_status != 'pending' THEN
    result := json_build_object(
      'success', false,
      'error', 'Request not available',
      'message', 'This loan request is no longer pending'
    );
    RETURN result;
  END IF;

  -- Update the loan agreement with lender information
  UPDATE loan_agreements 
  SET 
    lender_id = p_lender_id,
    lender_name = p_lender_name,
    lender_email = p_lender_email,
    status = 'claimed',
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Return success response with borrower info for email notification
  result := json_build_object(
    'success', true,
    'request_id', p_request_id,
    'borrower_name', borrower_info.borrower_name,
    'borrower_email', borrower_info.borrower_email,
    'amount', borrower_info.amount,
    'purpose', borrower_info.purpose,
    'duration', borrower_info.duration_months,
    'message', 'Loan request claimed successfully'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to claim loan request'
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function for finalizing loan terms (both parties accept)
CREATE OR REPLACE FUNCTION finalize_loan_terms(
  p_request_id uuid,
  p_user_id uuid,
  p_signature_data text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  loan_record record;
  result json;
  is_borrower boolean := false;
  is_lender boolean := false;
BEGIN
  -- Get the loan record
  SELECT * INTO loan_record
  FROM loan_agreements 
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'error', 'Loan agreement not found',
      'message', 'The specified loan agreement does not exist'
    );
    RETURN result;
  END IF;

  -- Check if user is borrower or lender
  IF loan_record.borrower_id = p_user_id THEN
    is_borrower := true;
  ELSIF loan_record.lender_id = p_user_id THEN
    is_lender := true;
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Unauthorized',
      'message', 'You are not authorized to sign this agreement'
    );
    RETURN result;
  END IF;

  -- Update the appropriate signature field
  IF is_borrower THEN
    UPDATE loan_agreements 
    SET 
      borrower_signature = p_signature_data,
      borrower_signed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_request_id;
  ELSIF is_lender THEN
    UPDATE loan_agreements 
    SET 
      lender_signature = p_signature_data,
      lender_signed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_request_id;
  END IF;

  -- Check if both parties have now signed
  SELECT * INTO loan_record
  FROM loan_agreements 
  WHERE id = p_request_id;

  IF loan_record.borrower_signed_at IS NOT NULL AND loan_record.lender_signed_at IS NOT NULL THEN
    -- Both parties have signed, update status to 'active'
    UPDATE loan_agreements 
    SET 
      status = 'active',
      updated_at = NOW()
    WHERE id = p_request_id;

    result := json_build_object(
      'success', true,
      'request_id', p_request_id,
      'status', 'active',
      'both_signed', true,
      'borrower_name', loan_record.borrower_name,
      'borrower_email', loan_record.borrower_email,
      'lender_name', loan_record.lender_name,
      'lender_email', loan_record.lender_email,
      'amount', loan_record.amount,
      'purpose', loan_record.purpose,
      'duration', loan_record.duration_months,
      'message', 'Both parties have signed. Contract ready for deployment.'
    );
  ELSE
    result := json_build_object(
      'success', true,
      'request_id', p_request_id,
      'status', loan_record.status,
      'both_signed', false,
      'message', 'Signature recorded. Waiting for other party to sign.'
    );
  END IF;

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to finalize loan terms'
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on loan_agreements table
ALTER TABLE loan_agreements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view loan agreements where they are the borrower or lender
-- OR they can view pending requests (where lender_id is null) to browse available loans
CREATE POLICY "Users can view relevant loan agreements" ON loan_agreements
FOR SELECT USING (
  borrower_id = auth.uid() OR 
  lender_id = auth.uid() OR 
  (lender_id IS NULL AND status = 'pending')
);

-- Policy: Only borrowers can create new loan requests
CREATE POLICY "Borrowers can create loan requests" ON loan_agreements
FOR INSERT WITH CHECK (
  borrower_id = auth.uid() AND 
  lender_id IS NULL AND 
  status = 'pending'
);

-- Policy: Only borrowers and lenders can update their own agreements
CREATE POLICY "Parties can update their agreements" ON loan_agreements
FOR UPDATE USING (
  borrower_id = auth.uid() OR lender_id = auth.uid()
) WITH CHECK (
  borrower_id = auth.uid() OR lender_id = auth.uid()
);

-- Policy: No direct deletes allowed (use status updates instead)
CREATE POLICY "No direct deletes" ON loan_agreements
FOR DELETE USING (false);

-- Grant execute permissions on the RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION request_loan TO authenticated;
GRANT EXECUTE ON FUNCTION claim_request TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_loan_terms TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loan_agreements_borrower_id ON loan_agreements(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_lender_id ON loan_agreements(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_status ON loan_agreements(status);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_pending_requests ON loan_agreements(status, lender_id) WHERE lender_id IS NULL;
