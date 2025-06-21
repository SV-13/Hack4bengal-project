
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Building2, 
  Wallet, 
  Bitcoin, 
  Banknote,
  Shield,
  Zap
} from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  fees: string;
}

const paymentMethods: PaymentMethod[] = [
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
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  onPaymentDetails: (details: any) => void;
  smartContract?: boolean;
  onSmartContractChange?: (enabled: boolean) => void;
}

export const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  onPaymentDetails,
  smartContract = false,
  onSmartContractChange
}: PaymentMethodSelectorProps) => {
  const [paymentDetails, setPaymentDetails] = useState<any>({});

  const handleMethodChange = (value: string) => {
    onMethodChange(value);
    setPaymentDetails({});
  };

  const renderPaymentDetails = () => {
    switch (selectedMethod) {
      case 'upi':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input
                id="upi-id"
                placeholder="yourname@paytm"
                value={paymentDetails.upiId || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, upiId: e.target.value };
                  setPaymentDetails(details);
                  onPaymentDetails(details);
                }}
              />
            </div>
          </div>
        );
      
      case 'bank':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="1234567890"
                value={paymentDetails.accountNumber || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, accountNumber: e.target.value };
                  setPaymentDetails(details);
                  onPaymentDetails(details);
                }}
              />
            </div>
            <div>
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                placeholder="SBIN0001234"
                value={paymentDetails.ifsc || ''}
                onChange={(e) => {
                  const details = { ...paymentDetails, ifsc: e.target.value };
                  setPaymentDetails(details);
                  onPaymentDetails(details);
                }}
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
                  onPaymentDetails(details);
                }}
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
                  onPaymentDetails(details);
                }}
              />
            </div>
          </div>
        );
      
      case 'cash':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Cash transactions will be handled in person. Please coordinate the meeting location and time with the borrower.
            </p>
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
          <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
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
          </CardContent>
        </Card>
      )}

      {/* Smart Contract Option for Crypto */}
      {selectedMethod === 'crypto' && onSmartContractChange && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Smart Contract
              <Badge className="ml-2 bg-blue-100 text-blue-800">
                <Zap className="h-3 w-3 mr-1" />
                Advanced
              </Badge>
            </CardTitle>
            <CardDescription>
              Use blockchain smart contracts for automated loan management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smart-contract"
                checked={smartContract}
                onChange={(e) => onSmartContractChange(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="smart-contract" className="text-sm">
                Enable smart contract for automatic payment processing
              </Label>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Smart contracts automatically handle loan disbursement and repayment schedules.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
