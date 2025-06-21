import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { 
  DollarSign, 
  Clock, 
  User, 
  FileText, 
  TrendingUp,
  Calendar,
  Briefcase,
  Shield
} from "lucide-react";

interface LoanRequest {
  id: string;
  borrower_id: string;
  borrower_name: string;
  borrower_email: string;
  amount: number;
  purpose: string;
  duration_months: number;
  interest_rate: number;
  conditions: string; // JSON string containing additional details
  status: string;
  created_at: string;
  lender_id?: string;
}

interface BrowseLoanRequestsProps {
  onOfferLoan?: (request: LoanRequest) => void;
}

export const BrowseLoanRequests = ({ onOfferLoan }: BrowseLoanRequestsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Helper function to parse conditions JSON
  const parseConditions = (conditions: string) => {
    try {
      return JSON.parse(conditions || '{}');
    } catch {
      return {};
    }
  };

  useEffect(() => {
    fetchLoanRequests();
  }, []);

  const fetchLoanRequests = async () => {
    try {
      setLoading(true);
        const { data, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .eq('status', 'pending')
        .is('lender_id', null) // Only show requests without assigned lenders
        .neq('borrower_id', user?.id); // Don't show user's own requests

      if (error) throw error;

      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching loan requests:', error);
      toast({
        title: "Error",
        description: "Failed to load loan requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPurposeColor = (purpose: string) => {
    const colors: { [key: string]: string } = {
      business: 'bg-blue-100 text-blue-800',
      education: 'bg-green-100 text-green-800',
      medical: 'bg-red-100 text-red-800',
      home_improvement: 'bg-orange-100 text-orange-800',
      debt_consolidation: 'bg-purple-100 text-purple-800',
      wedding: 'bg-pink-100 text-pink-800',
      travel: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[purpose] || colors.other;
  };
  const formatPurpose = (purpose: string) => {
    return purpose.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  const filteredRequests = requests.filter(request => {
    // Parse conditions to check if it's a loan request
    try {
      const conditions = JSON.parse(request.conditions || '{}');
      if (conditions.type !== 'loan_request') return false;
    } catch {
      return false; // Not a loan request if conditions can't be parsed
    }
    
    if (filter === 'all') return true;
    return request.purpose === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Available Loan Requests</h2>
          <p className="text-gray-600">Browse and respond to borrower requests</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({requests.length})
          </Button>
          {['business', 'education', 'medical', 'home_improvement'].map(purpose => {
            const count = requests.filter(r => r.purpose === purpose).length;
            if (count === 0) return null;
            return (
              <Button
                key={purpose}
                variant={filter === purpose ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(purpose)}
              >
                {formatPurpose(purpose)} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No loan requests found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "There are no pending loan requests at the moment."
                : `No ${formatPurpose(filter).toLowerCase()} requests available.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request) => {
            const conditions = parseConditions(request.conditions);
            return (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {request.borrower_name}
                    </CardTitle>
                    <div className="flex items-center mt-1">
                      <Badge className={getPurposeColor(request.purpose)}>
                        {formatPurpose(request.purpose)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(request.amount)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {request.duration_months} months
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Information */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {request.interest_rate > 0 && (
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Rate:</span>
                      <span className="ml-1 font-medium">{request.interest_rate}%</span>
                    </div>
                  )}
                  
                  {conditions.monthly_income && (
                    <div className="flex items-center">
                      <DollarSign className="mr-2 h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Income:</span>
                      <span className="ml-1 font-medium">{formatCurrency(conditions.monthly_income)}/mo</span>
                    </div>
                  )}
                  
                  {conditions.employment_status && (
                    <div className="flex items-center">
                      <Briefcase className="mr-2 h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-1 font-medium capitalize">{conditions.employment_status.replace('_', ' ')}</span>
                    </div>
                  )}
                  
                  {conditions.credit_score && (
                    <div className="flex items-center">
                      <Shield className="mr-2 h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Credit:</span>
                      <span className="ml-1 font-medium">{conditions.credit_score}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {conditions.description && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {conditions.description}
                  </div>
                )}

                {/* Collateral */}
                {conditions.collateral && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Collateral:</span>
                    <span className="ml-2 text-gray-600">{conditions.collateral}</span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-xs text-gray-500 flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Recent request
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => onOfferLoan?.(request)}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    Make Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
