// Emergency connection test - bypasses all application logic
export const emergencyConnectionTest = async () => {
  console.group('🚨 EMERGENCY CONNECTION TEST');
  
  const supabaseUrl = 'https://tbhcyajaukyocniuugif.supabase.co';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaGN5YWphdWt5b2NuaXV1Z2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4MzMsImV4cCI6MjA2NTc2MjgzM30.AXvo1YPw_YR0q_RRCatbLbZqM_g1gnrGPy1q2qKHrMw';
  
  try {
    // Test 1: Basic connectivity
    console.log('🌐 Testing basic connectivity...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.error('❌ ISSUE: Invalid API key or authentication failed');
      return { issue: 'invalid_api_key', status: response.status };
    }
    
    if (response.status === 404) {
      console.error('❌ ISSUE: Project not found or URL incorrect');
      return { issue: 'project_not_found', status: response.status };
    }
    
    if (response.status >= 500) {
      console.error('❌ ISSUE: Supabase server error - project might be paused');
      return { issue: 'server_error_possibly_paused', status: response.status };
    }
    
    if (!response.ok) {
      console.error(`❌ ISSUE: Unexpected response ${response.status}`);
      return { issue: 'unexpected_response', status: response.status };
    }
    
    // Test 2: Check if we can access tables
    console.log('📊 Testing table access...');
    const tableResponse = await fetch(`${supabaseUrl}/rest/v1/loan_agreements?select=id&limit=1`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Table access: ${tableResponse.status} ${tableResponse.statusText}`);
    
    if (tableResponse.status === 404) {
      console.error('❌ ISSUE: Table "loan_agreements" does not exist - schema not created');
      return { issue: 'table_not_found', status: tableResponse.status, solution: 'Run SUPABASE_SCHEMA_FIX.sql' };
    }
    
    if (tableResponse.ok) {
      console.log('✅ SUCCESS: Database connection and table access working!');
      return { issue: null, status: 'healthy', message: 'Connection successful' };
    }
    
    console.error(`❌ ISSUE: Table access failed with ${tableResponse.status}`);
    return { issue: 'table_access_failed', status: tableResponse.status };
    
  } catch (error: any) {
    console.error('❌ NETWORK ERROR:', error.message);
    
    if (error.message.includes('Failed to fetch')) {
      console.error('🚨 LIKELY CAUSE: Supabase project is PAUSED or network blocked');
      return { 
        issue: 'project_paused_or_network', 
        error: error.message,
        solution: 'Check if Supabase project is paused in dashboard'
      };
    }
    
    return { issue: 'network_error', error: error.message };
  } finally {
    console.groupEnd();
  }
};

// Add this to window for easy browser console testing
if (typeof window !== 'undefined') {
  (window as any).emergencyTest = emergencyConnectionTest;
  console.log('🆘 Emergency test available: Run emergencyTest() in console');
}
