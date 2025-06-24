-- ADD IPFS INTEGRATION COLUMNS TO LOAN AGREEMENTS
-- Run this in Supabase SQL Editor to add IPFS support for PDF contracts

-- Add IPFS-related columns for PDF contract storage
ALTER TABLE public.loan_agreements 
ADD COLUMN IF NOT EXISTS contract_ipfs_cid TEXT,
ADD COLUMN IF NOT EXISTS contract_ipfs_url TEXT,
ADD COLUMN IF NOT EXISTS contract_pdf_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_pdf_size INTEGER;

-- Add index for IPFS CID lookups
CREATE INDEX IF NOT EXISTS idx_loan_agreements_ipfs_cid ON public.loan_agreements(contract_ipfs_cid);

-- Add comment for documentation
COMMENT ON COLUMN public.loan_agreements.contract_ipfs_cid IS 'IPFS Content Identifier for the signed PDF contract';
COMMENT ON COLUMN public.loan_agreements.contract_ipfs_url IS 'Full IPFS URL for accessing the PDF contract';
COMMENT ON COLUMN public.loan_agreements.contract_pdf_generated_at IS 'Timestamp when the PDF was generated and uploaded to IPFS';
COMMENT ON COLUMN public.loan_agreements.contract_pdf_size IS 'Size of the PDF file in bytes';

-- Create a function to update IPFS contract data
CREATE OR REPLACE FUNCTION update_contract_ipfs_data(
  p_agreement_id UUID,
  p_ipfs_cid TEXT,
  p_ipfs_url TEXT,
  p_pdf_size INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.loan_agreements 
  SET 
    contract_ipfs_cid = p_ipfs_cid,
    contract_ipfs_url = p_ipfs_url,
    contract_pdf_generated_at = NOW(),
    contract_pdf_size = p_pdf_size,
    updated_at = NOW()
  WHERE id = p_agreement_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_contract_ipfs_data TO authenticated;
