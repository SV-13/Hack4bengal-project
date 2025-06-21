import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
  Settings,
  Volume2,
  VolumeX,
  Mail,
  Smartphone
} from "lucide-react";

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  payment_reminders: boolean;
  loan_offers: boolean;
  status_updates: boolean;
  marketing: boolean;
  reminder_days: number;
}

interface PaymentReminder {
  id: string;
  loan_id: string;
  lender_name: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  status: 'upcoming' | 'due_today' | 'overdue';
  reminder_sent: boolean;
}

export const EnhancedNotificationSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    payment_reminders: true,
    loan_offers: true,
    status_updates: true,
    marketing: false,
    reminder_days: 3
  });
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reminders' | 'notifications' | 'settings'>('reminders');

  useEffect(() => {
    if (user) {
      fetchPaymentReminders();
      fetchNotifications();
      loadPreferences();
    }
  }, [user]);

  const fetchPaymentReminders = async () => {
    if (!user) return;

    try {
      // Fetch active loans where user is borrower
      const { data: loans, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .eq('borrower_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const reminders: PaymentReminder[] = (loans || []).map(loan => {
        // Calculate next payment date (simplified - in real app, this would be more complex)
        const startDate = new Date(loan.created_at);
        const nextPaymentDate = new Date(startDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        
        const daysUntilDue = Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        let status: 'upcoming' | 'due_today' | 'overdue' = 'upcoming';
        if (daysUntilDue < 0) status = 'overdue';
        else if (daysUntilDue === 0) status = 'due_today';

        const amount = parseFloat(loan.amount?.toString() || '0');
        const rate = parseFloat(loan.interest_rate?.toString() || '0');
        const duration = loan.duration_months || 1;
        const totalRepayment = amount + (amount * rate * duration) / (100 * 12);
        const monthlyPayment = totalRepayment / duration;

        return {
          id: loan.id,
          loan_id: loan.id,
          lender_name: 'Lender', // Simplified
          amount: monthlyPayment,
          due_date: nextPaymentDate.toISOString(),
          days_until_due: daysUntilDue,
          status,
          reminder_sent: false // Would track this in DB
        };
      });

      // Sort by urgency
      reminders.sort((a, b) => a.days_until_due - b.days_until_due);
      setPaymentReminders(reminders);
    } catch (error) {
      console.error('Error fetching payment reminders:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = () => {
    // Load from localStorage or user profile
    const saved = localStorage.getItem(`notification_prefs_${user?.id}`);
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  };

  const savePreferences = async (newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem(`notification_prefs_${user?.id}`, JSON.stringify(newPrefs));
    
    toast({
      title: "Preferences Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const sendPaymentReminder = async (reminder: PaymentReminder) => {
    try {
      // In a real app, this would trigger email/SMS
      await supabase.from('notifications').insert({
        user_id: user?.id,
        type: 'payment_reminder',
        title: 'Payment Reminder',
        message: `Your payment of ${formatCurrency(reminder.amount)} to ${reminder.lender_name} is due in ${reminder.days_until_due} days.`,
        agreement_id: reminder.loan_id,
        read: false
      });

      toast({
        title: "Reminder Sent",
        description: "Payment reminder has been created.",
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder.",
        variant: "destructive",
      });
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'due_today':
        return 'bg-orange-100 text-orange-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'due_today':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'upcoming':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const urgentReminders = paymentReminders.filter(r => r.status === 'overdue' || r.status === 'due_today');
  const upcomingReminders = paymentReminders.filter(r => r.status === 'upcoming' && r.days_until_due <= preferences.reminder_days);

  return (
    <div className="space-y-6">
      {/* Header with urgent alerts */}
      {urgentReminders.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Urgent Payment Alerts ({urgentReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentReminders.map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">
                      Payment to {reminder.lender_name}: {formatCurrency(reminder.amount)}
                    </p>
                    <p className="text-sm text-red-600">
                      {reminder.status === 'overdue' 
                        ? `Overdue by ${Math.abs(reminder.days_until_due)} days`
                        : 'Due today'
                      }
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => sendPaymentReminder(reminder)}
                  >
                    Pay Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('reminders')}
          className={`pb-2 px-1 font-medium text-sm ${
            activeTab === 'reminders' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Payment Reminders ({paymentReminders.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-2 px-1 font-medium text-sm ${
            activeTab === 'notifications' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Notifications ({notifications.filter(n => !n.read).length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-1 font-medium text-sm ${
            activeTab === 'settings' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          {paymentReminders.length > 0 ? (
            paymentReminders.map(reminder => (
              <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getUrgencyIcon(reminder.status)}
                      <div>
                        <p className="font-medium">
                          Payment to {reminder.lender_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(reminder.amount)} • Due: {new Date(reminder.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(reminder.status)}>
                        {reminder.status === 'overdue' 
                          ? `${Math.abs(reminder.days_until_due)} days overdue`
                          : reminder.status === 'due_today'
                          ? 'Due today'
                          : `${reminder.days_until_due} days`
                        }
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendPaymentReminder(reminder)}
                      >
                        <Bell className="mr-1 h-3 w-3" />
                        Remind Me
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">All Caught Up!</h3>
              <p className="text-gray-500">You have no upcoming payment reminders.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all ${
                  notification.read ? 'opacity-60' : 'hover:shadow-md'
                }`}
                onClick={() => !notification.read && markNotificationRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'payment_reminder' ? 'bg-blue-100' :
                        notification.type === 'loan_accepted' ? 'bg-green-100' :
                        notification.type === 'payment_received' ? 'bg-green-100' :
                        'bg-gray-100'
                      }`}>
                        {notification.type === 'payment_reminder' ? (
                          <Calendar className="h-4 w-4 text-blue-600" />
                        ) : notification.type === 'loan_accepted' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : notification.type === 'payment_received' ? (
                          <DollarSign className="h-4 w-4 text-green-600" />
                        ) : (
                          <Bell className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm ${!notification.read ? 'text-gray-600' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Notifications</h3>
              <p className="text-gray-500">You're all caught up with your notifications.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notification Channels */}
            <div>
              <h4 className="font-semibold mb-3">Notification Channels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>Email Notifications</span>
                  </div>
                  <Switch
                    checked={preferences.email_enabled}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, email_enabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-gray-500" />
                    <span>SMS Notifications</span>
                  </div>
                  <Switch
                    checked={preferences.sms_enabled}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, sms_enabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {preferences.push_enabled ? (
                      <Volume2 className="h-4 w-4 text-gray-500" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-500" />
                    )}
                    <span>Push Notifications</span>
                  </div>
                  <Switch
                    checked={preferences.push_enabled}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, push_enabled: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div>
              <h4 className="font-semibold mb-3">Notification Types</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Payment Reminders</span>
                  <Switch
                    checked={preferences.payment_reminders}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, payment_reminders: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Loan Offers & Requests</span>
                  <Switch
                    checked={preferences.loan_offers}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, loan_offers: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Status Updates</span>
                  <Switch
                    checked={preferences.status_updates}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, status_updates: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Marketing & Promotions</span>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, marketing: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Reminder Timing */}
            <div>
              <h4 className="font-semibold mb-3">Reminder Timing</h4>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Send payment reminders</span>
                <select
                  value={preferences.reminder_days}
                  onChange={(e) => 
                    savePreferences({ ...preferences, reminder_days: parseInt(e.target.value) })
                  }
                  className="border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                </select>
                <span className="text-sm text-gray-600">before due date</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
