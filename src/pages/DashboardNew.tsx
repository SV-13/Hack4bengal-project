import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useUser } from '@civic/auth/react';

const DashboardPage = () => {
  const user = useSelector((state: RootState) => state.user.profile);
  const auth = useSelector((state: RootState) => state.auth);
  const { user: civicUser, authStatus } = useUser();
  
  console.log('✅ Dashboard rendered successfully!', { user, auth, civicUser: !!civicUser, authStatus });

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">🎉 Dashboard Working!</h1>
        
        <div className="grid gap-6">
          {/* Status Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-green-600 mb-4">✅ Dashboard Successfully Loaded</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Redux User:</strong> {user?.name || 'No user'}</p>
              <p><strong>Email:</strong> {user?.email || 'No email'}</p>
              <p><strong>Auth Status:</strong> {auth.isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</p>
              <p><strong>Auth Method:</strong> {auth.authMethod || 'None'}</p>
              <p><strong>Civic User:</strong> {civicUser?.name || civicUser?.email || 'No civic user'}</p>
              <p><strong>Civic Status:</strong> {authStatus}</p>
              <p><strong>Civic Verified:</strong> {user?.civicVerified ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          {/* Sample Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Total Lent</h3>
              <p className="text-2xl font-bold text-green-600">$15,000</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Total Borrowed</h3>
              <p className="text-2xl font-bold text-orange-600">$8,000</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Active Loans</h3>
              <p className="text-2xl font-bold text-blue-600">5</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-2xl font-bold text-purple-600">12</p>
            </div>
          </div>

          {/* Sample Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex gap-4 flex-wrap">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                Create Loan
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
                Explore Loans
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition">
                View Profile
              </button>
            </div>
          </div>

          {/* Sample Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Loan request from John Doe</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Payment received from Jane Smith</span>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>New loan agreement created</span>
                <span className="text-sm text-gray-500">3 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
