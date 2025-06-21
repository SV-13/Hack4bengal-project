import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  PaymentMethod as PaymentMethodType, 
  PaymentDetails as PaymentDetailsType, 
  PaymentResult,
  processPayment
} from '@/utils/paymentProcessing';
import { formatCurrency } from '@/utils/currency';
import { getCryptoPrices } from '@/utils/cryptoProcessor';
import { 
  Smartphone, 
  Building2, 
  Wallet, 
  Bitcoin, 
  Banknote,
  Shield,
  AlertCircle,
  Check,
  CheckCircle,
  Loader2,
  Clock,
  Copy,
  QrCode
} from "lucide-react";

// Local payment method capabilities function
const getPaymentMethodCapabilities = () => {
  return {
    upi: {
      name: 'UPI',
      instant: true,
      maxAmount: 100000, // ₹1 lakh
      fees: 0,
      description: 'Instant payment via UPI apps'
    },
    bank: {
      name: 'Bank Transfer',
      instant: false,
      maxAmount: 10000000, // ₹1 crore
      fees: 0,
      description: 'NEFT/RTGS/IMPS bank transfer'
    },
    wallet: {
      name: 'Digital Wallet',
      instant: true,
      maxAmount: 200000, // ₹2 lakhs
      fees: 0,
      description: 'Paytm, PhonePe, Google Pay, etc.'
    },
    crypto: {
      name: 'Cryptocurrency',
      instant: false,
      maxAmount: Number.MAX_SAFE_INTEGER,
      fees: 'Variable',
      description: 'ETH, USDT, BTC payments'
    },
    cash: {
      name: 'Cash',
      instant: true,
      maxAmount: 200000, // ₹2 lakhs (regulatory limit)
      fees: 0,
      description: 'Physical cash payment'
    }
  };
};

interface PaymentMethodInfo {
  id: PaymentMethodType;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  fees: string;
  maxAmount?: number;
  instant?: boolean;
}

// Get dynamic payment method info from capabilities
const getPaymentMethods = (): PaymentMethodInfo[] => {
  const capabilities = getPaymentMethodCapabilities();
  return [
    {
      id: 'upi',
      name: capabilities.upi.name,
      icon: <Smartphone className="h-5 w-5" />,
      description: capabilities.upi.description,
      processingTime: capabilities.upi.instant ? 'Instant' : '2-4 hours',
      fees: 'Free',
      maxAmount: capabilities.upi.maxAmount,
      instant: capabilities.upi.instant
    },
    {
      id: 'bank',
      name: capabilities.bank.name,
      icon: <Building2 className="h-5 w-5" />,
      description: capabilities.bank.description,
      processingTime: capabilities.bank.instant ? 'Instant' : '2-24 hours',
      fees: 'Free',
      maxAmount: capabilities.bank.maxAmount,
      instant: capabilities.bank.instant
    },
    {
      id: 'wallet',
      name: capabilities.wallet.name,
      icon: <Wallet className="h-5 w-5" />,
      description: capabilities.wallet.description,
      processingTime: capabilities.wallet.instant ? 'Instant' : '2-4 hours',
      fees: 'Free',
      maxAmount: capabilities.wallet.maxAmount,
      instant: capabilities.wallet.instant
    },
    {
      id: 'crypto',
      name: capabilities.crypto.name,
      icon: <Bitcoin className="h-5 w-5" />,
      description: capabilities.crypto.description,
      processingTime: '5-30 minutes',
      fees: 'Network fees apply',
      maxAmount: capabilities.crypto.maxAmount,
      instant: capabilities.crypto.instant
    },
    {
      id: 'cash',
      name: capabilities.cash.name,
      icon: <Banknote className="h-5 w-5" />,
      description: capabilities.cash.description,
      processingTime: 'Instant',
      fees: 'Free',
      maxAmount: capabilities.cash.maxAmount,
      instant: capabilities.cash.instant    }
  ];
};

