import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { requestLoan } from "@/utils/supabaseRPC";

export const LoanRequestDebugger = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRPCFunction = async () => {
    if (!user) {
      addLog("Error: User not authenticated");
      return;
    }

    setLoading(true);
    addLog("Starting RPC function test...");

    try {
      const testParams = {
        borrowerName: user.name || 'Test User',
        borrowerEmail: user.email || 'test@example.com',
        amount: 1000,
        purpose: 'education',
        durationMonths: 6,
        interestRate: 2.5,
        description: 'Test loan request'
      };

      addLog(`Testing with params: ${JSON.stringify(testParams, null, 2)}`);

      const result = await requestLoan(testParams);
      addLog(`RPC result: ${JSON.stringify(result, null, 2)}`);

      if (result.success) {
        toast({
          title: "RPC Test Successful",
          description: `Created loan request with ID: ${result.request_id}`,
        });
      } else {
        toast({
          title: "RPC Test Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      addLog(`RPC error: ${error}`);
      toast({
        title: "RPC Test Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testDirectInsertion = async () => {
    if (!user) {
      addLog("Error: User not authenticated");
      return;
    }

    setLoading(true);
    addLog("Starting direct insertion test...");

    try {
      const { data, error } = await supabase
        .from('loan_agreements')
        .insert({
          borrower_id: user.id,
          borrower_name: user.name || 'Test User',
          borrower_email: user.email || 'test@example.com',
          lender_id: null,
          amount: 1000,
          purpose: 'education',
          duration_months: 6,
          interest_rate: 2.5,
          conditions: 'Test loan request',
          status: 'pending',
          payment_method: 'upi',
          smart_contract: false,
          created_at: new Date().toISOString()
        })
        .select();

      addLog(`Direct insertion result: ${JSON.stringify({ data, error }, null, 2)}`);

      if (error) {
        toast({
          title: "Direct Insertion Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Direct Insertion Successful",
          description: `Created loan request with ID: ${data?.[0]?.id}`,
        });
      }
    } catch (error) {
      addLog(`Direct insertion error: ${error}`);
      toast({
        title: "Direct Insertion Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTableStructure = async () => {
    addLog("Checking table structure...");

    try {      // Test if RPC function exists
      const { data: rpcData, error: rpcError } = await (supabase as any)
        .rpc('request_loan', {
          p_borrower_id: user?.id || 'test',
          p_borrower_name: 'Test',
          p_borrower_email: 'test@test.com',
          p_amount: 0.01, // Very small amount to avoid actual creation
          p_purpose: 'test',
          p_duration_months: 1,
          p_interest_rate: 0,
          p_description: 'test'
        });

      addLog(`RPC test result: ${JSON.stringify({ rpcData, rpcError }, null, 2)}`);

      // Check table structure
      const { data: tableData, error: tableError } = await supabase
        .from('loan_agreements')
        .select('*')
        .limit(1);

      addLog(`Table test result: ${JSON.stringify({ tableData, tableError }, null, 2)}`);

    } catch (error) {
      addLog(`Structure check error: ${error}`);
    }
  };

  const clearLog = () => {
    setDebugLog([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Loan Request Debugger</CardTitle>
        <CardDescription>
          Debug tool to test loan request creation functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testRPCFunction} disabled={loading}>
            Test RPC Function
          </Button>
          <Button onClick={testDirectInsertion} disabled={loading}>
            Test Direct Insertion
          </Button>
          <Button onClick={checkTableStructure} disabled={loading}>
            Check Structure
          </Button>
          <Button variant="outline" onClick={clearLog}>
            Clear Log
          </Button>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-2">Debug Log:</h4>
          <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
            {debugLog.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              <pre className="text-sm whitespace-pre-wrap">
                {debugLog.join('\n')}
              </pre>
            )}
          </div>
        </div>

        {user && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h5 className="font-semibold">Current User:</h5>
            <p>ID: {user.id}</p>
            <p>Name: {user.name || 'No name'}</p>
            <p>Email: {user.email || 'No email'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
