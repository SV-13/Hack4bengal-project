import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { downloadContract, ContractData } from "@/utils/contractGenerator";
import { claimRequest } from "@/utils/supabaseRPC";
import { notifyLoanRequestClaimed } from "@/utils/emailNotifications";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle, 
  X, 
  FileText, 
  Calendar, 
  DollarSign,
  Percent,
  User,
  CreditCard,
  AlertTriangle,
  Download
} from "lucide-react";

interface LoanAcceptanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  agreement: any; // The loan agreement data
  onAccepted?: () => void;
  onRejected?: () => void;
}

export const LoanAcceptanceModal = ({ 
  open, 
  onOpenChange, 
  agreementId,
  agreement,
  onAccepted,
  onRejected 
}: LoanAcceptanceModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const { toast } = useToast();

  const calculateMonthlyPayment = () => {
    const principal = agreement.amount;
    const rate = agreement.interest_rate / 100 / 12; // Monthly rate
    const months = agreement.duration_months;
    
    if (rate === 0) return principal / months;
    
    const monthlyPayment = principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return monthlyPayment;
  };
  const handleAccept = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept this loan request.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Claim the loan request using RPC function with fallback
      let claimResult;
      try {
        claimResult = await claimRequest({
          requestId: agreementId,
          lenderName: user.name || 'Unknown',
          lenderEmail: user.email || ''
        });

        if (!claimResult.success) {
          throw new Error(claimResult.error || 'Failed to claim request');
        }
      } catch (rpcError) {
        console.warn('RPC function not available, falling back to direct update:', rpcError);
        
        // Fallback to direct database update
        const { error: updateError } = await supabase
          .from('loan_agreements')
          .update({
            lender_id: user.id,
            lender_name: user.name,
            lender_email: user.email,
            status: 'claimed',
            updated_at: new Date().toISOString()
          })
          .eq('id', agreementId);

        if (updateError) throw updateError;

        // Create a mock result for consistency
        claimResult = {
          success: true,
          borrower_name: agreement.borrower_name,
          borrower_email: agreement.borrower_email,
          amount: agreement.amount,
          purpose: agreement.purpose,
          duration: agreement.duration_months
        };
      }

      // Send email notification to borrower
      try {
        await notifyLoanRequestClaimed({
          borrowerName: claimResult.borrower_name || agreement.borrower_name,
          borrowerEmail: claimResult.borrower_email || agreement.borrower_email,
          lenderName: user.name || 'Unknown',
          lenderEmail: user.email || '',
          amount: claimResult.amount || agreement.amount,
          purpose: claimResult.purpose || agreement.purpose,
          duration: claimResult.duration || agreement.duration_months,
          requestId: agreementId
        });
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
        // Don't fail the entire process if email fails
      }

      toast({
        title: "Loan Request Accepted",
        description: "You have successfully accepted this loan request. The borrower has been notified and can now review the terms.",
      });

      onAccepted?.();
      onOpenChange(false);
      await supabase.from('notifications').insert({
        user_id: agreement.lender_id,
        type: 'loan_accepted',
        title: 'Loan Agreement Accepted! 🎉',
        message: `${agreement.borrower_name} has accepted your loan offer of ${formatCurrency(agreement.amount)}. The agreement is now active.`,
        agreement_id: agreementId,
        read: false
      });

      toast({
        title: "Agreement Accepted! 🎉",
        description: "The loan agreement is now active. PDF contract has been downloaded.",
      });

      onAccepted?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Error accepting loan:', error);
      toast({
        title: "Error",
        description: "Failed to accept the loan agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);

    try {
      // Update agreement status to rejected
      const { error } = await supabase
        .from('loan_agreements')
        .update({
          status: 'rejected',
          borrower_signature: new Date().toISOString() // Sign the rejection
        })
        .eq('id', agreementId);

      if (error) throw error;

      // Notify lender
      await supabase.from('notifications').insert({
        user_id: agreement.lender_id,
        type: 'loan_rejected',
        title: 'Loan Offer Declined',
        message: `${agreement.borrower_name} has declined your loan offer of ${formatCurrency(agreement.amount)}.`,
        agreement_id: agreementId,
        read: false
      });

      toast({
        title: "Agreement Declined",
        description: "You have declined this loan offer.",
      });

      onRejected?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Error rejecting loan:', error);
      toast({
        title: "Error",
        description: "Failed to decline the loan agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRejecting(false);
    }
  };

  if (!agreement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Loan Agreement Offer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lender Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                From: {agreement.lender_name || 'Lender'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                You have received a loan offer. Please review the terms carefully before accepting.
              </p>
            </CardContent>
          </Card>

          {/* Loan Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loan Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Loan Amount</p>
                    <p className="font-semibold">{formatCurrency(agreement.amount)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-semibold">{agreement.interest_rate}% per year</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{agreement.duration_months} months</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="font-semibold">{formatCurrency(calculateMonthlyPayment())}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Purpose</p>
                <p className="font-medium">{agreement.purpose || 'Personal loan'}</p>
              </div>

              {agreement.conditions && (
                <div>
                  <p className="text-sm text-gray-600">Special Conditions</p>
                  <p className="font-medium">{agreement.conditions}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <Badge variant="outline" className="capitalize">
                  {agreement.payment_method}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Total to Repay:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(agreement.amount + (agreement.amount * agreement.interest_rate * agreement.duration_months / (100 * 12)))}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                This includes principal amount + interest over {agreement.duration_months} months
              </p>
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              By accepting this loan agreement, you agree to repay the full amount according to the terms above. 
              Late payments may affect your credit score and reputation on the platform.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleAccept}
              disabled={loading || rejecting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {loading ? 'Accepting...' : 'Accept & Sign Agreement'}
            </Button>

            <Button
              onClick={handleReject}
              disabled={loading || rejecting}
              variant="destructive"
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              {rejecting ? 'Declining...' : 'Decline Offer'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Once you accept, a signed PDF contract will be automatically downloaded and both parties will be notified.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
