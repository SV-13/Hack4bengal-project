# UPI Payment Integration Test Guide

## 🚀 Quick Start for UPI Testing

This guide will help you test UPI payments using Razorpay's test environment with real UPI flows.

### 1. Environment Setup

Copy the environment variables to your `.env.local` file:

```bash
# Razorpay Test Keys (These are actual test keys for immediate testing)
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=YOUR_TEST_SECRET_HERE

# UPI Test Configuration
VITE_UPI_VPA=test@razorpay
VITE_UPI_MERCHANT_NAME=LendIt Test Platform

# Your Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 2. Get Your Own Test Keys (Recommended)

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to Settings > API Keys
3. Generate Test Keys (no KYC required for test mode)
4. Replace the keys in your `.env.local` file

### 3. Start Testing

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Visit the payment test page
# Navigate to: http://localhost:5173/payment-test
```

### 4. UPI Test Scenarios

#### Scenario 1: Razorpay UPI Checkout
- Click "Test Razorpay Payment ₹100"
- Choose UPI from the payment options
- Use any UPI ID (e.g., test@paytm)
- In test mode, all payments will succeed

#### Scenario 2: Test Card Payment
- Click "Test Razorpay Payment ₹100"
- Choose Cards
- Use test card: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits (e.g., 123)

#### Scenario 3: Direct UPI Integration
- Click "Test Direct UPI ₹100"
- Simulates direct UPI app integration
- Shows UPI intent URL generation

### 5. Expected Results

✅ **Success Flow:**
- Payment modal opens
- User selects payment method
- Payment is processed
- Transaction ID is generated
- Payment status is verified
- Transaction is recorded in database

❌ **Failure Testing:**
- Cancel payment in modal
- Use invalid card details (in live mode)
- Network errors
- Verification failures

### 6. UPI Payment Methods Supported

| Method | Test Status | Description |
|--------|-------------|-------------|
| PhonePe | ✅ Works | UPI app redirect |
| Google Pay | ✅ Works | UPI app redirect |
| Paytm | ✅ Works | UPI app redirect |
| BHIM | ✅ Works | UPI app redirect |
| Bank UPI Apps | ✅ Works | Most bank UPI apps |
| UPI QR Code | ✅ Works | QR code generation |

### 7. Test Data Reference

```javascript
// Test Payment Details
const testPayment = {
  amount: 100, // ₹100
  agreementId: 'test_agreement_123',
  payerId: 'test_payer_456',
  recipientId: 'test_recipient_789',
  transactionType: 'loan_payment'
};

// Test Card Numbers
const testCards = {
  visa: '4111 1111 1111 1111',
  mastercard: '5555 5555 5555 4444',
  rupay: '6521 1111 1111 1111'
};

// Test UPI IDs (all work in test mode)
const testUPIIds = [
  'test@paytm',
  'test@phonepe',
  'test@googlepay',
  'test@upi'
];
```

### 8. API Endpoint Testing

Test the backend APIs directly:

```bash
# Create a test order
curl -X POST http://localhost:5173/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "INR",
    "receipt": "test_receipt_123"
  }'

# Verify a test payment (replace with actual payment data)
curl -X POST http://localhost:5173/api/razorpay/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_test_123",
    "razorpay_payment_id": "pay_test_456",
    "razorpay_signature": "test_signature",
    "agreementId": "test_agreement",
    "payerId": "test_payer",
    "recipientId": "test_recipient"
  }'
```

### 9. Troubleshooting

#### Common Issues:

1. **Razorpay SDK not loading**
   - Check network connectivity
   - Verify no ad blockers are interfering

2. **Invalid key error**
   - Ensure you're using test keys (start with `rzp_test_`)
   - Check environment variables are loaded correctly

3. **Payment verification fails**
   - Check server logs for detailed errors
   - Verify Supabase connection

4. **UPI apps not opening**
   - Test on mobile device for best UPI experience
   - Use desktop for card/wallet testing

#### Debug Mode:

Enable debug logging in your browser console:

```javascript
// In browser console
localStorage.setItem('razorpay_debug', 'true');
```

### 10. Next Steps

After successful testing:

1. **Get live keys** from Razorpay for production
2. **Complete KYC** for live payments
3. **Set up webhooks** for automated payment updates
4. **Add refund handling** for failed transactions
5. **Implement receipt generation**

### 11. Security Notes for Production

- Never expose secret keys in frontend code
- Use environment variables for all sensitive data
- Implement proper webhook signature verification
- Add rate limiting for payment APIs
- Set up proper error monitoring

---

## 📱 Mobile Testing

For the best UPI testing experience:

1. **Use a mobile device** or Chrome DevTools mobile view
2. **Install UPI apps** (PhonePe, Google Pay, Paytm)
3. **Test UPI intent** redirects to actual apps
4. **Verify payment flow** returns to your app correctly

The system is now ready for comprehensive UPI payment testing! 🎉
