/**
 * Razorpay Payment Processor
 * Handles UPI, cards, wallets, and net banking through Razorpay
 */

import { paymentConfig, CURRENCY_CODES } from '../config/paymentConfig';
import { PaymentDetails, PaymentResult } from './paymentProcessing';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Load Razorpay SDK
 */
export const loadRazorpaySDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay order
 */
export const createRazorpayOrder = async (details: PaymentDetails): Promise<RazorpayOrder> => {
  try {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: details.amount * 100, // Convert to paise
        currency: CURRENCY_CODES.INR,
        receipt: `loan_${details.agreementId}_${Date.now()}`,
        payment_capture: 1,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Razorpay order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Process Razorpay payment with UPI support
 */
export const processRazorpayPayment = async (details: PaymentDetails, preferredMethod?: 'upi' | 'card' | 'wallet'): Promise<PaymentResult> => {
  try {
    // Load Razorpay SDK
    const sdkLoaded = await loadRazorpaySDK();
    if (!sdkLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    // Create order
    const order = await createRazorpayOrder(details);

    return new Promise((resolve) => {
      const razorpayOptions: any = {
        key: paymentConfig.razorpay.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'LendIt Platform',
        description: `Payment for loan agreement ${details.agreementId}`,
        order_id: order.id,
        handler: async (response: RazorpayPaymentData) => {
          try {
            // Verify payment on server
            const verificationResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...response,
                agreementId: details.agreementId,
                payerId: details.payerId,
                recipientId: details.recipientId,
                transactionType: details.transactionType,
              }),
            });

            if (verificationResponse.ok) {
              const result = await verificationResponse.json();
              resolve({
                success: true,
                transactionId: result.transactionId,
                referenceId: response.razorpay_payment_id,
                message: 'Payment processed successfully via Razorpay',
              });
            } else {
              const errorData = await verificationResponse.json();
              resolve({
                success: false,
                message: errorData.error || 'Payment verification failed',
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error,
              message: 'Payment verification error',
            });
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: () => {
            resolve({
              success: false,
              message: 'Payment cancelled by user',
            });
          },
        },
        // Test mode configurations
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay using UPI',
                instruments: [
                  {
                    method: 'upi'
                  }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true,
            }
          }
        }
      };

      // Set preferred payment method if specified
      if (preferredMethod === 'upi') {
        razorpayOptions.method = 'upi';
      }

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    });
  } catch (error) {
    console.error('Razorpay payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Razorpay payment processing failed',
    };
  }
};

/**
 * Process UPI-specific payment via Razorpay
 */
export const processRazorpayUPI = async (details: PaymentDetails): Promise<PaymentResult> => {
  return processRazorpayPayment(details, 'upi');
};
