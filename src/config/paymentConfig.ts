/**
 * Payment Gateway Configuration
 * This file contains configuration for various payment gateways
 */

export interface PaymentConfig {
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  paytm: {
    merchantId: string;
    merchantKey: string;
    website: string;
    industryType: string;
  };
  upi: {
    vpa: string; // Virtual Payment Address for receiving UPI payments
    merchantName: string;
  };
}

// Environment-based configuration
export const paymentConfig: PaymentConfig = {
  razorpay: {
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo',
    keySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '',
    webhookSecret: import.meta.env.VITE_RAZORPAY_WEBHOOK_SECRET || '',
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
    webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
  },
  paytm: {
    merchantId: import.meta.env.VITE_PAYTM_MERCHANT_ID || '',
    merchantKey: import.meta.env.VITE_PAYTM_MERCHANT_KEY || '',
    website: import.meta.env.VITE_PAYTM_WEBSITE || 'WEBSTAGING',
    industryType: import.meta.env.VITE_PAYTM_INDUSTRY_TYPE || 'Retail',
  },
  upi: {
    vpa: import.meta.env.VITE_UPI_VPA || 'lendit@upi',
    merchantName: import.meta.env.VITE_UPI_MERCHANT_NAME || 'LendIt Platform',
  },
};

// API endpoints
export const API_ENDPOINTS = {
  razorpay: 'https://api.razorpay.com/v1',
  stripe: 'https://api.stripe.com/v1',
  paytm: {
    staging: 'https://securegw-stage.paytm.in',
    production: 'https://securegw.paytm.in',
  },
};

// Currency codes
export const CURRENCY_CODES = {
  INR: 'INR',
  USD: 'USD',
  ETH: 'ETH',
  BTC: 'BTC',
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CODES;
