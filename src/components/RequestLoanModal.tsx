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
import { DollarSign, Clock, FileText, User } from "lucide-react";

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
    collateral: '',
    monthlyIncome: '',
    employmentStatus: '',
    creditScore: '',
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
      }      // Create loan request in database using existing loan_agreements table
      const { data, error } = await supabase
        .from('loan_agreements')
        .insert({
          lender_id: null, // No lender yet, this is a request
          borrower_id: user.id,
          borrower_name: user.name,
          borrower_email: user.email,
          amount: parseFloat(formData.amount),
          interest_rate: parseFloat(formData.interestRate) || 10, // Default 10%
          duration_months: parseInt(formData.duration),
          purpose: formData.purpose,
          status: 'pending', // Request status
          conditions: JSON.stringify({
            collateral: formData.collateral,
            monthly_income: parseFloat(formData.monthlyIncome) || null,
            employment_status: formData.employmentStatus,
            credit_score: parseInt(formData.creditScore) || null,
            description: formData.description,
            type: 'loan_request' // Mark as loan request
          }),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for potential lenders
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'loan_request_created',
          title: 'Loan Request Created',
          message: `Your loan request for ₹${formData.amount} has been posted successfully.`,
          data: { agreement_id: data.id },
        });      toast({
        title: "Loan Request Created!",
        description: `Your request for ₹${formData.amount} has been posted. Lenders will be able to view and respond to your request.`,
      });

      // Reset form and close modal
      setFormData({
        amount: '',
        purpose: '',
        duration: '',
        interestRate: '',
        collateral: '',
        monthlyIncome: '',
        employmentStatus: '',
        creditScore: '',
        description: ''
      });
      onOpenChange(false);

      toast({
        title: "Loan Request Submitted",
        description: "Your loan request has been posted. Lenders will be able to see and respond to it.",
      });

      // Reset form
      setFormData({
        amount: '',
        purpose: '',
        duration: '',
        interestRate: '',
        collateral: '',
        monthlyIncome: '',
        employmentStatus: '',
        creditScore: '',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
            Request a Loan
          </DialogTitle>
          <DialogDescription>
            Fill out the details below to request a loan from our community of lenders.
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
                  placeholder="e.g., 12"
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
                <SelectItem value="business">Business Investment</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="medical">Medical Emergency</SelectItem>
                <SelectItem value="home_improvement">Home Improvement</SelectItem>
                <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Monthly Income</Label>
              <Input
                id="monthlyIncome"
                type="number"
                placeholder="Your monthly income"
                value={formData.monthlyIncome}
                onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <Select onValueChange={(value) => handleInputChange('employmentStatus', value)} value={formData.employmentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self Employed</SelectItem>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestRate">Preferred Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                placeholder="e.g., 5.5"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditScore">Credit Score (if known)</Label>
              <Input
                id="creditScore"
                type="number"
                placeholder="e.g., 750"
                value={formData.creditScore}
                onChange={(e) => handleInputChange('creditScore', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collateral">Collateral (Optional)</Label>
            <Input
              id="collateral"
              placeholder="Describe any collateral you can offer"
              value={formData.collateral}
              onChange={(e) => handleInputChange('collateral', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional information that might help lenders understand your request..."
              rows={4}
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
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
