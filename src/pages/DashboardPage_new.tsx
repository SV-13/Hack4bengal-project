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
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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

const DashboardPage = () => {
  const user = useSelector((state: RootState) => state.user.profile);
  const auth = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();
  const [showCreateLoan, setShowCreateLoan] = useState(false);
  const [showLoanRequest, setShowLoanRequest] = useState(false);
  const [showInvitationFlow, setShowInvitationFlow] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalLent: 0,
    totalBorrowed: 0,
    activeLoans: 0,
    completedLoans: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<LoanRequest[]>([]);
  const [recentAgreements, setRecentAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) return;

        // Fetch loan agreements where user is lender or borrower
        const { data: agreements, error } = await supabase
          .from('loan_agreements')
          .select(`
            *,
            lender:profiles!lender_id(full_name),
            borrower:profiles!borrower_id(full_name)
          `)
          .or(`lender_id.eq.${currentUser.id},borrower_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        setRecentAgreements(agreements || []);

        // Calculate stats
        const lentAgreements = agreements?.filter(a => a.lender_id === currentUser.id) || [];
        const borrowedAgreements = agreements?.filter(a => a.borrower_id === currentUser.id) || [];
        
        const totalLent = lentAgreements.reduce((sum, a) => sum + (parseFloat(a.amount?.toString() || '0')), 0);
        const totalBorrowed = borrowedAgreements.reduce((sum, a) => sum + (parseFloat(a.amount?.toString() || '0')), 0);
        const activeLoans = agreements?.filter(a => a.status === 'active').length || 0;
        const completedLoans = agreements?.filter(a => a.status === 'completed').length || 0;

        setDashboardStats({
          totalLent,
          totalBorrowed,
          activeLoans,
          completedLoans,
        });

        // Mock pending requests for demo
        setPendingRequests([
          {
            id: '1',
            borrowerName: 'John Doe',
            amount: 5000,
            purpose: 'Small business expansion',
            requestDate: new Date().toISOString(),
          },
          {
            id: '2',
            borrowerName: 'Jane Smith',
            amount: 2500,
            purpose: 'Medical expenses',
            requestDate: new Date(Date.now() - 86400000).toISOString(),
          }
        ]);

      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const handleViewRequest = (request: LoanRequest) => {
    setSelectedRequest(request);
    setShowLoanRequest(true);
  };

  // Updated stats with real data
  const stats = [
    { 
      title: 'Active Loans', 
      value: dashboardStats.activeLoans.toString(), 
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      title: 'Total Lent', 
      value: formatCurrency(dashboardStats.totalLent), 
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600'
    },
    { 
      title: 'Total Borrowed', 
      value: formatCurrency(dashboardStats.totalBorrowed), 
      icon: DollarSign,
      color: 'bg-orange-100 text-orange-600'
    },
    { 
      title: 'Completed Loans', 
      value: dashboardStats.completedLoans.toString(), 
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-600'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button 
              onClick={() => setShowCreateLoan(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Loan
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowInvitationFlow(true)}
            >
              <Bell className="h-4 w-4 mr-2" />
              Invite Borrower
            </Button>
          </div>
        </div>

        {!user?.civicVerified && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Identity verification incomplete.</strong> Complete your KYC with Civic Pass to access all features.
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="outline" className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300">
                    Verify Now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white shadow-sm rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pending Loan Requests */}
        {pendingRequests.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Pending Loan Requests
              </CardTitle>
              <CardDescription>
                Loan requests that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="border border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-yellow-100 p-2 rounded-full">
                            <Users className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{request.borrowerName}</h4>
                            <p className="text-sm text-gray-600">{request.purpose}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(request.amount)}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(request.requestDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => handleViewRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateLoan(true)}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Plus className="text-blue-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">Create Loan</h3>
                  <p className="text-gray-500 text-sm">Set terms and request funding</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowInvitationFlow(true)}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Bell className="text-green-600 h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">Invite Borrower</h3>
                  <p className="text-gray-500 text-sm">Send loan invitation to someone</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Link to="/profile">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="text-purple-600 h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg">View Profile</h3>
                    <p className="text-gray-500 text-sm">Manage your identity & reputation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Agreement List */}
        <div className="mb-8">
          <AgreementList />
        </div>

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
    </div>
  );
};

export default DashboardPage;
