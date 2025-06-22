# Razorpay Test Setup Guide

This guide will help you set up Razorpay in test mode for the LendIt P2P lending platform.

## Prerequisites

- Razorpay test account (sign up at [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup))
- Node.js environment for running the application

## Step 1: Get Your Razorpay Test API Keys

1. Log in to your Razorpay Dashboard
2. Go to Settings > API Keys
3. Click "Generate Key" if you don't already have a set of test keys
4. Note down your Key ID and Key Secret

## Step 2: Configure Environment Variables

Create or edit a `.env.local` file in the project root:

```
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
VITE_RAZORPAY_KEY_SECRET=your_key_secret
```

For the API routes (serverless functions), you'll need to set these environment variables in your hosting platform (e.g., Vercel):

```
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

## Step 3: Test Card Details

Use these test card details for payments:

### Credit/Debit Cards

| Card Network | Number           | CVV | Expiry Date | Name           | 3D Secure |
|--------------|------------------|-----|-------------|----------------|-----------|
| Visa         | 4111 1111 1111 1111 | Any | Any future  | Any            | Yes       |
| MasterCard   | 5267 3181 8797 5449 | Any | Any future  | Any            | Yes       |
| Rupay        | 6062 8205 0001 5425 | Any | Any future  | Any            | Yes       |

### Test UPI

Use these UPI IDs for testing:

- `success@razorpay` - Payment will succeed
- `failure@razorpay` - Payment will fail
- `pending@razorpay` - Payment will remain pending

## Step 4: Testing Webhook Integration

For testing webhooks locally:

1. Install ngrok: `npm install -g ngrok`
2. Start your local server: `npm run dev`
3. In a new terminal, create a tunnel: `ngrok http 3000`
4. Copy the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`)
5. In your Razorpay Dashboard, go to Settings > Webhooks
6. Add a new webhook with:
   - URL: `https://your-ngrok-url/api/razorpay/webhook`
   - Secret: Create a webhook secret
   - Events: Select the events you want to receive (payment.authorized, payment.failed, etc.)

7. Update your environment variables with the webhook secret:
   ```
   VITE_RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

## Step 5: Testing the Integration

1. Navigate to the Payment Test page in your application (`/payment-test`)
2. Select a payment method (UPI, Card, etc.)
3. Enter test details as described above
4. Complete the payment flow

### Expected Behavior

- For successful payments, you should see a success message and the transaction should be recorded
- For failed payments, you should see an error message
- For pending payments, you should see a pending status

## Troubleshooting

### Payment Fails Immediately

- Check that your Razorpay Key ID is correctly set in the environment variables
- Ensure you're using test card details exactly as provided above
- Verify that the Razorpay SDK is properly loaded

### Webhook Not Receiving Events

- Make sure ngrok is running and the URL is correctly set in Razorpay Dashboard
- Check that your webhook secret matches between Razorpay and your application
- Verify that your webhook handler is correctly implemented

### API Errors

- Check the browser console and server logs for detailed error messages
- Verify that your Key Secret is correctly set in the environment variables
- Ensure you're making API calls with the correct parameters

## Moving to Production

When you're ready to move to production:

1. Generate production API keys from the Razorpay Dashboard
2. Update your environment variables with production keys
3. Update webhook URLs to your production domain
4. Test thoroughly with real payments (you can make small test payments and then refund them)

## Resources

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Test Mode Guide](https://razorpay.com/docs/payments/payments/test-mode/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
