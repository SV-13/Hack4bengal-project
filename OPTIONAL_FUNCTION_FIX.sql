-- Fix function signature for transaction notifications
-- Run this in Supabase SQL Editor if you want to fix the minor function signature issue

CREATE OR REPLACE FUNCTION public.handle_new_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agreement RECORD;
BEGIN
  -- Get the loan agreement details
  SELECT * INTO agreement FROM public.loan_agreements WHERE id = NEW.agreement_id;
  
  -- Notify relevant parties based on transaction type
  IF NEW.transaction_type = 'repayment' AND NEW.status = 'completed' THEN
    -- Notify lender of payment received
    PERFORM public.create_loan_notification(
      agreement.lender_id,
      'Payment Received',
      'Received payment of $' || NEW.amount::text || ' from ' || COALESCE(agreement.borrower_name, 'borrower') || '.',
      'payment_received',
      agreement.id,
      json_build_object('transaction_id', NEW.id, 'amount', NEW.amount)::jsonb
    );
  END IF;

  IF NEW.transaction_type = 'disbursement' AND NEW.status = 'completed' THEN
    -- Notify borrower of loan disbursement
    IF agreement.borrower_id IS NOT NULL THEN
      PERFORM public.create_loan_notification(
        agreement.borrower_id,
        'Loan Disbursed',
        'Your loan of $' || NEW.amount::text || ' has been disbursed.',
        'payment_received',
        agreement.id,
        json_build_object('transaction_id', NEW.id, 'amount', NEW.amount)::jsonb
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