interface PaymentDetails {
  upiId?: string;
  accountNumber?: string;
  ifsc?: string;
  walletId?: string;
  walletAddress?: string;
  walletNetwork?: string;
  cashNote?: string;
  isValid?: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  onPaymentDetails: (details: PaymentDetails) => void;
  smartContract?: boolean;
  onSmartContractChange?: (enabled: boolean) => void;
  showSmartContractOption?: boolean;
  processing?: boolean;
  error?: string | null;
  success?: boolean;
}

export const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  onPaymentDetails,
  smartContract = false,
  onSmartContractChange,
  showSmartContractOption = false,
  processing = false,
  error = null,
  success = false
}: PaymentMethodSelectorProps) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [isValid, setIsValid] = useState<boolean>(false);
  
  // Get payment methods with current capabilities
  const paymentMethods = getPaymentMethods();

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
    onMethodChange(value as PaymentMethodType);
    setPaymentDetails({});
    setIsValid(false);
  };
  const renderPaymentDetails = () => {
    switch (selectedMethod) {
      case 'upi':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="upi-id">UPI ID *</Label>
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
            <div>
              <Label htmlFor="wallet-number">Wallet Number/Email</Label>
              <Input
                id="wallet-number"
                placeholder="9876543210 or email@example.com"
                value={paymentDetails.walletId || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, walletId: e.target.value };
                  setPaymentDetails(details);
                }}
                disabled={processing}
              />
            </div>
          </div>
        );
      
      case 'crypto':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="wallet-address">Wallet Address</Label>
              <Input
                id="wallet-address"
                placeholder="0x742d35Cc6731C0532925a3b8D"
                value={paymentDetails.walletAddress || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, walletAddress: e.target.value };
                  setPaymentDetails(details);
                }}
                disabled={processing}
              />
            </div>
            <div>
              <Label htmlFor="wallet-network">Network</Label>
              <select
                id="wallet-network"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={paymentDetails.walletNetwork || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, walletNetwork: e.target.value };
                  setPaymentDetails(details);
                }}
                disabled={processing}
              >
                <option value="">Select Network</option>
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="bsc">Binance Smart Chain</option>
              </select>
            </div>
          </div>
        );
      
      case 'cash':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Cash transactions will be handled in person. Please coordinate the meeting location and time with the other party.
              </p>
            </div>
            <div>
              <Label htmlFor="cash-note">Note (Optional)</Label>
              <Input
                id="cash-note"
                placeholder="Any note about the cash transaction"
                value={paymentDetails.cashNote || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, cashNote: e.target.value };
                  setPaymentDetails(details);
                }}
                disabled={processing}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Choose how you'd like to send/receive money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedMethod} onValueChange={handleMethodChange} className="mb-6">
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={method.id} id={method.id} className="mt-1" disabled={processing} />
                  <div className="flex-1">
                    <Label htmlFor={method.id} className="flex items-center cursor-pointer">
                      {method.icon}
                      <span className="ml-2 font-medium">{method.name}</span>
                      <div className="ml-auto flex space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {method.processingTime}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {method.fees}
                        </Badge>
                      </div>
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
          
          {showSmartContractOption && selectedMethod === 'crypto' && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label htmlFor="smart-contract" className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Use Smart Contract
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Automatically enforce loan terms using blockchain technology
                </p>
              </div>
              <Switch
                id="smart-contract"
                checked={smartContract}
                onCheckedChange={onSmartContractChange}
                disabled={processing}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Enter details for {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderPaymentDetails()}
            
            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Success Message */}
            {success && (
              <Alert className="mt-4 bg-green-50 border-green-200 text-green-800">
                <Check className="h-4 w-4" />
                <AlertDescription>Payment details saved successfully!</AlertDescription>
              </Alert>
            )}
            
            {/* Processing State */}
            {processing && (
              <div className="flex items-center justify-center mt-4 p-2 bg-blue-50 border border-blue-100 rounded-md">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">Processing payment...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
