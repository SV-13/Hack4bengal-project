/**
 * Enhanced Payment Method Selector with Real API Integration
 * Shows actual payment method capabilities and handles real payments
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Copy,
  Banknote,
  Shield
} from "lucide-react";
import { PAYMENT_TEST_DATA, PAYMENT_TEST_INSTRUCTIONS } from '@/config/paymentConfig';
import { PaymentTestHelp } from './PaymentTestHelp';
import { Switch } from "@/components/ui/switch";
import { Loader2, Wand2 } from "lucide-react";
import type { LucideIcon } from 'lucide-react';

// Extended PaymentDetails interface to include UI-specific fields
interface ExtendedPaymentDetails extends PaymentDetails {
  upiId?: string;
  accountNumber?: string;
  ifsc?: string;
  walletId?: string;
  walletNetwork?: string;
  cashNote?: string;
  isValid?: boolean;
}

interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  fees: string;
}

const paymentMethods: PaymentMethodInfo[] = [
  {
    id: 'upi',
    name: 'UPI',
    icon: <Smartphone className="h-5 w-5" />,
    description: 'Pay using any UPI app like GPay, PhonePe, Paytm',
    processingTime: 'Instant',
    fees: 'Free'
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Direct bank account transfer via NEFT/IMPS',
    processingTime: '2-24 hours',
    fees: 'Free'
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Paytm, Amazon Pay, or other digital wallets',
    processingTime: 'Instant',
    fees: '1-2%'
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    icon: <Bitcoin className="h-5 w-5" />,
    description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies',
    processingTime: '10-60 minutes',
    fees: 'Network fees apply'
  },
  {
    id: 'cash',
    name: 'Cash',
    icon: <Banknote className="h-5 w-5" />,
    description: 'In-person cash transaction',
    processingTime: 'Instant',
    fees: 'Free'
  }
];

interface PaymentMethodSelectorProps {
  amount: number;
  agreementId: string;
  payerId: string;
  recipientId: string;
  transactionType: 'disbursement' | 'repayment' | 'interest';
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  onPaymentDetails: (details: ExtendedPaymentDetails) => void;
  smartContract?: boolean;
  onSmartContractChange?: (enabled: boolean) => void;
  showSmartContractOption?: boolean;
  processing?: boolean;
  error?: string | null;
  success?: boolean;
}

const paymentIcons: Record<PaymentMethod, LucideIcon> = {
  upi: Smartphone,
  bank: Building2,
  wallet: Wallet,
  crypto: Bitcoin,
  cash: DollarSign,
};

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  agreementId,
  payerId,
  recipientId,
  transactionType,
  onSuccess,
  onError,
  selectedMethod,
  onMethodChange,
  onPaymentDetails,
  smartContract = false,
  onSmartContractChange,
  showSmartContractOption = false,
  processing = false,
  error = null,
  success = false
}) => {
  const { toast } = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState<'ETH' | 'USDT'>('ETH');
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoPrices, setCryptoPrices] = useState<{ [key: string]: number }>({});
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<ExtendedPaymentDetails>({
    amount,
    agreementId,
    payerId,
    recipientId,
    transactionType
  });
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const capabilities = getPaymentMethodCapabilities();

  useEffect(() => {
    // Initialize payment details with props
    setPaymentDetails({
      amount,
      agreementId,
      payerId,
      recipientId,
      transactionType,
      paymentMethod: selectedMethod
    });
    
    // Load crypto prices
    getCryptoPrices().then(setCryptoPrices).catch(console.error);
  }, [amount, agreementId, payerId, recipientId, transactionType, selectedMethod]);

  const handlePayment = async () => {
    if (selectedMethod === 'crypto' && !paymentDetails.walletAddress) {
      onError('Please enter wallet address for crypto payments');
      return;
    }

    if (amount > capabilities[selectedMethod].maxAmount) {
      onError(`Amount exceeds maximum limit for ${capabilities[selectedMethod].name}`);
      return;
    }

    setIsProcessingPayment(true);
    setPaymentResult(null);

    try {
      const processedPaymentDetails: PaymentDetails = {
        amount,
        agreementId,
        paymentMethod: selectedMethod,
        payerId,
        recipientId,
        transactionType,
        walletAddress: paymentDetails.walletAddress,
        metadata: {
          cryptocurrency: selectedMethod === 'crypto' ? selectedCrypto : undefined,
          useRazorpay: selectedMethod === 'upi' || selectedMethod === 'wallet',
        }
      };

      if (selectedMethod === 'upi' && paymentDetails.upiId) {
        processedPaymentDetails.metadata.upiId = paymentDetails.upiId;
      }
      if (selectedMethod === 'bank') {
        if (paymentDetails.accountNumber) processedPaymentDetails.metadata.accountNumber = paymentDetails.accountNumber;
        if (paymentDetails.ifsc) processedPaymentDetails.metadata.ifsc = paymentDetails.ifsc;
      }
      if (selectedMethod === 'wallet' && paymentDetails.walletId) {
        processedPaymentDetails.metadata.walletId = paymentDetails.walletId;
      }
      if (selectedMethod === 'crypto') {
        if (paymentDetails.walletAddress) processedPaymentDetails.metadata.walletAddress = paymentDetails.walletAddress;
        if (paymentDetails.walletNetwork) processedPaymentDetails.metadata.network = paymentDetails.walletNetwork;
      }
      if (selectedMethod === 'cash' && paymentDetails.cashNote) {
        processedPaymentDetails.metadata.note = paymentDetails.cashNote;
      }

      const result = await processPayment(processedPaymentDetails);
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
      setIsProcessingPayment(false);
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

  // Validation functions
  const validateUPI = (upiId: string): boolean => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
    return upiRegex.test(upiId);
  };

  const validateAccountNumber = (accountNumber: string): boolean => {
    return /^\d{9,18}$/.test(accountNumber);
  };

  const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc.toUpperCase());
  };

  const validateWalletAddress = (address: string): boolean => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const validatePhone = (phone: string): boolean => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  // Validate payment details when they change
  useEffect(() => {
    let valid = false;
    
    switch (selectedMethod) {
      case 'upi':
        valid = Boolean(paymentDetails.upiId && paymentDetails.upiId.includes('@'));
        break;
      case 'bank':
        valid = Boolean(
          paymentDetails.accountNumber && 
          paymentDetails.accountNumber.length >= 8 &&
          paymentDetails.ifsc && 
          paymentDetails.ifsc.length >= 8
        );
        break;
      case 'wallet':
        valid = Boolean(paymentDetails.walletId);
        break;
      case 'crypto':
        valid = Boolean(
          paymentDetails.walletAddress && 
          paymentDetails.walletAddress.length >= 30 && 
          paymentDetails.walletNetwork
        );
        break;
      case 'cash':
        valid = true; // Cash is always valid
        break;
      default:
        valid = false;
    }

    setIsValid(valid);
    onPaymentDetails({...paymentDetails, isValid: valid});
  }, [paymentDetails, selectedMethod]);

  const handleMethodChange = (value: string) => {
    onMethodChange(value as PaymentMethod);
    setPaymentDetails({
      amount,
      agreementId,
      payerId,
      recipientId,
      transactionType,
      paymentMethod: value as PaymentMethod
    });
    setIsValid(false);
  };

  // Handle autofill for payment details based on selected method
  const handleAutofill = () => {
    switch (selectedMethod) {
      case 'upi':
        setPaymentDetails({
          ...paymentDetails,
          upiId: PAYMENT_TEST_DATA.upi.success
        });
        break;
      case 'bank':
        setPaymentDetails({
          ...paymentDetails,
          accountNumber: PAYMENT_TEST_DATA.bank.accountNumber,
          ifsc: PAYMENT_TEST_DATA.bank.ifsc
        });
        break;
      case 'wallet':
        setPaymentDetails({
          ...paymentDetails,
          walletId: PAYMENT_TEST_DATA.wallet.phoneNumber
        });
        break;
      case 'crypto':
        setPaymentDetails({
          ...paymentDetails,
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          walletNetwork: 'ETH'
        });
        break;
      case 'cash':
        setPaymentDetails({
          ...paymentDetails,
          cashNote: 'Will exchange cash in person at agreed location'
        });
        break;
    }
  };

  const renderPaymentDetails = () => {
    switch (selectedMethod) {
      case 'upi':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="upi-id">UPI ID *</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAutofill} 
                  className="h-7 text-xs flex items-center gap-1"
                  disabled={processing}
                >
                  <Wand2 className="h-3 w-3" />
                  Autofill
                </Button>
              </div>
              <Input
                id="upi-id"
                placeholder="yourname@paytm"
                value={paymentDetails.upiId || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, upiId: e.target.value };
                  setPaymentDetails(details);
                }}
                disabled={processing}
                className={paymentDetails.upiId && !validateUPI(paymentDetails.upiId) ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your UPI ID in the format username@provider (e.g., name@paytm, name@gpay)
              </p>
              {paymentDetails.upiId && !validateUPI(paymentDetails.upiId) && (
                <p className="text-xs text-red-500 mt-1">
                  Please enter a valid UPI ID
                </p>
              )}
            </div>
            {paymentDetails.upiId && validateUPI(paymentDetails.upiId) && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  UPI payment method configured successfully
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
      
      case 'bank':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAutofill} 
                className="h-7 text-xs flex items-center gap-1 mb-2"
                disabled={processing}
              >
                <Wand2 className="h-3 w-3" />
                Autofill Test Data
              </Button>
            </div>
            <div>
              <Label htmlFor="account-number">Account Number *</Label>
              <Input
                id="account-number"
                placeholder="1234567890123456"
                value={paymentDetails.accountNumber || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, accountNumber: e.target.value };
                  setPaymentDetails(details);
                }}
                disabled={processing}
                maxLength={18}
                className={paymentDetails.accountNumber && !validateAccountNumber(paymentDetails.accountNumber) ? 'border-red-500' : ''}
              />
              {paymentDetails.accountNumber && !validateAccountNumber(paymentDetails.accountNumber) && (
                <p className="text-xs text-red-500 mt-1">
                  Account number should be 9-18 digits
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="ifsc">IFSC Code *</Label>
              <Input
                id="ifsc"
                placeholder="SBIN0001234"
                value={paymentDetails.ifsc || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, ifsc: e.target.value.toUpperCase() };
                  setPaymentDetails(details);
                }}
                disabled={processing}
              />
            </div>
          </div>
        );
      
      case 'wallet':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="wallet-id">Mobile Number / Wallet ID *</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAutofill} 
                className="h-7 text-xs flex items-center gap-1"
                disabled={processing}
              >
                <Wand2 className="h-3 w-3" />
                Autofill
              </Button>
            </div>
            <Input
              id="wallet-id"
              placeholder="9876543210"
              value={paymentDetails.walletId || ''}
              onChange={(e) => {
                const details = { ...paymentDetails, walletId: e.target.value };
                setPaymentDetails(details);
              }}
              disabled={processing}
            />
            <p className="text-xs text-gray-500">
              Enter your registered mobile number for wallets like Paytm, PhonePe, etc.
            </p>
          </div>
        );
      
      case 'crypto':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="wallet-address">Wallet Address *</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAutofill} 
                className="h-7 text-xs flex items-center gap-1"
                disabled={processing}
              >
                <Wand2 className="h-3 w-3" />
                Autofill
              </Button>
            </div>
            <Input
              id="wallet-address"
              placeholder="0x..."
              value={paymentDetails.walletAddress || ''}
              onChange={(e) => {
                const details = { ...paymentDetails, walletAddress: e.target.value };
                setPaymentDetails(details);
              }}
              disabled={processing}
            />
            <div>
              <Label htmlFor="wallet-network">Network *</Label>
              <RadioGroup
                value={paymentDetails.walletNetwork || ''}
                onValueChange={(value) => {
                  const details = { ...paymentDetails, walletNetwork: value };
                  setPaymentDetails(details);
                }}
                disabled={processing}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ETH" id="eth" />
                  <Label htmlFor="eth">Ethereum</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BSC" id="bsc" />
                  <Label htmlFor="bsc">Binance Smart Chain</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MATIC" id="matic" />
                  <Label htmlFor="matic">Polygon (MATIC)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      
      case 'cash':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="cash-note">Note (optional)</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAutofill} 
                className="h-7 text-xs flex items-center gap-1"
                disabled={processing}
              >
                <Wand2 className="h-3 w-3" />
                Autofill
              </Button>
            </div>
            <Input
              id="cash-note"
              placeholder="Add any note about the cash transfer"
              value={paymentDetails.cashNote || ''}
              onChange={(e) => {
                const details = { ...paymentDetails, cashNote: e.target.value };
                setPaymentDetails(details);
              }}
              disabled={processing}
            />
            <p className="text-xs text-gray-500">
              Cash transactions should comply with local regulations and are at your own risk.
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };
  return (
    <div className="space-y-6">      {/* Test Mode Instructions */}
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="font-medium">🧪 Test Mode Active - No Real Money Will Be Charged</div>
              {selectedMethod && PAYMENT_TEST_INSTRUCTIONS[selectedMethod] && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">{PAYMENT_TEST_INSTRUCTIONS[selectedMethod].title}</div>
                  <div className="text-xs">{PAYMENT_TEST_INSTRUCTIONS[selectedMethod].description}</div>
                  <ul className="text-xs space-y-1 ml-4">
                    {PAYMENT_TEST_INSTRUCTIONS[selectedMethod].instructions.map((instruction, index) => (
                      <li key={index} className="list-disc">{instruction}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <PaymentTestHelp selectedMethod={selectedMethod} />
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => {
          const Icon = paymentIcons[method.id as PaymentMethod];
          const isSelected = selectedMethod === method.id;
          const isDisabled = amount > capabilities[method.id].maxAmount;

          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && handleMethodChange(method.id as PaymentMethod)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Icon className="h-5 w-5" />
                  <span>{method.name}</span>
                  {method.processingTime === 'Instant' && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {method.processingTime}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-2">{method.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Max Amount:</span>
                    <span className="font-medium">
                      {capabilities[method.id].maxAmount === Number.MAX_SAFE_INTEGER 
                        ? 'No limit' 
                        : formatCurrency(capabilities[method.id].maxAmount)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fees:</span>
                    <span className="font-medium">{method.fees === 'Free' ? 'Free' : method.fees}</span>
                  </div>
                  {method.id === 'crypto' && cryptoPrices.ETH && (
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

      {/* Smart Contract Option */}
      {showSmartContractOption && onSmartContractChange && (
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smart-contract" className="flex items-center">
                <Shield className="mr-2 h-4 w-4 text-blue-600" />
                Use Smart Contract
              </Label>
              <p className="text-sm text-gray-500">
                Secure your loan with a blockchain smart contract
              </p>
            </div>
            <Switch
              id="smart-contract"
              checked={smartContract}
              onCheckedChange={onSmartContractChange}
              disabled={processing}
            />
          </div>
        </div>
      )}

      {/* Payment Details */}
      {selectedMethod && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              {(() => {
                const Icon = paymentIcons[selectedMethod];
                return <Icon className="h-5 w-5 mr-2" />;
              })()}
              <span>
                {selectedMethod} Details
              </span>
            </CardTitle>
            <CardDescription>
              Enter your payment details for {selectedMethod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processing ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="ml-3">Processing payment...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : success ? (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>Payment successful! Your transaction has been processed.</AlertDescription>
              </Alert>
            ) : (
              renderPaymentDetails()
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
              disabled={processing || isProcessingPayment || !isValid}
              className="min-w-[120px]"
            >
              {processing || isProcessingPayment ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>

          {paymentResult && renderPaymentInstructions()}
        </CardContent>
      </Card>
    </div>
  );
};
