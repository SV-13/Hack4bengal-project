import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';

interface SimpleTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SimpleTestModal = ({ open, onOpenChange }: SimpleTestModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      // Test 1: Check if we can connect to Supabase
      const { data: testData, error: testError } = await supabase
        .from('loan_agreements')
        .select('id')
        .limit(1);

      console.log('Connection test:', { testData, testError });

      if (testError) {
        throw new Error(`Connection failed: ${testError.message}`);
      }

      toast({
        title: "Database Connection OK",
        description: "Can connect to loan_agreements table",
      });

    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSimpleInsert = async () => {
    if (!user) {
      toast({
        title: "No User",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('User info:', { id: user.id, email: user.email, name: user.name });

      // Test minimal insert
      const { data, error } = await supabase
        .from('loan_agreements')
        .insert({
          borrower_id: user.id,
          borrower_name: user.name || 'Test User',
          borrower_email: user.email || 'test@test.com',
          amount: 100,
          purpose: 'test',
          duration_months: 1,
          status: 'pending'
        })
        .select();

      console.log('Insert result:', { data, error });

      if (error) {
        throw new Error(`Insert failed: ${error.message}`);
      }

      toast({
        title: "Insert Success! 🎉",
        description: `Created test record with ID: ${data[0]?.id}`,
      });

    } catch (error: any) {
      console.error('Insert test failed:', error);
      toast({
        title: "Insert Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTableStructure = async () => {
    setLoading(true);
    try {
      // This won't work in browser, but we can try a different approach
      const { data, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .limit(1);

      console.log('Table structure test:', { data, error });

      if (error) {
        throw new Error(`Structure check failed: ${error.message}`);
      }

      const sampleRecord = data[0];
      if (sampleRecord) {
        console.log('Sample record fields:', Object.keys(sampleRecord));
        toast({
          title: "Structure Check",
          description: `Found ${Object.keys(sampleRecord).length} columns in table`,
        });
      } else {
        toast({
          title: "Empty Table",
          description: "Table exists but no records found",
        });
      }

    } catch (error: any) {
      console.error('Structure check failed:', error);
      toast({
        title: "Structure Check Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Database Test Panel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button 
            onClick={testDatabaseConnection} 
            disabled={loading}
            className="w-full"
          >
            Test Database Connection
          </Button>

          <Button 
            onClick={checkTableStructure} 
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            Check Table Structure
          </Button>

          <Button 
            onClick={testSimpleInsert} 
            disabled={loading}
            className="w-full"
            variant="secondary"
          >
            Test Simple Insert
          </Button>

          {user && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              <strong>Current User:</strong><br/>
              ID: {user.id}<br/>
              Email: {user.email}<br/>
              Name: {user.name || 'Not set'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
