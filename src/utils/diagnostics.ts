import { supabase } from '@/integrations/supabase/client';

// Comprehensive database diagnostic tool
export const diagnoseDatabaseIssues = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    connection: false,
    auth: false,
    table_access: false,
    rls_policies: false,
    errors: [] as string[],
    details: {} as any
  };

  console.group('🔍 DATABASE DIAGNOSTIC STARTING...');

  try {
    // Step 1: Check Supabase Configuration
    console.log('📋 Step 1: Checking Supabase Configuration...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://tbhcyajaukyocniuugif.supabase.co";
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaGN5YWphdWt5b2NuaXV1Z2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4MzMsImV4cCI6MjA2NTc2MjgzM30.AXvo1YPw_YR0q_RRCatbLbZqM_g1gnrGPy1q2qKHrMw";
    
    results.details.config = {
      url: supabaseUrl,
      keyLength: supabaseKey.length,
      keyPrefix: supabaseKey.substring(0, 20) + '...'
    };
    console.log('✅ Config loaded:', results.details.config);

    // Step 2: Test Basic Connection
    console.log('🌐 Step 2: Testing Basic Connection...');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.details.auth = { hasUser: !!user, error: authError?.message };
      
      if (!authError) {
        results.connection = true;
        results.auth = !!user;
        console.log('✅ Connection successful, User:', user ? 'Authenticated' : 'Anonymous');
      } else {
        results.errors.push(`Auth error: ${authError.message}`);
        console.error('❌ Auth error:', authError);
      }
    } catch (connectionError: any) {
      results.errors.push(`Connection failed: ${connectionError.message}`);
      console.error('❌ Connection failed:', connectionError);
      return results;
    }

    // Step 3: Test Table Access (without RLS)
    console.log('📊 Step 3: Testing Table Access...');
    try {
      // Try to access the table structure first
      const { data: tableData, error: tableError } = await supabase
        .from('loan_agreements')
        .select('id')
        .limit(1);
      
      results.details.table = { 
        accessible: !tableError, 
        error: tableError?.message,
        hasData: !!tableData?.length 
      };
      
      if (!tableError) {
        results.table_access = true;
        console.log('✅ Table accessible, Records found:', tableData?.length || 0);
      } else {
        results.errors.push(`Table access error: ${tableError.message}`);
        console.error('❌ Table access error:', tableError);
      }
    } catch (tableError: any) {
      results.errors.push(`Table error: ${tableError.message}`);
      console.error('❌ Table error:', tableError);
    }

    // Step 4: Test RLS Policies (if authenticated)
    if (results.auth) {
      console.log('🔒 Step 4: Testing RLS Policies...');
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('loan_agreements')
          .insert({
            borrower_id: 'test-rls-id',
            borrower_name: 'RLS Test',
            borrower_email: 'test@rls.com',
            lender_id: null,
            amount: 100,
            duration_months: 1,
            purpose: 'business',
            status: 'pending'
          })
          .select()
          .single();

        if (insertData && !insertError) {
          // Clean up test record
          await supabase
            .from('loan_agreements')
            .delete()
            .eq('id', insertData.id);
          
          results.rls_policies = true;
          console.log('✅ RLS policies working correctly');
        } else {
          results.errors.push(`RLS policy error: ${insertError?.message}`);
          console.error('❌ RLS policy error:', insertError);
        }
      } catch (rlsError: any) {
        results.errors.push(`RLS test failed: ${rlsError.message}`);
        console.error('❌ RLS test failed:', rlsError);
      }
    }

    // Step 5: Network Connectivity Test
    console.log('🌍 Step 5: Testing Network Connectivity...');
    try {
      const response = await fetch('https://tbhcyajaukyocniuugif.supabase.co/rest/v1/', {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      results.details.network = {
        status: response.status,
        statusText: response.statusText,
        accessible: response.ok
      };
      
      if (response.ok) {
        console.log('✅ Network connectivity good');
      } else {
        results.errors.push(`Network issue: ${response.status} ${response.statusText}`);
        console.error('❌ Network issue:', response.status, response.statusText);
      }
    } catch (networkError: any) {
      results.errors.push(`Network error: ${networkError.message}`);
      console.error('❌ Network error:', networkError);
    }

  } catch (globalError: any) {
    results.errors.push(`Global error: ${globalError.message}`);
    console.error('❌ Global error:', globalError);
  }

  console.groupEnd();
  
  // Generate diagnostic report
  const overallHealth = results.connection && results.table_access;
  console.log(`\n🎯 DIAGNOSTIC COMPLETE - Overall Health: ${overallHealth ? '✅ HEALTHY' : '❌ ISSUES FOUND'}`);
  
  if (results.errors.length > 0) {
    console.group('🚨 ERRORS FOUND:');
    results.errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error}`);
    });
    console.groupEnd();
  }

  return results;
};

// Simple connection test for quick debugging
export const quickConnectionTest = async () => {
  try {
    console.log('🔄 Quick connection test starting...');
    
    // Test 1: Basic ping
    const { data, error } = await supabase.from('loan_agreements').select('count').limit(1);
    
    if (error) {
      console.error('❌ Quick test failed:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Quick test passed');
    return { success: true, data };
    
  } catch (error: any) {
    console.error('❌ Quick test exception:', error.message);
    return { success: false, error: error.message };
  }
};
