import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Clock, FileText, User, Wand2 } from "lucide-react";
import { notifyLoanRequestCreated } from "@/utils/emailNotifications";
import { requestLoan } from "@/utils/supabaseRPC";

interface RequestLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestLoanModal = ({ open, onOpenChange }: RequestLoanModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '',
    interestRate: '',
    description: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Validate required fields
      if (!formData.amount || !formData.purpose || !formData.duration) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      let requestId: string | null = null;

      // Try using the new RPC function first, with fallback to direct insertion
      try {
        const rpcResult = await requestLoan({
          borrowerName: user.name || 'Unknown',
          borrowerEmail: user.email || '',
          amount: parseFloat(formData.amount),
          purpose: formData.purpose,
          durationMonths: parseInt(formData.duration),
          interestRate: parseFloat(formData.interestRate) || 0,
          description: formData.description || undefined
        });

        if (rpcResult.success && rpcResult.request_id) {
          requestId = rpcResult.request_id;
        } else {
          throw new Error(rpcResult.error || 'RPC function failed');
        }
      } catch (rpcError) {
        console.warn('RPC function not available, falling back to direct insertion:', rpcError);
        
        // Fallback to direct database insertion
        const { data, error } = await supabase
          .from('loan_agreements')
          .insert({
            borrower_id: user.id,
            borrower_name: user.name,
            borrower_email: user.email,
            amount: parseFloat(formData.amount),
            purpose: formData.purpose,
            duration_months: parseInt(formData.duration),
            interest_rate: parseFloat(formData.interestRate) || 0,
            conditions: JSON.stringify({
              description: formData.description || null,
              type: 'loan_request'
            }),
            status: 'pending',
            lender_id: null,
            lender_name: null,
            lender_email: null,
            created_at: new Date().toISOString()
          })
          .select();

        if (error) throw error;

        requestId = data && data.length > 0 ? data[0].id : null;
      }

      if (!requestId) {
        throw new Error('Failed to create loan request - no ID returned');
      }

      // Send email notification (if configured)
      try {
        await notifyLoanRequestCreated({
          borrowerName: user.name || 'Unknown',
          borrowerEmail: user.email || '',
          amount: parseFloat(formData.amount),
          purpose: formData.purpose,
          duration: parseInt(formData.duration),
          interestRate: parseFloat(formData.interestRate) || undefined,
          requestId: requestId,
          recipients: [] // For now, no specific recipients - could be enhanced later
        });
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
        // Don't fail the entire request if email fails
      }

      toast({
        title: "Loan Request Submitted",
        description: "Your loan request has been posted. Friends and family will be able to see and respond to it.",
      });

      // Reset form
      setFormData({
        amount: '',
        purpose: '',
        duration: '',
        interestRate: '',
        description: ''
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting loan request:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit loan request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAutofill = () => {
    setFormData({
      amount: '5000',
      purpose: 'education',
      duration: '6',
      interestRate: '2.5',
      description: 'Need funds for semester fees. Will repay on time.'
    });

    toast({
      title: "Form Autofilled",
      description: "Sample values have been filled in. You can modify them as needed.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
            Request a Loan
          </DialogTitle>
          <DialogDescription className="flex justify-between items-center">
            <span>Request a friendly loan from your contacts.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAutofill}
              className="flex items-center gap-1"
            >
              <Wand2 className="h-3 w-3" />
              Autofill
            </Button>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Loan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Months) *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 6"
                  className="pl-10"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Loan Purpose *</Label>
            <Select onValueChange={(value) => handleInputChange('purpose', value)} value={formData.purpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select loan purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="home_improvement">Home Improvement</SelectItem>
                <SelectItem value="personal">Personal Use</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">Preferred Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              placeholder="e.g., 2.5"
              value={formData.interestRate}
              onChange={(e) => handleInputChange('interestRate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Message to Lender</Label>
            <Textarea
              id="description"
              placeholder="Brief explanation of why you need this loan..."
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
