import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Smartphone, 
  Building2, 
  Wallet, 
  Bitcoin, 
  Banknote
} from "lucide-react";

export type PaymentMethodType = 'upi' | 'bank' | 'wallet' | 'crypto' | 'cash';

interface PaymentMethodInputProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  onPaymentDetails: (details: any) => void;
  smartContract?: boolean;
  onSmartContractChange?: (enabled: boolean) => void;
}

const paymentMethods = [
  { id: 'upi', name: 'UPI Payment', icon: Smartphone, description: 'PhonePe, GPay, Paytm' },
  { id: 'bank', name: 'Bank Transfer', icon: Building2, description: 'NEFT/RTGS/IMPS' },
  { id: 'wallet', name: 'Digital Wallet', icon: Wallet, description: 'Paytm, PayPal' },
  { id: 'crypto', name: 'Cryptocurrency', icon: Bitcoin, description: 'ETH, USDT, BTC' },
  { id: 'cash', name: 'Cash Payment', icon: Banknote, description: 'In-person transaction' },
];

export const PaymentMethodInput = ({
  selectedMethod,
  onMethodChange,
  onPaymentDetails,
  smartContract = false,
  onSmartContractChange
}: PaymentMethodInputProps) => {
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const validateAndUpdateDetails = (method: PaymentMethodType) => {
    let details: any = { isValid: false };
    
    switch (method) {
      case 'upi':
        const isValidUpi = upiId.includes('@') && upiId.length > 3;
        details = { upiId, isValid: isValidUpi };
        break;
      case 'bank':
        const isValidBank = accountNumber.length >= 9 && ifsc.length >= 11;
        details = { accountNumber, ifsc, isValid: isValidBank };
        break;
      case 'wallet':
        details = { isValid: true }; // Wallet doesn't need pre-validation
        break;
      case 'crypto':
        const isValidWallet = walletAddress.length > 20;
        details = { walletAddress, isValid: isValidWallet };
        break;
      case 'cash':
        details = { isValid: true }; // Cash doesn't need validation
        break;
    }
    
    onPaymentDetails(details);
  };

  const handleMethodChange = (method: PaymentMethodType) => {
    onMethodChange(method);
    validateAndUpdateDetails(method);
  };

  const handleDetailChange = (field: string, value: string) => {
    switch (field) {
      case 'upiId':
        setUpiId(value);
        break;
      case 'accountNumber':
        setAccountNumber(value);
        break;
      case 'ifsc':
        setIfsc(value);
        break;
      case 'walletAddress':
        setWalletAddress(value);
        break;
    }
    validateAndUpdateDetails(selectedMethod);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Payment Method
          {onSmartContractChange && (
            <div className="flex items-center space-x-2">
              <Switch
                id="smart-contract"
                checked={smartContract}
                onCheckedChange={onSmartContractChange}
              />
              <Label htmlFor="smart-contract" className="text-sm">Smart Contract</Label>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div key={method.id} className="flex items-center space-x-2">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label 
                  htmlFor={method.id} 
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-500">{method.description}</div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        {/* Method-specific inputs */}
        {selectedMethod === 'upi' && (
          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID</Label>
            <Input
              id="upi-id"
              placeholder="username@paytm"
              value={upiId}
              onChange={(e) => handleDetailChange('upiId', e.target.value)}
            />
          </div>
        )}

        {selectedMethod === 'bank' && (
          <div className="space-y-2">
            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="1234567890"
                value={accountNumber}
                onChange={(e) => handleDetailChange('accountNumber', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                placeholder="HDFC0001234"
                value={ifsc}
                onChange={(e) => handleDetailChange('ifsc', e.target.value)}
              />
            </div>
          </div>
        )}

        {selectedMethod === 'crypto' && (
          <div className="space-y-2">
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <Input
              id="wallet-address"
              placeholder="0x742d35Cc24Bf1C5e31E63E3b4f6D8e5F0e1F2B3c"
              value={walletAddress}
              onChange={(e) => handleDetailChange('walletAddress', e.target.value)}
            />
            <Badge variant="outline" className="text-xs">
              Supports ETH, USDT, BTC
            </Badge>
          </div>
        )}

        {smartContract && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              🔒 This loan will be secured with a blockchain smart contract for enhanced security and automated execution.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
