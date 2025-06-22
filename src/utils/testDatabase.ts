import { supabase } from '@/integrations/supabase/client';

// Simple test to check database connectivity and table structure
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('Auth test:', { userData: !!userData.user, error: userError });

    // Test 2: Check loan_agreements table structure
    const { data: tableData, error: tableError } = await supabase
      .from('loan_agreements')
      .select('*')
      .limit(1);
    
    console.log('Table test:', { hasData: !!tableData, error: tableError });    // Test 3: Try to create a simple test loan request to verify write permissions
    const { data: insertData, error: insertError } = await supabase
      .from('loan_agreements')
      .insert({
        borrower_id: 'test-user-id',
        borrower_name: 'Test User',
        borrower_email: 'test@example.com',
        lender_id: null, // No lender for loan requests
        amount: 1000,
        duration_months: 12,
        purpose: 'business',
        status: 'pending'
      })
      .select()
      .single();
    
    // If successful, clean up the test record
    if (insertData && !insertError) {
      await supabase
        .from('loan_agreements')
        .delete()
        .eq('id', insertData.id);
    }
    
    console.log('Insert test:', { success: !!insertData, error: insertError });    return {
      connected: !userError && !tableError && !insertError,
      errors: { userError, tableError, insertError }
    };
  } catch (error) {
    console.error('Database test failed:', error);
    return { connected: false, error };
  }
};

// Test loan request creation functionality
export const testLoanRequestCreation = async (userId: string, userEmail: string, userName: string) => {
  try {
    console.log('Testing loan request creation...');
      const testLoanData = {
      borrower_id: userId,
      borrower_name: userName || 'Test User',
      borrower_email: userEmail,
      lender_id: null, // No lender for loan requests
      amount: 5000,
      purpose: 'business',
      duration_months: 12,
      interest_rate: 8.5,
      conditions: 'Test loan request for functionality verification',
      status: 'pending' as const
    };

    const { data, error } = await supabase
      .from('loan_agreements')
      .insert(testLoanData)
      .select()
      .single();

    return {
      success: !!data && !error,
      data,
      error,
      message: data ? 'Loan request created successfully!' : 'Failed to create loan request'
    };
  } catch (error) {
    console.error('Loan request test failed:', error);
    return {
      success: false,
      error,
      message: 'Loan request creation test failed'
    };
  }
};
