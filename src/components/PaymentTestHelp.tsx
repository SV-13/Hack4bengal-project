/**
 * Payment Test Mode Help Component
 * Provides users with clear instructions for testing payments
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  Bitcoin, 
  HelpCircle,
  Copy,
  CheckCircle,
  Shield,
  AlertTriangle
} from "lucide-react";
import { PAYMENT_TEST_DATA, PAYMENT_TEST_INSTRUCTIONS } from '@/config/paymentConfig';
import { useToast } from "@/hooks/use-toast";

interface PaymentTestHelpProps {
  selectedMethod?: string;
}

export const PaymentTestHelp = ({ selectedMethod }: PaymentTestHelpProps) => {
  const { toast } = useToast();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, label)}
      className="h-8 px-2"
    >
      {copiedText === text ? (
        <CheckCircle className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );

  const TestDataCard = ({ title, icon, children }: { 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm">
          {icon}
          <span className="ml-2">{title}</span>
          <Badge variant="secondary" className="ml-2 text-xs">TEST</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Payment Test Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-blue-600" />
            Payment Testing Guide
          </DialogTitle>
          <DialogDescription>
            This platform is running in test mode. Use the credentials below to test payments safely.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Important:</strong> This is a test environment. No real money will be charged or transferred.
            All payment methods below are for testing purposes only.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Razorpay UPI Test */}
          <TestDataCard
            title="UPI via Razorpay"
            icon={<Smartphone className="h-4 w-4 text-blue-600" />}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Success UPI ID:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {PAYMENT_TEST_DATA.upi.success}
                  </code>
                  <CopyButton text={PAYMENT_TEST_DATA.upi.success} label="Success UPI ID" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Failure UPI ID:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {PAYMENT_TEST_DATA.upi.failure}
                  </code>
                  <CopyButton text={PAYMENT_TEST_DATA.upi.failure} label="Failure UPI ID" />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Use these UPI IDs when the Razorpay payment popup appears. The success ID will complete the payment, 
                while the failure ID will simulate a failed transaction.
              </div>
            </div>
          </TestDataCard>

          {/* Test Credit Cards */}
          <TestDataCard
            title="Test Credit Cards"
            icon={<CreditCard className="h-4 w-4 text-green-600" />}
          >
            <div className="space-y-3">
              {PAYMENT_TEST_DATA.cards.map((card, index) => (
                <div key={index} className="space-y-2 p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{card.name}</span>
                    <Badge variant={card.name.includes('Success') ? 'default' : 'destructive'} className="text-xs">
                      {card.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-xs">{card.number}</code>
                    <CopyButton text={card.number.replace(/\s/g, '')} label="Card number" />
                  </div>
                  <div className="text-xs text-gray-600">
                    Expiry: {card.expiryMonth}/{card.expiryYear} | CVV: {card.cvv}
                  </div>
                </div>
              ))}
            </div>
          </TestDataCard>

          {/* Bank Transfer Test */}
          <TestDataCard
            title="Bank Transfer Details"
            icon={<Building2 className="h-4 w-4 text-purple-600" />}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Account Number:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {PAYMENT_TEST_DATA.bank.accountNumber}
                  </code>
                  <CopyButton text={PAYMENT_TEST_DATA.bank.accountNumber} label="Account number" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">IFSC Code:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {PAYMENT_TEST_DATA.bank.ifsc}
                  </code>
                  <CopyButton text={PAYMENT_TEST_DATA.bank.ifsc} label="IFSC code" />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Use these details if the system shows bank transfer instructions. 
                No actual money transfer will occur in test mode.
              </div>
            </div>
          </TestDataCard>

          {/* Digital Wallet Test */}
          <TestDataCard
            title="Digital Wallet"
            icon={<Wallet className="h-4 w-4 text-orange-600" />}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Test Phone:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {PAYMENT_TEST_DATA.wallet.phoneNumber}
                  </code>
                  <CopyButton text={PAYMENT_TEST_DATA.wallet.phoneNumber} label="Phone number" />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Use this phone number for wallet-based payments. All transactions are simulated.
              </div>
            </div>
          </TestDataCard>
        </div>

        {/* Current Method Instructions */}
        {selectedMethod && PAYMENT_TEST_INSTRUCTIONS[selectedMethod] && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm text-blue-800">
                Current Method: {PAYMENT_TEST_INSTRUCTIONS[selectedMethod].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-700 space-y-2">
                <p>{PAYMENT_TEST_INSTRUCTIONS[selectedMethod].description}</p>
                <ul className="space-y-1 ml-4">
                  {PAYMENT_TEST_INSTRUCTIONS[selectedMethod].instructions.map((instruction, index) => (
                    <li key={index} className="list-disc text-xs">{instruction}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">💡 Testing Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ul className="space-y-1 text-gray-600">
              <li>• Use the "success" test credentials to simulate successful payments</li>
              <li>• Use the "failure" test credentials to see how the app handles failed payments</li>
              <li>• All test transactions will show up in the transaction history</li>
              <li>• You can safely test multiple payment methods without any charges</li>
              <li>• Payment notifications and emails work the same as in production</li>
            </ul>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentTestHelp;
