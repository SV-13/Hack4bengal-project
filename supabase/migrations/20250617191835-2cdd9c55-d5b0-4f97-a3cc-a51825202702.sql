
-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  reputation_score INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create loan_agreements table
CREATE TABLE public.loan_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lender_id UUID REFERENCES auth.users NOT NULL,
  borrower_id UUID REFERENCES auth.users,
  borrower_email TEXT,
  borrower_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  duration_months INTEGER NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'active', 'completed', 'defaulted')),
  payment_method TEXT DEFAULT 'upi' CHECK (payment_method IN ('upi', 'bank', 'wallet', 'crypto', 'cash')),
  smart_contract BOOLEAN DEFAULT FALSE,
  conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID REFERENCES public.loan_agreements NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('disbursement', 'repayment', 'interest')),
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table for non-registered users
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID REFERENCES public.loan_agreements NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Loan agreements policies
CREATE POLICY "Users can view agreements they're involved in" ON public.loan_agreements
  FOR SELECT USING (auth.uid() = lender_id OR auth.uid() = borrower_id);

CREATE POLICY "Lenders can create agreements" ON public.loan_agreements
  FOR INSERT WITH CHECK (auth.uid() = lender_id);

CREATE POLICY "Involved users can update agreements" ON public.loan_agreements
  FOR UPDATE USING (auth.uid() = lender_id OR auth.uid() = borrower_id);

-- Transactions policies
CREATE POLICY "Users can view related transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loan_agreements 
      WHERE id = agreement_id 
      AND (lender_id = auth.uid() OR borrower_id = auth.uid())
    )
  );

CREATE POLICY "System can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- Invitations policies
CREATE POLICY "Lenders can view their invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loan_agreements 
      WHERE id = agreement_id AND lender_id = auth.uid()
    )
  );

CREATE POLICY "System can manage invitations" ON public.invitations
  FOR ALL WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
