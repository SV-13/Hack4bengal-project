# Payment Sandbox Configuration Guide

This guide explains how to configure and test payment methods in the LendIt platform's sandbox environment.

## 🧪 Test Mode Overview

The platform currently runs in **TEST MODE** - no real money will be charged or transferred. All payment configurations use sandbox/test credentials.

## 🏦 Payment Methods Available

### 1. UPI Payments (via Razorpay)

**Status:** ✅ Configured with test credentials

**Test Credentials:**
- Success UPI ID: `success@razorpay`
- Failure UPI ID: `failure@razorpay`
- Pending UPI ID: `pending@razorpay`

**How to test:**
1. Select UPI payment method
2. When Razorpay popup appears, use one of the test UPI IDs above
3. Use `success@razorpay` for successful payment simulation
4. Use `failure@razorpay` to test payment failure handling

### 2. Credit/Debit Cards (via Razorpay)

**Status:** ✅ Configured with test credentials

**Test Cards:**
- **Visa Success:** `4111 1111 1111 1111` (Exp: 12/29, CVV: 123)
- **Mastercard Success:** `5555 5555 5555 4444` (Exp: 12/29, CVV: 123)
- **Visa Failure:** `4000 0000 0000 0002` (Exp: 12/29, CVV: 123)

**How to test:**
1. Select wallet/card payment method
2. Use any of the test card numbers above
3. Enter any future expiry date and CVV
4. Use success cards for successful transactions

### 3. Bank Transfer

**Status:** ✅ Configured for simulation

**Test Bank Details:**
- Account Number: `1112220001`
- IFSC Code: `HDFC0000001`
- Account Holder: `Test User`

**How to test:**
1. Select bank transfer method
2. System will show transfer instructions
3. Use the test bank details above
4. No actual transfer occurs in test mode

### 4. Digital Wallets

**Status:** ✅ Configured for simulation

**Test Wallet Details:**
- Phone Number: `9999999999`
- Provider: Paytm (test)

**How to test:**
1. Select digital wallet method
2. Use the test phone number above
3. All transactions are simulated

### 5. Cryptocurrency

**Status:** ⚠️ Test network only

**Test Networks:**
- Ethereum: Sepolia Testnet
- Bitcoin: Bitcoin Testnet

**How to test:**
1. Use only test network addresses
2. No real cryptocurrency will be transferred
3. Test with small amounts only

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env.local` file with these test credentials:

```bash
# Razorpay Test Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=your_razorpay_test_secret_here

# UPI Test Configuration
VITE_UPI_VPA=test@razorpay
VITE_UPI_MERCHANT_NAME=LendIt Test Platform

# Optional: Additional Payment Gateways
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key_here
VITE_PAYTM_MERCHANT_ID=TESTMERCHANTID
```

### Getting Razorpay Test Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a test account (free)
3. Navigate to Settings → API Keys
4. Generate test keys (they start with `rzp_test_`)
5. Copy the Key ID to `VITE_RAZORPAY_KEY_ID`
6. Copy the Key Secret to `RAZORPAY_KEY_SECRET`

## 🧪 Testing Workflow

### For Borrowers (Loan Requests)
1. Create a loan request
2. Check that email notifications work
3. Verify request appears in "My Requests" tab

### For Lenders (Loan Offers)
1. Browse available loan requests
2. Click "Lend Money" on a request
3. Select payment method
4. Use test credentials from above
5. Complete simulated payment
6. Verify transaction in history

### Payment Testing Checklist

- [ ] UPI payment with `success@razorpay` completes successfully
- [ ] UPI payment with `failure@razorpay` shows proper error handling
- [ ] Credit card payments work with test cards
- [ ] Bank transfer shows proper instructions
- [ ] Payment history records all test transactions
- [ ] Email notifications are sent for all payment events
- [ ] Error messages are user-friendly

## 🚀 Going to Production

When ready for production:

1. Replace all test keys with live production keys
2. Update `testMode: false` in `paymentConfig.ts`
3. Remove test data and instructions from UI
4. Enable webhook endpoints for payment verification
5. Set up proper error monitoring and logging

## 🆘 Troubleshooting

### Common Issues

**"lender_email column not found"**
- Run database migration: `npx supabase db reset`
- Ensure all migrations are applied

**Payment popup doesn't appear**
- Check browser console for errors
- Verify Razorpay script is loading
- Check network connectivity

**Test payments always fail**
- Verify using correct test credentials
- Check that payment config has `testMode: true`
- Ensure using test card numbers, not real ones

**Bank transfer instructions not showing**
- Check payment processor configuration
- Verify bank transfer is enabled in payment methods

### Debug Mode

Enable detailed logging:
```javascript
// In browser console
localStorage.setItem('payment_debug', 'true');
```

This will show detailed payment processing logs in the browser console.

## 📞 Support

For payment integration issues:
- Razorpay: Check their [test documentation](https://razorpay.com/docs/payments/payment-gateway/test-card-details/)
- Platform issues: Check browser console and network logs

Remember: This is a test environment. No real money will be charged or transferred.
