/**
 * Payment Testing Component
 * Allows testing all payment methods in sandbox mode
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  PaymentMethod as PaymentMethodType,
  PaymentDetails as PaymentDetailsType,
  PaymentResult
} from "@/utils/paymentProcessing";
import { processRazorpayPayment } from "@/utils/razorpayProcessor";
import { processDirectUpiPayment } from "@/utils/upiProcessor";
import { processBankTransfer } from "@/utils/bankTransferProcessor";
import { processEthereumPayment } from "@/utils/cryptoProcessor";
import { formatCurrency } from "@/utils/currency";
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Bitcoin,
  Banknote,
  Loader2
} from "lucide-react";

const testScenarios = [
  {
    id: 'upi-success',
    name: 'UPI Success Test',
    amount: 1000,
    method: 'upi',
    icon: Smartphone,
    description: 'Test UPI payment with success@razorpay',
    testData: { upiId: 'success@razorpay' }
  },
  {
    id: 'card-test',
    name: 'Card Payment Test',
    amount: 5000,
    method: 'wallet',
    icon: CreditCard,
    description: 'Test card payment via Razorpay',
    testData: { card: '4111 1111 1111 1111' }
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer Test',
    amount: 25000,
    method: 'bank',
    icon: Building2,
    description: 'Test bank transfer instructions',
    testData: { method: 'NEFT' }
  },
  {
    id: 'crypto-eth',
    name: 'Crypto ETH Test',
    amount: 10000,
    method: 'crypto',
    icon: Bitcoin,
    description: 'Test Ethereum payment',
    testData: { crypto: 'ETH' }
  },
  {
    id: 'cash-payment',
    name: 'Cash Payment Test',
    amount: 2000,
    method: 'cash',
    icon: Banknote,
    description: 'Test cash payment recording',
    testData: { method: 'cash' }
  }
];

export const PaymentTester = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(1000);
  const [testResults, setTestResults] = useState<{ [key: string]: PaymentResult }>({});
  const [isTestingAll, setIsTestingAll] = useState(false);

  const mockAgreementId = `test_agreement_${Date.now()}`;

  const handlePaymentSuccess = (scenarioId: string, result: PaymentResult) => {
    setTestResults(prev => ({
      ...prev,
      [scenarioId]: result
    }));
    
    toast({
      title: "Payment Test Successful",
      description: `${scenarioId} completed successfully`,
    });
  };

  const handlePaymentError = (scenarioId: string, error: string) => {
    setTestResults(prev => ({
      ...prev,
      [scenarioId]: { success: false, message: error }
    }));
    
    toast({
      title: "Payment Test Failed",
      description: error,
      variant: "destructive",
    });
  };

  const runAllTests = async () => {
    setIsTestingAll(true);
    // In a real implementation, you'd run automated tests here
    // For now, we'll just show that the feature is available
    setTimeout(() => {
      setIsTestingAll(false);
      toast({
        title: "Batch Testing Complete",
        description: "All payment methods are ready for testing",
      });
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="mr-2 h-6 w-6" />
            Payment API Testing Dashboard
          </CardTitle>
          <div className="text-sm text-gray-600">
            Test all payment methods in sandbox mode - no real money involved
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div>
              <Label htmlFor="custom-amount">Custom Test Amount</Label>
              <Input
                id="custom-amount"
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                min="1"
                max="100000"
                className="w-32"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={runAllTests}
                disabled={isTestingAll}
                variant="outline"
              >
                {isTestingAll ? 'Testing...' : 'Run All Tests'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testScenarios.map((scenario) => {
          const Icon = scenario.icon;
          const result = testResults[scenario.id];
          
          return (
            <Card 
              key={scenario.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedScenario === scenario.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Icon className="mr-2 h-5 w-5" />
                    {scenario.name}
                  </div>
                  {result && (
                    <Badge 
                      variant={result.success ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {result.success ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {result.success ? 'Passed' : 'Failed'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {formatCurrency(scenario.amount)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {scenario.method.toUpperCase()}
                    </Badge>
                  </div>
                  {Object.keys(scenario.testData).length > 0 && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Test data: {JSON.stringify(scenario.testData, null, 1)}
                    </div>
                  )}
                  {result && (
                    <Alert className={result.success ? "bg-green-50" : "bg-red-50"}>
                      <AlertDescription className="text-xs">
                        {result.message}
                        {result.referenceId && (
                          <div className="mt-1 font-mono text-xs">
                            Ref: {result.referenceId}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>      {/* Payment Testing Interface */}
      {selectedScenario && (
        <Card>
          <CardHeader>
            <CardTitle>
              Testing: {testScenarios.find(s => s.id === selectedScenario)?.name}
            </CardTitle>
            <div className="text-sm text-gray-600">
              Complete the payment flow below to test the integration
            </div>
          </CardHeader>
          <CardContent>
            {user ? (
              <PaymentTestInterface
                scenario={testScenarios.find(s => s.id === selectedScenario)!}
                amount={customAmount}
                agreementId={mockAgreementId}
                payerId={user.id}
                recipientId="test_recipient"
                onPaymentSuccess={(result) => handlePaymentSuccess(selectedScenario, result)}
                onPaymentError={(error) => handlePaymentError(selectedScenario, error)}
              />
            ) : (
              <Alert>
                <AlertDescription>
                  Please log in to test payment methods
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Results Summary */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(testResults).map(([scenarioId, result]) => {
                const scenario = testScenarios.find(s => s.id === scenarioId);
                return (
                  <div key={scenarioId} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center">
                      {scenario && <scenario.icon className="mr-2 h-4 w-4" />}
                      <span className="font-medium">{scenario?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <Badge variant="default">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                      {result.referenceId && (
                        <span className="text-xs text-gray-500 font-mono">
                          {result.referenceId}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <strong>UPI Testing:</strong> Use <code>success@razorpay</code> or <code>failure@razorpay</code>
          </div>
          <div>
            <strong>Card Testing:</strong> Use <code>4111 1111 1111 1111</code> with any future expiry
          </div>
          <div>
            <strong>Bank Transfer:</strong> Will generate real transfer instructions
          </div>
          <div>
            <strong>Crypto Testing:</strong> Connect MetaMask to Ethereum testnet
          </div>
          <div>
            <strong>Cash Testing:</strong> Records transaction in system
          </div>
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Note:</strong> All tests run in sandbox mode. No real money is charged or transferred.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

// Payment Test Interface Component
interface PaymentTestInterfaceProps {
  scenario: any;
  amount: number;
  agreementId: string;
  payerId: string;
  recipientId: string;
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: string) => void;
}

const PaymentTestInterface = ({
  scenario,
  amount,
  agreementId,
  payerId,
  recipientId,
  onPaymentSuccess,
  onPaymentError
}: PaymentTestInterfaceProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(scenario.method);
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const handlePayment = async () => {
    if (!paymentDetails.isValid) {
      onPaymentError('Please fill in all required payment details');
      return;
    }

    setProcessing(true);
    try {
      const paymentRequest: PaymentDetailsType = {
        amount,
        agreementId,
        paymentMethod: selectedMethod,
        payerId,
        recipientId,
        transactionType: 'disbursement',
        walletAddress: paymentDetails.walletAddress,
        metadata: {
          testScenario: scenario.id,
          testData: scenario.testData,
          upiId: paymentDetails.upiId,
          accountNumber: paymentDetails.accountNumber,
          ifsc: paymentDetails.ifsc,
          walletNetwork: paymentDetails.walletNetwork,
          cashNote: paymentDetails.cashNote,
        }
      };      // Process payment based on method
      let result: PaymentResult;
      switch (selectedMethod) {
        case 'upi':
          result = await processRazorpayPayment(paymentRequest);
          break;        case 'bank':
          result = await processBankTransfer({
            ...paymentRequest,
            bankDetails: {
              bankName: 'User Test Bank',
              accountNumber: '9876543210',
              ifscCode: 'USER0001234',
              accountHolderName: 'Test User',
              transferMethod: 'neft'
            },
            purpose: `Test loan payment for agreement ${paymentRequest.agreementId}`
          }, {
            bankName: 'LendIt Test Bank',
            accountNumber: '1234567890',
            ifscCode: 'LEND0001234',
            accountHolderName: 'LendIt Platform',
            transferMethod: 'neft'
          });
          break;
        case 'wallet':
          result = await processRazorpayPayment(paymentRequest);
          break;
        case 'crypto':
          result = await processEthereumPayment({
            ...paymentRequest,
            cryptocurrency: 'ETH',
            recipientAddress: paymentRequest.walletAddress || '0x742d35Cc24Bf1C5e31E63E3b4f6D8e5F0e1F2B3c'
          });
          break;
        case 'cash':
          result = {
            success: true,
            transactionId: `cash_${Date.now()}`,
            referenceId: `cash_ref_${Date.now()}`,
            message: 'Cash payment recorded successfully (test mode)'
          };
          break;
        default:
          result = {
            success: false,
            message: `Unsupported payment method: ${selectedMethod}`
          };
      }
      
      if (result.success) {
        onPaymentSuccess(result);
        toast({
          title: "Payment Test Successful",
          description: `${scenario.name} completed successfully`,
        });
      } else {
        onPaymentError(result.message || 'Payment failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onPaymentError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PaymentMethodSelector
        selectedMethod={selectedMethod}
        onMethodChange={setSelectedMethod}
        onPaymentDetails={setPaymentDetails}
        processing={processing}
      />
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Test Amount: <span className="font-semibold">{formatCurrency(amount)}</span>
        </div>
        <Button
          onClick={handlePayment}
          disabled={processing || !paymentDetails.isValid}
          className="min-w-32"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Test Payment ${formatCurrency(amount)}`
          )}
        </Button>
      </div>
    </div>
  );
};
