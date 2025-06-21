import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { processRazorpayPayment } from '../utils/razorpayProcessor';
import { processDirectUpiPayment } from '../utils/upiProcessor';
import { PaymentDetails } from '../utils/paymentProcessing';

const UPIPaymentTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const testPaymentDetails: PaymentDetails = {
    amount: 100, // ₹100 for testing
    agreementId: 'test_agreement_123',
    payerId: 'test_payer_456',
    recipientId: 'test_recipient_789',
    transactionType: 'repayment',
  };

  const testRazorpayUPI = async () => {
    setIsLoading(true);
    try {
      const result = await processRazorpayPayment(testPaymentDetails);
      setResults(prev => [...prev, {
        method: 'Razorpay UPI',
        timestamp: new Date().toLocaleString(),
        ...result
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        method: 'Razorpay UPI',
        timestamp: new Date().toLocaleString(),
        success: false,
        error: error,
        message: 'Test failed with error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  const testDirectUPI = async () => {
    setIsLoading(true);
    try {
      const result = await processDirectUpiPayment(testPaymentDetails);
      setResults(prev => [...prev, {
        method: 'Direct UPI',
        timestamp: new Date().toLocaleString(),
        ...result
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        method: 'Direct UPI',
        timestamp: new Date().toLocaleString(),
        success: false,
        error: error,
        message: 'Test failed with error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            UPI Payment Testing Dashboard
            <Badge variant="secondary">Sandbox Mode</Badge>
          </CardTitle>
          <CardDescription>
            Test UPI payments using Razorpay test environment. No real money will be charged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Razorpay UPI Checkout</CardTitle>
                <CardDescription>
                  Full UPI checkout with Razorpay integration including cards, wallets, and UPI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testRazorpayUPI} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Test Razorpay Payment ₹100'}
                </Button>
                <div className="mt-2 text-sm text-gray-600">
                  <p>✓ UPI Apps (PhonePe, Paytm, GPay)</p>
                  <p>✓ Cards (Test: 4111 1111 1111 1111)</p>
                  <p>✓ Wallets (Test mode)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Direct UPI Intent</CardTitle>
                <CardDescription>
                  Direct UPI app integration with QR code fallback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testDirectUPI} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Test Direct UPI ₹100'}
                </Button>
                <div className="mt-2 text-sm text-gray-600">
                  <p>✓ UPI Intent URLs</p>
                  <p>✓ QR Code generation</p>
                  <p>✓ Manual payment entry</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Use Razorpay test card: <code>4111 1111 1111 1111</code></li>
              <li>• Any future expiry date and CVV (e.g., 12/25, 123)</li>
              <li>• For UPI testing, any UPI ID will work in test mode</li>
              <li>• Test phone: 9999999999</li>
              <li>• No real money will be charged in test mode</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
            <Badge variant="outline" className="ml-auto">
              {results.length} test results
            </Badge>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.method}
                    </Badge>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </div>
                  <p className="text-sm font-medium">
                    {result.success ? '✅' : '❌'} {result.message}
                  </p>
                  {result.transactionId && (
                    <p className="text-xs text-gray-600 mt-1">
                      Transaction ID: {result.transactionId}
                    </p>
                  )}
                  {result.referenceId && (
                    <p className="text-xs text-gray-600">
                      Reference ID: {result.referenceId}
                    </p>
                  )}
                  {result.error && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">Error Details</summary>
                      <pre className="text-xs text-red-600 mt-1 bg-red-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UPIPaymentTester;
