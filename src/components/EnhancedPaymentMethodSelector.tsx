/**
 * Enhanced Payment Method Selector with Real API Integration
 * Shows actual payment method capabilities and handles real payments
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { 
  PaymentMethod, 
  PaymentDetails, 
  PaymentResult,
  processPayment,
  getPaymentMethodCapabilities 
} from "@/utils/paymentProcessing";
import { formatCurrency } from "@/utils/currency";
import { getCryptoPrices } from "@/utils/cryptoProcessor";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  Bitcoin, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  QrCode,
  Copy
} from "lucide-react";

interface EnhancedPaymentMethodSelectorProps {
  amount: number;
  agreementId: string;
  payerId: string;
  recipientId: string;
  transactionType: 'disbursement' | 'repayment' | 'interest';
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
}

const paymentIcons = {
  upi: Smartphone,
  bank: Building2,
  wallet: Wallet,
  crypto: Bitcoin,
  cash: DollarSign,
};

export const EnhancedPaymentMethodSelector: React.FC<EnhancedPaymentMethodSelectorProps> = ({
  amount,
  agreementId,
  payerId,
  recipientId,
  transactionType,
  onSuccess,
  onError,
}) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<{ [key: string]: number }>({});
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<'ETH' | 'USDT'>('ETH');

  const capabilities = getPaymentMethodCapabilities();

  useEffect(() => {
    // Load crypto prices
    getCryptoPrices().then(setCryptoPrices).catch(console.error);
  }, []);

  const handlePayment = async () => {
    if (selectedMethod === 'crypto' && !walletAddress) {
      onError('Please enter wallet address for crypto payments');
      return;
    }

    if (amount > capabilities[selectedMethod].maxAmount) {
      onError(`Amount exceeds maximum limit for ${capabilities[selectedMethod].name}`);
      return;
    }

    setProcessing(true);
    setPaymentResult(null);

    try {
      const paymentDetails: PaymentDetails = {
        amount,
        agreementId,
        paymentMethod: selectedMethod,
        payerId,
        recipientId,
        transactionType,
        walletAddress: selectedMethod === 'crypto' ? walletAddress : undefined,
        metadata: {
          cryptocurrency: selectedMethod === 'crypto' ? selectedCrypto : undefined,
          useRazorpay: selectedMethod === 'upi' || selectedMethod === 'wallet',
        },
      };

      const result = await processPayment(paymentDetails);
      setPaymentResult(result);

      if (result.success) {
        onSuccess(result);
        toast({
          title: "Payment Initiated",
          description: result.message,
        });
      } else {
        onError(result.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      onError(errorMessage);
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getCryptoAmount = (crypto: string) => {
    const price = cryptoPrices[crypto];
    if (!price) return 'Loading...';
    return (amount / price).toFixed(crypto === 'BTC' ? 8 : 6);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const renderPaymentInstructions = () => {
    if (!paymentResult) return null;

    switch (selectedMethod) {
      case 'upi':
        if (paymentResult.metadata?.upiIntent) {
          return (
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Complete payment using your UPI app:</p>
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="text-sm font-mono">VPA: {paymentResult.metadata.vpa}</p>
                    <p className="text-sm font-mono">Amount: ₹{amount}</p>
                    <p className="text-sm font-mono">Ref: {paymentResult.metadata.transactionRef}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => window.open(paymentResult.metadata.upiIntent)}
                  >
                    Open UPI App
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        }
        break;

      case 'bank':
        if (paymentResult.metadata?.instructions) {
          return (
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Bank Transfer Instructions:</p>
                  <div className="bg-gray-100 p-3 rounded space-y-1">
                    {paymentResult.metadata.instructions.map((instruction: string, index: number) => (
                      <p key={index} className="text-sm font-mono">{instruction}</p>
                    ))}
                  </div>
                  <p className="text-sm text-orange-600">
                    Estimated time: {paymentResult.metadata.estimatedTime}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(paymentResult.metadata.reference)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Reference
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        }
        break;

      case 'crypto':
        if (paymentResult.metadata?.txHash) {
          return (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Crypto Payment Successful!</p>
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="text-sm font-mono">Transaction: {paymentResult.metadata.txHash}</p>
                    <p className="text-sm font-mono">
                      Block: {paymentResult.metadata.blockNumber}
                    </p>
                    <p className="text-sm font-mono">
                      Amount: {paymentResult.metadata.ethAmount || paymentResult.metadata.usdtAmount} {selectedCrypto}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://etherscan.io/tx/${paymentResult.metadata.txHash}`)}
                  >
                    View on Etherscan
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        }
        break;
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(capabilities).map(([method, capability]) => {
          const Icon = paymentIcons[method as PaymentMethod];
          const isSelected = selectedMethod === method;
          const isDisabled = amount > capability.maxAmount;

          return (
            <Card
              key={method}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && setSelectedMethod(method as PaymentMethod)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Icon className="h-5 w-5" />
                  <span>{capability.name}</span>
                  {capability.instant && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      Instant
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-2">{capability.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Max Amount:</span>
                    <span className="font-medium">
                      {capability.maxAmount === Number.MAX_SAFE_INTEGER 
                        ? 'No limit' 
                        : formatCurrency(capability.maxAmount)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fees:</span>
                    <span className="font-medium">{capability.fees === 0 ? 'Free' : capability.fees}</span>
                  </div>
                  {method === 'crypto' && cryptoPrices.ETH && (
                    <div className="space-y-1 pt-2 border-t">
                      <div className="flex justify-between">
                        <span>ETH:</span>
                        <span className="font-medium">{getCryptoAmount('ETH')} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>USDT:</span>
                        <span className="font-medium">{getCryptoAmount('USDT')} USDT</span>
                      </div>
                    </div>
                  )}
                </div>
                {isDisabled && (
                  <Badge variant="destructive" className="w-full mt-2 text-xs">
                    Amount too high
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional inputs for crypto payments */}
      {selectedMethod === 'crypto' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crypto Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cryptocurrency">Cryptocurrency</Label>
              <RadioGroup
                value={selectedCrypto}
                onValueChange={(value) => setSelectedCrypto(value as 'ETH' | 'USDT')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ETH" id="ETH" />
                  <Label htmlFor="ETH">Ethereum (ETH)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USDT" id="USDT" />
                  <Label htmlFor="USDT">Tether (USDT)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="walletAddress">Recipient Wallet Address</Label>
              <Input
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>

            {cryptoPrices[selectedCrypto] && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Amount to pay: <strong>{getCryptoAmount(selectedCrypto)} {selectedCrypto}</strong>
                  <br />
                  Rate: 1 {selectedCrypto} = ₹{cryptoPrices[selectedCrypto].toLocaleString()}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment summary and action */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-lg font-semibold">Amount: {formatCurrency(amount)}</p>
              <p className="text-sm text-gray-600">via {capabilities[selectedMethod].name}</p>
            </div>
            <Button
              onClick={handlePayment}
              disabled={processing || (selectedMethod === 'crypto' && !walletAddress)}
              className="min-w-[120px]"
            >
              {processing ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>

          {paymentResult && renderPaymentInstructions()}
        </CardContent>
      </Card>
    </div>
  );
};
