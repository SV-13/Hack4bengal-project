import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3 } from "@/contexts/Web3Context";
import { formatCurrency, parseCurrency } from "@/utils/currency";
import { downloadContract, ContractData } from "@/utils/contractGenerator";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { 
  Wallet, 
  FileText, 
  Shield, 
  AlertCircle, 
  Download,
  Loader2
} from "lucide-react";

interface CryptoLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CryptoLoanModal = ({ open, onOpenChange }: CryptoLoanModalProps) => {
  const [formData, setFormData] = useState({
    borrowerName: '',
    borrowerEmail: '',
    borrowerAddress: '',
    borrowerWallet: '',
    amount: '',
    duration: '12',
    interestRate: '5.0',
    purpose: '',
    conditions: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [useSmartContract, setUseSmartContract] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const { user } = useAuth();
  const { account, isConnected, connectWallet, createLoanContract, loading: web3Loading } = useWeb3();
  const { toast } = useToast();

  const calculateMonthlyPayment = () => {
    const principal = parseCurrency(formData.amount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const duration = parseFloat(formData.duration) || 0;
    
    if (principal && rate && duration) {
      const monthlyRate = rate / 100 / 12;
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);
      return monthlyPayment;
    }
    return 0;
  };

  const calculateTotalRepayment = () => {
    const monthlyPayment = calculateMonthlyPayment();
    const duration = parseFloat(formData.duration) || 0;
    return monthlyPayment * duration;
  };

  const handleCreateLoan = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a loan.",
        variant: "destructive",
      });
      return;
    }

    if (useSmartContract && !isConnected) {
      try {
        await connectWallet();
      } catch (error: any) {
        toast({
          title: "Wallet Connection Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsCreating(true);

    try {
      let contractHash = '';
      
      if (useSmartContract && isConnected) {
        // Create smart contract
        contractHash = await createLoanContract({
          borrowerAddress: formData.borrowerWallet,
          amount: formData.amount,
          interestRate: parseFloat(formData.interestRate),
          durationMonths: parseInt(formData.duration),
          purpose: formData.purpose
        });

        toast({
          title: "Smart Contract Created",
          description: `Contract deployed: ${contractHash}`,
        });
      }

      // Generate PDF contract
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + parseInt(formData.duration));

      const contractData: ContractData = {
        lenderName: user.name,
        lenderAddress: 'Lender Address', // You might want to collect this
        borrowerName: formData.borrowerName,
        borrowerAddress: formData.borrowerAddress,
        amount: parseCurrency(formData.amount) || 0,
        interestRate: parseFloat(formData.interestRate),
        durationMonths: parseInt(formData.duration),
        purpose: formData.purpose,
        startDate,
        endDate,
        monthlyPayment: calculateMonthlyPayment(),
        totalRepayment: calculateTotalRepayment(),
        walletAddress: account || undefined,
        contractHash: contractHash || undefined
      };

      // Download the contract
      downloadContract(contractData);

      toast({
        title: "Loan Created Successfully",
        description: "Smart contract deployed and PDF contract generated!",
      });

      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error creating loan:', error);
      toast({
        title: "Error Creating Loan",
        description: error.message || "Failed to create loan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Wallet className="mr-2 h-6 w-6 text-blue-600" />
            Create Crypto Loan Agreement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Blockchain Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smart-contract">Enable Smart Contract</Label>
                  <p className="text-sm text-gray-600">Automatically enforce loan terms on blockchain</p>
                </div>
                <Switch
                  id="smart-contract"
                  checked={useSmartContract}
                  onCheckedChange={setUseSmartContract}
                />
              </div>
              
              {useSmartContract && (
                <div className="space-y-3">
                  {!isConnected ? (
                    <div className="flex items-center space-x-4">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm">Wallet not connected</span>
                      <Button 
                        onClick={connectWallet} 
                        disabled={web3Loading}
                        size="sm"
                      >
                        {web3Loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect Wallet'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
              <CardDescription>Enter the borrower information and loan terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="borrower-name">Borrower Name</Label>
                  <Input
                    id="borrower-name"
                    value={formData.borrowerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, borrowerName: e.target.value }))}
                    placeholder="Full legal name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="borrower-email">Borrower Email</Label>
                  <Input
                    id="borrower-email"
                    type="email"
                    value={formData.borrowerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, borrowerEmail: e.target.value }))}
                    placeholder="borrower@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="borrower-address">Borrower Address</Label>
                <Textarea
                  id="borrower-address"
                  value={formData.borrowerAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, borrowerAddress: e.target.value }))}
                  placeholder="Full legal address"
                  rows={2}
                />
              </div>

              {useSmartContract && (
                <div>
                  <Label htmlFor="borrower-wallet">Borrower Wallet Address</Label>
                  <Input
                    id="borrower-wallet"
                    value={formData.borrowerWallet}
                    onChange={(e) => setFormData(prev => ({ ...prev, borrowerWallet: e.target.value }))}
                    placeholder="0x..."
                    required={useSmartContract}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Loan Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="10000"
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
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="interest">Interest Rate (% annually)</Label>
                  <Input
                    id="interest"
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="purpose">Purpose of Loan</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Business expansion, education, etc."
                  rows={2}
                  required
                />
              </div>

              <div>
                <Label htmlFor="conditions">Additional Conditions</Label>
                <Textarea
                  id="conditions"
                  value={formData.conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                  placeholder="Any additional terms or conditions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            onPaymentDetails={setPaymentDetails}
            smartContract={useSmartContract}
            onSmartContractChange={setUseSmartContract}
          />

          {/* Loan Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <FileText className="mr-2 h-5 w-5" />
                Loan Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Principal Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(parseCurrency(formData.amount) || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Payment</p>
                  <p className="text-lg font-semibold">{formatCurrency(calculateMonthlyPayment())}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Interest</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(calculateTotalRepayment() - (parseCurrency(formData.amount) || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Repayment</p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatCurrency(calculateTotalRepayment())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLoan}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isCreating || (useSmartContract && !isConnected)}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Create Loan & Generate Contract
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoLoanModal;
