
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

// Temporarily disable ethers to test if it's causing CSP issues
// import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  provider: any | null;
  account: string | null;
  isConnected: boolean;
  balance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  createLoanContract: (loanDetails: LoanContractParams) => Promise<string>;
  loading: boolean;
}

interface LoanContractParams {
  borrowerAddress: string;
  amount: string;
  interestRate: number;
  durationMonths: number;
  purpose: string;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = React.memo(({ children }: { children: ReactNode }) => {
  console.log('Web3Provider initializing...');
  
  const [provider, setProvider] = useState<any | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const isConnected = useMemo(() => Boolean(provider && account), [provider, account]);

  const connectWallet = useCallback(async () => {
    try {
      console.log('Attempting to connect wallet...');
      setLoading(true);
      
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Temporarily disable ethers usage
      console.log('Wallet connection temporarily disabled for CSP testing');
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setAccount(null);
    setBalance('0');
  }, []);

  const createLoanContract = useCallback(async (loanDetails: LoanContractParams): Promise<string> => {
    console.log('Create loan contract temporarily disabled for CSP testing');
    return 'test-hash';
  }, []);

  const contextValue = useMemo(() => ({
    provider,
    account,
    isConnected,
    balance,
    connectWallet,
    disconnectWallet,
    createLoanContract,
    loading
  }), [provider, account, isConnected, balance, connectWallet, disconnectWallet, createLoanContract, loading]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
});

Web3Provider.displayName = 'Web3Provider';
