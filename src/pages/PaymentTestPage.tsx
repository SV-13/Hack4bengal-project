import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import UPIPaymentTester from '../components/UPIPaymentTester';
import { PaymentTester } from '../components/PaymentTester';

const PaymentTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LendIt Payment Testing Dashboard
          </h1>
          <p className="text-gray-600">
            Test all payment methods in sandbox mode. No real money will be charged.
          </p>
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary">Sandbox Environment</Badge>
            <Badge variant="outline">Razorpay Test Mode</Badge>
            <Badge variant="outline">UPI Ready</Badge>
          </div>
        </div>

        <div className="space-y-8">
          {/* UPI Focused Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">🚀 UPI Payment Testing</CardTitle>
              <CardDescription>
                Focus on UPI payments through Razorpay checkout and direct UPI integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UPIPaymentTester />
            </CardContent>
          </Card>

          {/* Full Payment Methods Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">💳 All Payment Methods</CardTitle>
              <CardDescription>
                Test all available payment methods including cards, wallets, bank transfers, and crypto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTester />
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">⚙️ Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Quick Setup for UPI Testing:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Sign up at <a href="https://dashboard.razorpay.com" className="underline" target="_blank" rel="noopener noreferrer">dashboard.razorpay.com</a></li>
                  <li>Get your test API keys from the dashboard</li>
                  <li>Add them to your <code>.env.local</code> file</li>
                  <li>Start testing UPI payments with test credentials</li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Test Credentials:</h4>
                <div className="text-sm text-green-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Test Card:</strong> 4111 1111 1111 1111</p>
                    <p><strong>Expiry:</strong> Any future date (e.g., 12/25)</p>
                    <p><strong>CVV:</strong> Any 3 digits (e.g., 123)</p>
                  </div>
                  <div>
                    <p><strong>Test UPI ID:</strong> Any UPI ID works in test mode</p>
                    <p><strong>Test Phone:</strong> 9999999999</p>
                    <p><strong>OTP:</strong> Any 6 digits in test mode</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Environment Variables Required:</h4>
                <pre className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded overflow-auto">
{`VITE_RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_secret_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentTestPage;
