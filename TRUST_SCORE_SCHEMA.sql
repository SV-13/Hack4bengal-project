-- Trust Score & Reputation System Database Schema
-- Run this in Supabase SQL Editor

-- 1. User Trust Scores Table
CREATE TABLE IF NOT EXISTS user_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER DEFAULT 300 CHECK (overall_score >= 0 AND overall_score <= 850),
  repayment_score INTEGER DEFAULT 300,
  performance_score INTEGER DEFAULT 300,
  activity_score INTEGER DEFAULT 300,
  social_score INTEGER DEFAULT 300,
  verification_score INTEGER DEFAULT 300,
  score_tier TEXT DEFAULT 'bronze' CHECK (score_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_loans_as_borrower INTEGER DEFAULT 0,
  total_loans_as_lender INTEGER DEFAULT 0,
  successful_loans_as_borrower INTEGER DEFAULT 0,
  successful_loans_as_lender INTEGER DEFAULT 0,
  on_time_payments INTEGER DEFAULT 0,
  late_payments INTEGER DEFAULT 0,
  total_payments_made INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings_received INTEGER DEFAULT 0,
  account_age_days INTEGER DEFAULT 0,
  profile_completeness_percentage INTEGER DEFAULT 0,
  verification_level INTEGER DEFAULT 0, -- 0: none, 1: basic, 2: enhanced, 3: full
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trust Score History Table
CREATE TABLE IF NOT EXISTS trust_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_score INTEGER,
  new_score INTEGER,
  change_amount INTEGER,
  change_reason TEXT,
  event_type TEXT, -- 'loan_completed', 'payment_made', 'payment_late', 'rating_received', etc.
  event_reference_id UUID, -- Reference to loan_id, payment_id, etc.
  score_breakdown JSONB, -- Detailed breakdown of how score was calculated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Ratings Table
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_agreement_id UUID REFERENCES loan_agreements(id) ON DELETE CASCADE,
  rater_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  rating_categories JSONB, -- { "communication": 5, "reliability": 4, "transparency": 5 }
  rating_type TEXT CHECK (rating_type IN ('lender_to_borrower', 'borrower_to_lender')),
  is_verified BOOLEAN DEFAULT false, -- Whether this rating is from a verified loan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(loan_agreement_id, rater_user_id, rated_user_id)
);

-- 4. User Verification Records Table
CREATE TABLE IF NOT EXISTS user_verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT, -- 'phone', 'email', 'identity', 'bank_account', 'income', 'address'
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verification_data JSONB, -- Store relevant verification metadata
  document_url TEXT, -- IPFS or storage URL for verification documents
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id), -- Admin who verified (if manual)
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Trust Score Achievements Table (Gamification)
CREATE TABLE IF NOT EXISTS trust_score_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT, -- 'first_loan', 'perfect_repayment', 'highly_rated', etc.
  achievement_name TEXT,
  achievement_description TEXT,
  score_bonus INTEGER DEFAULT 0,
  badge_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_user_id ON user_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_overall_score ON user_trust_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_tier ON user_trust_scores(score_tier);
