/**
 * Payment Processing Utility
 * This file contains functions for processing payments through different methods
 */

import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from './currency';

// Define payment method options
export type PaymentMethod = 'upi' | 'bank' | 'wallet' | 'crypto' | 'cash';

// Interface for payment details
export interface PaymentDetails {
  amount: number;
  agreementId: string;
  paymentMethod: PaymentMethod;
  payerId: string;
  recipientId: string;
  reference?: string;
  walletAddress?: string;
  transactionType: 'disbursement' | 'repayment' | 'interest';
}

// Interface for payment result
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  referenceId?: string;
  message?: string;
  error?: any;
}

/**
 * Process a payment using UPI
 * In a real implementation, this would integrate with a UPI payment gateway
 * @param details Payment details
 * @returns Payment result
 */
export const processUpiPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    console.log(`Processing UPI payment of ${formatCurrency(details.amount)}`);
    
    // In a real implementation, this would call a UPI payment API
    // For now, we'll simulate a successful payment
    const mockTransactionId = `upi_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Record the transaction in the database
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'upi',
        payment_reference: details.reference || mockTransactionId,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      transactionId: data.id,
      referenceId: mockTransactionId,
      message: 'UPI payment processed successfully'
    };
  } catch (error) {
    console.error('UPI payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'UPI payment processing failed'
    };
  }
};

/**
 * Process a bank transfer payment
 * @param details Payment details
 * @returns Payment result
 */
export const processBankTransfer = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    console.log(`Processing bank transfer of ${formatCurrency(details.amount)}`);
    
    // Simulate bank transfer
    const mockTransactionId = `bank_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Record the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'bank',
        payment_reference: details.reference || mockTransactionId,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      transactionId: data.id,
      referenceId: mockTransactionId,
      message: 'Bank transfer processed successfully'
    };
  } catch (error) {
    console.error('Bank transfer processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Bank transfer processing failed'
    };
  }
};

/**
 * Process a digital wallet payment
 * @param details Payment details
 * @returns Payment result
 */
export const processWalletPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    console.log(`Processing wallet payment of ${formatCurrency(details.amount)}`);
    
    // Simulate wallet payment
    const mockTransactionId = `wallet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Record the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'wallet',
        payment_reference: details.reference || mockTransactionId,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      transactionId: data.id,
      referenceId: mockTransactionId,
      message: 'Wallet payment processed successfully'
    };
  } catch (error) {
    console.error('Wallet payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Wallet payment processing failed'
    };
  }
};

/**
 * Process a crypto payment
 * @param details Payment details with walletAddress
 * @returns Payment result
 */
export const processCryptoPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  if (!details.walletAddress) {
    return {
      success: false,
      message: 'Wallet address is required for crypto payments'
    };
  }
  
  try {
    console.log(`Processing crypto payment of ${formatCurrency(details.amount)}`);
    console.log(`Recipient wallet: ${details.walletAddress}`);
    
    // In a real implementation, this would interact with a blockchain
    // For now, we'll simulate a successful transaction
    const mockTransactionId = `crypto_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Record the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'crypto',
        payment_reference: details.reference || mockTransactionId,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      transactionId: data.id,
      referenceId: mockTransactionId,
      message: 'Crypto payment processed successfully'
    };
  } catch (error) {
    console.error('Crypto payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Crypto payment processing failed'
    };
  }
};

/**
 * Record a cash payment (manually tracked)
 * @param details Payment details
 * @returns Payment result
 */
export const recordCashPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    console.log(`Recording cash payment of ${formatCurrency(details.amount)}`);
    
    // Generate a reference for the manual transaction
    const mockTransactionId = `cash_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Record the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'cash',
        payment_reference: details.reference || mockTransactionId,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      transactionId: data.id,
      referenceId: mockTransactionId,
      message: 'Cash payment recorded successfully'
    };
  } catch (error) {
    console.error('Cash payment recording failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Cash payment recording failed'
    };
  }
};

/**
 * Process a payment using the specified payment method
 * @param details Payment details
 * @returns Payment result
 */
export const processPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  switch (details.paymentMethod) {
    case 'upi':
      return processUpiPayment(details);
    case 'bank':
      return processBankTransfer(details);
    case 'wallet':
      return processWalletPayment(details);
    case 'crypto':
      return processCryptoPayment(details);
    case 'cash':
      return recordCashPayment(details);
    default:
      return {
        success: false,
        message: `Unsupported payment method: ${details.paymentMethod}`
      };
  }
}; 