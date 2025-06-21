-- MANUAL MIGRATION SCRIPT FOR SUPABASE
-- Copy and paste this script into the Supabase SQL Editor
-- This will create the notifications table and all related functions

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('loan_request', 'loan_accepted', 'loan_rejected', 'payment_due', 'payment_received', 'payment_overdue', 'agreement_completed', 'system')),
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  related_agreement_id UUID REFERENCES public.loan_agreements,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create helper function to create notifications
CREATE OR REPLACE FUNCTION public.create_loan_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_agreement_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_agreement_id, data)
  VALUES (p_user_id, p_title, p_message, p_type, p_agreement_id, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_loan_status_change ON public.loan_agreements;
DROP FUNCTION IF EXISTS public.handle_loan_status_change();

-- Create function to handle loan status changes and create notifications
CREATE OR REPLACE FUNCTION public.handle_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When loan is accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Notify lender
    PERFORM public.create_loan_notification(
      NEW.lender_id,
      'Loan Request Accepted',
      'Your loan request to ' || COALESCE(NEW.borrower_name, 'borrower') || ' has been accepted.',
      'loan_accepted',
      NEW.id
    );
    
    -- Notify borrower if they have an account
    IF NEW.borrower_id IS NOT NULL THEN
      PERFORM public.create_loan_notification(
        NEW.borrower_id,
        'Loan Agreement Active',
        'You have accepted a loan agreement for $' || NEW.amount || '.',
        'loan_accepted',
        NEW.id
      );
    END IF;
  END IF;

  -- When loan is rejected
  IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    PERFORM public.create_loan_notification(
      NEW.lender_id,
      'Loan Request Rejected',
      'Your loan request to ' || COALESCE(NEW.borrower_name, 'borrower') || ' has been rejected.',
      'loan_rejected',
      NEW.id
    );
  END IF;

  -- When loan status changes to active
  IF OLD.status = 'accepted' AND NEW.status = 'active' THEN
    -- Notify both parties
    PERFORM public.create_loan_notification(
      NEW.lender_id,
      'Loan Agreement Active',
      'Your loan agreement with ' || COALESCE(NEW.borrower_name, 'borrower') || ' is now active.',
      'loan_accepted',
      NEW.id
    );
    
    IF NEW.borrower_id IS NOT NULL THEN
      PERFORM public.create_loan_notification(
        NEW.borrower_id,
        'Loan Agreement Active',
        'Your loan agreement is now active.',
        'loan_accepted',
        NEW.id
      );
    END IF;
  END IF;

  -- When loan is completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Notify both parties
    PERFORM public.create_loan_notification(
      NEW.lender_id,
      'Loan Completed',
      'Your loan agreement with ' || COALESCE(NEW.borrower_name, 'borrower') || ' has been completed.',
      'agreement_completed',
      NEW.id
    );
    
    IF NEW.borrower_id IS NOT NULL THEN
      PERFORM public.create_loan_notification(
        NEW.borrower_id,
        'Loan Completed',
        'Your loan agreement has been completed successfully.',
        'agreement_completed',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for loan status changes
CREATE TRIGGER on_loan_status_change
  AFTER UPDATE ON public.loan_agreements
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_loan_status_change();

-- Drop existing transaction triggers
DROP TRIGGER IF EXISTS on_transaction_created ON public.transactions;
DROP FUNCTION IF EXISTS public.handle_new_transaction();

-- Create function to handle new transactions
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
      'Received payment of $' || NEW.amount || ' from ' || COALESCE(agreement.borrower_name, 'borrower') || '.',
      'payment_received',
      agreement.id,
      json_build_object('transaction_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  IF NEW.transaction_type = 'disbursement' AND NEW.status = 'completed' THEN
    -- Notify borrower of loan disbursement
    IF agreement.borrower_id IS NOT NULL THEN
      PERFORM public.create_loan_notification(
        agreement.borrower_id,
        'Loan Disbursed',
        'Your loan of $' || NEW.amount || ' has been disbursed.',
        'payment_received',
        agreement.id,
        json_build_object('transaction_id', NEW.id, 'amount', NEW.amount)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new transactions
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_transaction();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Create some sample notifications for testing (optional)
-- INSERT INTO public.notifications (user_id, title, message, type)
-- SELECT 
--   id,
--   'Welcome to Lendit!',
--   'Thank you for joining our P2P lending platform. Start by creating your first loan agreement.',
--   'system'
-- FROM auth.users 
-- LIMIT 5;

-- Verify the setup
SELECT 
  schemaname, 
  tablename, 
  tableowner, 
  hasindexes, 
  hasrules, 
  hastriggers 
FROM pg_tables 
WHERE tablename = 'notifications' AND schemaname = 'public';
