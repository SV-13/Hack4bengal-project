
import { Suspense, lazy } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState } from "react";

// Lazy load the Dashboard component with error handling
const Dashboard = lazy(() => {
  console.log('Loading Dashboard component...');
  return import("@/components/Dashboard").catch(error => {
    console.error('Failed to load Dashboard:', error);
    throw error;
  });
});

const Index = () => {
  console.log('Index component rendering...');
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  console.log('User state:', user);
  console.log('Loading state:', loading);

  if (loading) {
    console.log('Showing loading spinner');
    return <LoadingSpinner />;
  }

  if (user) {
    console.log('User authenticated, loading Dashboard');
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    );
  }

  console.log('No user, showing landing page');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Lend & Borrow with
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Trust</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Secure peer-to-peer lending platform for India. Lend money to friends, family, or trusted individuals with built-in payment tracking and smart contracts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowAuth(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg"
            >
              Get Started Free
            </button>
            <button className="px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200">
              Learn More
            </button>
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Transactions</h3>
            <p className="text-gray-600">Bank-level security with multiple payment options including UPI, bank transfers, and crypto.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Contracts</h3>
            <p className="text-gray-600">Automated loan agreements with built-in payment schedules and dispute resolution.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reputation System</h3>
            <p className="text-gray-600">Build trust with a transparent reputation system based on lending history.</p>
          </div>
        </div>
      </div>
      
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Index;