CREATE INDEX IF NOT EXISTS idx_trust_score_history_user_id ON trust_score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_score_history_event_type ON trust_score_history(event_type);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user_id ON user_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_user_id ON user_ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_loan_agreement_id ON user_ratings(loan_agreement_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_records_user_id ON user_verification_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_records_type_status ON user_verification_records(verification_type, verification_status);

-- RPC Function: Initialize Trust Score for New User
CREATE OR REPLACE FUNCTION initialize_user_trust_score(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_trust_scores (
    user_id,
    overall_score,
    repayment_score,
    performance_score,
    activity_score,
    social_score,
    verification_score,
    score_tier,
    account_age_days,
    profile_completeness_percentage
  ) VALUES (
    p_user_id,
    300,  -- Starting score
    300,
    300,
    300,
    300,
    300,
    'bronze',
    0,
    20    -- Base completeness for having an account
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- RPC Function: Calculate and Update Trust Score
CREATE OR REPLACE FUNCTION calculate_trust_score(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_current_score user_trust_scores%ROWTYPE;
  v_loan_stats RECORD;
  v_payment_stats RECORD;
  v_rating_stats RECORD;
  v_verification_stats RECORD;
  v_new_scores JSONB;
  v_old_overall INTEGER;
  v_new_overall INTEGER;
BEGIN
  -- Get current score record
  SELECT * INTO v_current_score FROM user_trust_scores WHERE user_id = p_user_id;
  
  IF v_current_score.id IS NULL THEN
    -- Initialize if doesn't exist
    PERFORM initialize_user_trust_score(p_user_id);
    SELECT * INTO v_current_score FROM user_trust_scores WHERE user_id = p_user_id;
  END IF;
  
  v_old_overall := v_current_score.overall_score;
  
  -- Calculate loan statistics
  SELECT 
    COUNT(*) as total_loans,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_loans,
    COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans,
    COUNT(CASE WHEN borrower_id = p_user_id THEN 1 END) as loans_as_borrower,
    COUNT(CASE WHEN lender_id = p_user_id THEN 1 END) as loans_as_lender
  INTO v_loan_stats
  FROM loan_agreements 
  WHERE borrower_id = p_user_id OR lender_id = p_user_id;
  
  -- Calculate payment statistics (placeholder - would need payment tracking table)
  v_payment_stats := ROW(0, 0, 0)::RECORD;
  
  -- Calculate rating statistics
  SELECT 
    AVG(rating) as avg_rating,
    COUNT(*) as total_ratings
  INTO v_rating_stats
  FROM user_ratings 
  WHERE rated_user_id = p_user_id;
  
  -- Calculate verification statistics
  SELECT 
    COUNT(*) as total_verifications,
    COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_count
  INTO v_verification_stats
  FROM user_verification_records 
  WHERE user_id = p_user_id;
  
  -- Calculate component scores
  
  -- Repayment Score (40% weight) - Base 300, max 400
  v_new_scores := jsonb_build_object(
    'repayment_score', LEAST(400, 300 + 
      CASE 
        WHEN v_loan_stats.total_loans = 0 THEN 0
        WHEN v_loan_stats.defaulted_loans = 0 THEN 100
        ELSE GREATEST(-100, 100 - (v_loan_stats.defaulted_loans * 50))
      END
    )
  );
  
  -- Performance Score (20% weight) - Base 300, max 350
  v_new_scores := v_new_scores || jsonb_build_object(
    'performance_score', LEAST(350, 300 + 
      CASE 
        WHEN v_loan_stats.total_loans = 0 THEN 0
        ELSE (v_loan_stats.completed_loans * 50 / v_loan_stats.total_loans)
      END
    )
  );
  
  -- Activity Score (10% weight) - Base 300, max 325
  v_new_scores := v_new_scores || jsonb_build_object(
    'activity_score', LEAST(325, 300 + 
      CASE 
        WHEN v_loan_stats.total_loans >= 10 THEN 25
        WHEN v_loan_stats.total_loans >= 5 THEN 15
        WHEN v_loan_stats.total_loans >= 1 THEN 10
        ELSE 0
      END
    )
  );
  
  -- Social Score (15% weight) - Base 300, max 337
  v_new_scores := v_new_scores || jsonb_build_object(
    'social_score', LEAST(337, 300 + 
      CASE 
        WHEN v_rating_stats.total_ratings = 0 THEN 0
        ELSE ROUND((v_rating_stats.avg_rating - 3) * 18.5) -- 5-star = +37, 1-star = -37
      END
    )
  );
  
  -- Verification Score (5% weight) - Base 300, max 312
  v_new_scores := v_new_scores || jsonb_build_object(
    'verification_score', LEAST(312, 300 + 
      CASE 
        WHEN v_verification_stats.verified_count >= 4 THEN 12
        WHEN v_verification_stats.verified_count >= 2 THEN 8
        WHEN v_verification_stats.verified_count >= 1 THEN 4
        ELSE 0
      END
    )
  );
  
  -- Calculate overall score (weighted average)
  v_new_overall := ROUND(
    (v_new_scores->>'repayment_score')::INTEGER * 0.40 +
    (v_new_scores->>'performance_score')::INTEGER * 0.20 +
    (v_new_scores->>'activity_score')::INTEGER * 0.10 +
    (v_new_scores->>'social_score')::INTEGER * 0.15 +
    (v_new_scores->>'verification_score')::INTEGER * 0.05 +
    300 * 0.10 -- 10% base score
  );
  
  -- Determine tier
  v_new_scores := v_new_scores || jsonb_build_object(
    'overall_score', v_new_overall,
    'score_tier', 
    CASE 
      WHEN v_new_overall >= 751 THEN 'platinum'
      WHEN v_new_overall >= 601 THEN 'gold'
      WHEN v_new_overall >= 401 THEN 'silver'
      ELSE 'bronze'
    END
  );
  
  -- Update the scores
  UPDATE user_trust_scores SET
    overall_score = v_new_overall,
    repayment_score = (v_new_scores->>'repayment_score')::INTEGER,
    performance_score = (v_new_scores->>'performance_score')::INTEGER,
    activity_score = (v_new_scores->>'activity_score')::INTEGER,
    social_score = (v_new_scores->>'social_score')::INTEGER,
    verification_score = (v_new_scores->>'verification_score')::INTEGER,
    score_tier = v_new_scores->>'score_tier',
    total_loans_as_borrower = v_loan_stats.loans_as_borrower,
    total_loans_as_lender = v_loan_stats.loans_as_lender,
    successful_loans_as_borrower = v_loan_stats.completed_loans,
    average_rating = COALESCE(v_rating_stats.avg_rating, 0),
    total_ratings_received = COALESCE(v_rating_stats.total_ratings, 0),
    last_calculated_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record score change in history
  IF v_new_overall != v_old_overall THEN
    INSERT INTO trust_score_history (
      user_id, 
      previous_score, 
      new_score, 
      change_amount, 
      change_reason,
      event_type,
      score_breakdown
    ) VALUES (
      p_user_id,
      v_old_overall,
      v_new_overall,
      v_new_overall - v_old_overall,
      'Recalculated based on current activity',
      'score_recalculation',
      v_new_scores
    );
  END IF;
  
  RETURN v_new_scores;
END;
$$ LANGUAGE plpgsql;

-- RPC Function: Record Trust Score Event
CREATE OR REPLACE FUNCTION record_trust_score_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_reference_id UUID DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Recalculate score
  PERFORM calculate_trust_score(p_user_id);
  
  -- The calculation function already records the history
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own trust scores
CREATE POLICY "Users can read own trust scores" ON user_trust_scores
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read any user's basic trust score (for lending decisions)
CREATE POLICY "Users can read basic trust scores" ON user_trust_scores
  FOR SELECT USING (true);

-- Users can read their own score history
CREATE POLICY "Users can read own score history" ON trust_score_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read ratings where they are involved
CREATE POLICY "Users can read relevant ratings" ON user_ratings
  FOR SELECT USING (
    auth.uid() = rater_user_id OR 
    auth.uid() = rated_user_id
  );

-- Users can create ratings for loans they participated in
CREATE POLICY "Users can create ratings" ON user_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_user_id AND
    EXISTS (
      SELECT 1 FROM loan_agreements 
      WHERE id = loan_agreement_id 
      AND (borrower_id = auth.uid() OR lender_id = auth.uid())
    )
  );

-- Users can read their own verification records
CREATE POLICY "Users can read own verification records" ON user_verification_records
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own verification records
CREATE POLICY "Users can create own verification records" ON user_verification_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own achievements
CREATE POLICY "Users can read own achievements" ON trust_score_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger to initialize trust score on user creation
CREATE OR REPLACE FUNCTION handle_new_user_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_user_trust_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger would go on auth.users, but we can't modify that directly
-- Instead, we'll initialize scores when users first interact with the system

COMMENT ON TABLE user_trust_scores IS 'Stores calculated trust scores for platform users';
COMMENT ON TABLE trust_score_history IS 'Historical record of trust score changes';
COMMENT ON TABLE user_ratings IS 'User-to-user ratings after loan completion';
COMMENT ON TABLE user_verification_records IS 'Records of user identity and financial verification';
COMMENT ON TABLE trust_score_achievements IS 'Gamification achievements for trust score milestones';
