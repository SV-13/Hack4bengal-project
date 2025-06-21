# Razorpay Test Integration Setup

## Quick Start - Testing Payment APIs

### Step 1: Get Razorpay Test Keys
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a free account (no documents needed for testing)
3. Switch to "Test Mode" 
4. Go to Settings → API Keys
5. Generate Test Keys

### Step 2: Add Test Keys to Environment
Add these to your `.env.local` file:

```bash
# Razorpay Test Keys (get from dashboard.razorpay.com)
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
VITE_RAZORPAY_KEY_SECRET=your_secret_key_here

# For API endpoints (same values)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here

# UPI Test Configuration
VITE_UPI_VPA=test@razorpay
VITE_UPI_MERCHANT_NAME=LendIt Test Platform
```

### Step 3: Test Payment Methods

#### UPI Testing
- **Test UPI ID**: `success@razorpay` (always succeeds)
- **Test UPI ID**: `failure@razorpay` (always fails)

#### Card Testing
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: `123`
- **Expiry**: Any future date
- **Name**: Any name

#### Wallet Testing
- All major wallets work in test mode
- No real money is charged

#### Bank Transfer Testing
- Real bank transfer instructions generated
- Manual verification process

#### Crypto Testing
- Use Ethereum Testnets (Goerli, Sepolia)
- MetaMask with test ETH

### Step 4: Deploy API Endpoints
```bash
# Deploy to Vercel (API endpoints will be auto-deployed)
vercel --prod

# Or for testing locally
npm run dev
```

## Test Scenarios

### Scenario 1: UPI Payment Flow
1. Create loan request for ₹1000
2. Select UPI payment method
3. Enter `success@razorpay` as UPI ID
4. Complete payment flow

### Scenario 2: Card Payment via Razorpay
1. Create loan for ₹5000
2. Select wallet/card payment
3. Use test card: 4111 1111 1111 1111
4. Verify payment success

### Scenario 3: Bank Transfer
1. Create loan for ₹25000
2. Select bank transfer
3. Get real transfer instructions
4. Manual verification flow

### Scenario 4: Crypto Payment
1. Connect MetaMask to test network
2. Create loan for ₹10000
3. Select crypto payment (ETH/USDT)
4. Complete blockchain transaction

## Expected Results
- ✅ All payments should work in test mode
- ✅ Real payment UI and flow
- ✅ Transaction recording in database
- ✅ Status updates and confirmations
- ✅ No real money charged
