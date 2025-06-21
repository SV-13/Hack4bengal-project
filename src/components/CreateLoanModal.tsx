import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { InvitationFlow } from "./InvitationFlow";
import { formatCurrency, parseCurrency } from "@/utils/currency";
import { 
  DollarSign, 
  Users, 
  UserPlus, 
  Calculator, 
  FileText, 
  Send 
} from "lucide-react";

interface CreateLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateLoanModal = ({ open, onOpenChange }: CreateLoanModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [borrowerType, setBorrowerType] = useState<'existing' | 'new'>('existing');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('12');
  const [interestRate, setInterestRate] = useState('5.0');
  const [purpose, setPurpose] = useState('');
  const [conditions, setConditions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [smartContract, setSmartContract] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [createdAgreementId, setCreatedAgreementId] = useState<string>('');

  const calculateTotalReturn = () => {
    const principal = parseCurrency(amount) || 0;
    const rate = parseFloat(interestRate) || 0;
    const durationNum = parseFloat(duration) || 0;
    
    if (principal && rate && durationNum) {
      const interest = (principal * rate * durationNum) / (100 * 12); // Monthly interest
      return principal + interest;
    }
    return principal;
  };

  const handleCreateLoan = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a loan agreement.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || !duration || !borrowerEmail || !borrowerName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create loan agreement
      const { data: agreement, error } = await supabase
        .from('loan_agreements')
        .insert({
          lender_id: user.id,
          borrower_email: borrowerEmail,
          borrower_name: borrowerName,
          amount: parseCurrency(amount),
          interest_rate: parseFloat(interestRate),
          duration_months: parseInt(duration),
          purpose,
          conditions,
          payment_method: paymentMethod,
          smart_contract: smartContract,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedAgreementId(agreement.id);

      if (borrowerType === 'new') {
        // Show invitation flow for new users
        setShowInvitation(true);
      } else {
        // For existing users, we would send a notification
        toast({
          title: "Loan Agreement Created!",
          description: `Loan offer sent to ${borrowerName} for ${formatCurrency(parseCurrency(amount))}`,
        });
        onOpenChange(false);
      }

      // Reset form
      setBorrowerEmail('');
      setBorrowerName('');
      setAmount('');
      setDuration('12');
      setInterestRate('5.0');
      setPurpose('');
      setConditions('');
      setPaymentDetails({});

    } catch (error) {
      console.error('Error creating loan agreement:', error);
      toast({
        title: "Error",
        description: "Failed to create loan agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <DollarSign className="mr-2 h-6 w-6 text-green-600" />
              Create Loan Agreement
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Borrower Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Who are you lending to?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={borrowerType} onValueChange={(value) => setBorrowerType(value as 'existing' | 'new')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Existing User</TabsTrigger>
                    <TabsTrigger value="new" className="flex items-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite New User
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="existing" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="existing-email">Email Address</Label>
                      <Input
                        id="existing-email"
                        type="email"
                        value={borrowerEmail}
                        onChange={(e) => setBorrowerEmail(e.target.value)}
                        placeholder="borrower@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="existing-name">Full Name</Label>
                      <Input
                        id="existing-name"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="new" className="space-y-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Invite Someone New</h4>
                      <p className="text-sm text-blue-700">
                        We'll send them an invitation to join Lendit and accept your loan offer.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="new-email">Email Address</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={borrowerEmail}
                        onChange={(e) => setBorrowerEmail(e.target.value)}
                        placeholder="borrower@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-name">Full Name</Label>
                      <Input
                        id="new-name"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Loan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50000"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (months)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="1"
                      max="120"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="interest">Interest Rate (% annually)</Label>
                    <Input
                      id="interest"
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      min="0"
                      step="0.1"
                      placeholder="5.0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="purpose">Purpose of Loan</Label>
                  <Input
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Business expansion, emergency, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="conditions">Additional Terms & Conditions</Label>
                  <Textarea
                    id="conditions"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    placeholder="Any specific conditions or requirements..."
                    rows={3}
                  />
                </div>

                {/* Loan Summary */}
                {amount && duration && interestRate && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center text-green-800">
                        <FileText className="mr-2 h-5 w-5" />
                        Loan Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Principal Amount</p>
                          <p className="text-lg font-semibold">{formatCurrency(parseCurrency(amount) || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Interest</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(calculateTotalReturn() - (parseCurrency(amount) || 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Return</p>
                          <p className="text-xl font-bold text-green-800">
                            {formatCurrency(calculateTotalReturn())}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Monthly Payment</p>
                          <p className="text-lg font-semibold">
                            {duration ? formatCurrency(calculateTotalReturn() / parseFloat(duration)) : formatCurrency(0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              onPaymentDetails={setPaymentDetails}
              smartContract={smartContract}
              onSmartContractChange={setSmartContract}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLoan}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading || !amount || !borrowerEmail || !borrowerName}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {borrowerType === 'new' ? 'Create & Send Invitation' : 'Create Loan Agreement'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invitation Flow Modal */}
      <InvitationFlow
        open={showInvitation}
        onOpenChange={(open) => {
          setShowInvitation(open);
          if (!open) {
            onOpenChange(false); // Close parent modal too
          }
        }}
        agreementId={createdAgreementId}
        borrowerEmail={borrowerEmail}
        borrowerName={borrowerName}
      />
    </>
  );
};

export default CreateLoanModal;
