
import { lazy } from 'react';

// Lazy load heavy components
export const LazyDashboard = lazy(() => import('./Dashboard'));
export const LazyCryptoLoanModal = lazy(() => import('./CryptoLoanModal'));
export const LazyCreateLoanModal = lazy(() => import('./CreateLoanModal'));
export const LazyAgreementList = lazy(() => import('./AgreementList'));
