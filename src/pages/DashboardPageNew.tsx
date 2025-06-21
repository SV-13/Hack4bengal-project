import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RootState } from '../store';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency } from '../utils/currency';
import CreateLoanModal from '../components/CreateLoanModal';
import AgreementList from '../components/AgreementList';
import { LoanRequestModal } from '../components/LoanRequestModal';
import { InvitationFlow } from '../components/InvitationFlow';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@civic/auth/react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  Plus,
  Bell,
  Eye,
  Clock,
  CheckCircle
} from "lucide-react";

interface LoanRequest {
  id: string;
  borrowerName: string;
  amount: number;
  purpose: string;
  requestDate: string;
}

const DashboardPageNew = () => {
  // Selectors
  const user = useSelector((state: RootState) => state.user);
  const auth = useSelector((state: RootState) => state.auth);
  const { user: civicUser, authStatus } = useUser();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateLoan, setShowCreateLoan] = useState(false);
  const [showLoanRequest, setShowLoanRequest] = useState(false);
  const [showInvitationFlow, setShowInvitationFlow] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalLent: 0,
    totalBorrowed: 0,
    activeAgreements: 0,
    totalEarnings: 0,
    recentActivity: [] as any[],
    loanRequests: [] as LoanRequest[]
  });

  const mockCivicUser = civicUser || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    wallet: '0x123...456'
  };

  console.log('DashboardPage render:', { user, auth, civicUser: !!civicUser, authStatus });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          console.log('Fetching data for user:', currentUser.id);

          const { data: agreements, error } = await supabase
            .from('loan_agreements')
            .select(`
              *,
              loan_requests!inner(*)
            `)
            .or(`lender_id.eq.${currentUser.id},borrower_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) {
            console.error('Error fetching agreements:', error);
          } else {
            console.log('Agreements fetched:', agreements);
            
            const totalLent = agreements?.filter(a => a.lender_id === currentUser.id)
              .reduce((sum, a) => sum + (a.amount || 0), 0) || 0;
            const totalBorrowed = agreements?.filter(a => a.borrower_id === currentUser.id)
              .reduce((sum, a) => sum + (a.amount || 0), 0) || 0;
            const activeCount = agreements?.filter(a => a.status === 'active').length || 0;

            setDashboardStats({
              totalLent,
              totalBorrowed,
              activeAgreements: activeCount,
              totalEarnings: totalLent * 0.05, // Mock 5% earnings
              recentActivity: mockRecentActivity,
              loanRequests: mockLoanRequests
            });
          }
        } else {
          console.log('No authenticated user, using fallback data');
          
          setDashboardStats({
            totalLent: 15000,
            totalBorrowed: 8500,
            activeAgreements: 3,
            totalEarnings: 750,
            recentActivity: [
              {
                id: '1',
                type: 'Payment Received',
                amount: '$500',
                date: '2 days ago',
                status: 'Completed'
              },
              {
                id: '2',
                type: 'Loan Disbursed',
                amount: '$2,000',
                date: '1 week ago',
                status: 'Active'
              },
              {
                id: '3',
                type: 'Application Submitted',
                amount: '$1,500',
                date: '2 weeks ago',
                status: 'Pending'
              }
            ],
            loanRequests: [
              {
                id: '1',
                borrowerName: 'Alice Johnson',
                amount: 5000,
                purpose: 'Business expansion',
                requestDate: '2024-01-15'
              },
              {
                id: '2',
                borrowerName: 'Bob Smith',
                amount: 3000,
                purpose: 'Education',
                requestDate: '2024-01-14'
              }
            ]
          });
        }
      } catch (error: any) {
        console.error('Dashboard data fetch error:', error);
        setError(error.message || 'Failed to load dashboard data');
        
        setDashboardStats({
          totalLent: 0,
          totalBorrowed: 0,
          activeAgreements: 0,
          totalEarnings: 0,
          recentActivity: [],
          loanRequests: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, civicUser]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const handleViewRequest = (request: LoanRequest) => {
    setSelectedRequest(request);
    setShowLoanRequest(true);
  };

  // Mock data for fallback
  const mockRecentActivity = [
    { 
      id: '1', 
      type: 'Payment Received', 
      amount: '$500', 
      date: '2 days ago',
      status: 'Completed'
    },
    { 
      id: '2', 
      type: 'Loan Disbursed', 
      amount: '$2,000', 
      date: '1 week ago',
      status: 'Active'
    }
  ];

  const mockLoanRequests: LoanRequest[] = [
    {
      id: '1',
      borrowerName: 'Alice Johnson',
      amount: 5000,
      purpose: 'Business expansion',
      requestDate: '2024-01-15'
    },
    {
      id: '2',
      borrowerName: 'Bob Smith',
      amount: 3000,
      purpose: 'Education',
      requestDate: '2024-01-14'
    }
  ];

  const recentAgreements = dashboardStats.recentActivity;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {mockCivicUser?.name || mockCivicUser?.email?.split('@')[0] || user?.profile?.name || 'User'}
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your loans today.</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setShowCreateLoan(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Loan
          </Button>
          <Button variant="outline" onClick={() => setShowInvitationFlow(true)}>
            <Users className="w-4 h-4 mr-2" />
            Invite Friends
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalLent)}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalBorrowed)}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.activeAgreements}</div>
              <p className="text-xs text-muted-foreground">2 new this week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & Loan Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest loan activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-sm text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{activity.amount}</p>
                      <Badge 
                        variant="outline" 
                        className={
                          activity.status === 'Completed' ? 'text-green-600 border-green-300' :
                          activity.status === 'Active' ? 'text-blue-600 border-blue-300' :
                          'text-orange-600 border-orange-300'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loan Requests */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Loan Requests</CardTitle>
              <CardDescription>Pending requests from borrowers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats.loanRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{request.borrowerName}</h4>
                        <p className="text-sm text-gray-500">{request.purpose}</p>
                        <p className="text-sm text-gray-400">
                          Requested {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(request.amount)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Agreements */}
      {recentAgreements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <AgreementList />
        </motion.div>
      )}

      {/* Modals */}
      <CreateLoanModal
        open={showCreateLoan}
        onOpenChange={setShowCreateLoan}
      />

      {selectedRequest && (
        <LoanRequestModal
          open={showLoanRequest}
          onOpenChange={setShowLoanRequest}
          request={selectedRequest}
        />
      )}

      <InvitationFlow
        open={showInvitationFlow}
        onOpenChange={setShowInvitationFlow}
      />
    </div>
  );
};

export default DashboardPageNew;
