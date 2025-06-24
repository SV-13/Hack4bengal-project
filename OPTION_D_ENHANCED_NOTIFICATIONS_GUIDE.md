# Option D: Enhanced Notification System - IMPLEMENTATION GUIDE 🔔

## Current Notification System Analysis

### ✅ **Already Implemented Features**

#### 1. Email Notification Service ✅
- **`emailNotifications.ts`** - Comprehensive email templates
- **`send-email.ts` API** - Serverless email sending
- **Email types**: Loan request, acceptance, contract ready
- **Professional templates** with HTML styling

#### 2. Enhanced Notification System ✅  
- **Payment reminders** with urgency detection
- **Notification preferences** with granular controls
- **Real-time notifications** via Supabase subscriptions
- **Multi-tab interface**: Reminders, Notifications, Settings

#### 3. Database Integration ✅
- **Notifications table** with RLS policies
- **Real-time subscriptions** for instant updates
- **Notification types** and status tracking
- **User preference storage**

### 🚀 **Option D Enhancements to Implement**

#### 1. SMS Notification Service
- **Twilio integration** for SMS sending
- **Phone number verification** system
- **SMS templates** for key events
- **Delivery tracking** and status

#### 2. Push Notification System
- **Web Push API** integration
- **Service Worker** for background notifications
- **Permission management** UI
- **Notification batching** and throttling

#### 3. Advanced Notification Scheduling
- **Automated payment reminders** with escalation
- **Smart timing** based on user activity
- **Notification digest** for multiple events
- **Priority routing** (email vs SMS vs push)

#### 4. WhatsApp Business Integration
- **WhatsApp API** for critical notifications
- **Rich media support** (PDFs, images)
- **Two-way communication** for confirmations
- **Business account setup**

## Implementation Plan

### Phase 1: SMS Notification Service

#### Step 1: Install Twilio SDK
```bash
npm install twilio
```

#### Step 2: Create SMS Service (`src/utils/smsService.ts`)
```typescript
import twilio from 'twilio';

interface SmsConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SmsService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(config: SmsConfig) {
    this.client = twilio(config.accountSid, config.authToken);
    this.fromNumber = config.fromNumber;
  }

  async sendSms(to: string, message: string): Promise<SmsResult> {
    try {
      const result = await this.client.messages.create({
        from: this.fromNumber,
        to: to,
        body: message
      });

      return {
        success: true,
        messageId: result.sid
      };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendPaymentReminder(data: {
    to: string;
    borrowerName: string;
    amount: number;
    dueDate: string;
    lenderName: string;
  }): Promise<SmsResult> {
    const message = `Hi ${data.borrowerName}, reminder: Your payment of ₹${data.amount.toLocaleString()} to ${data.lenderName} is due on ${data.dueDate}. Pay via LendIt app to avoid late fees.`;
    
    return this.sendSms(data.to, message);
  }

  async sendLoanApproval(data: {
    to: string;
    borrowerName: string;
    amount: number;
    lenderName: string;
  }): Promise<SmsResult> {
    const message = `🎉 Good news ${data.borrowerName}! ${data.lenderName} has approved your loan of ₹${data.amount.toLocaleString()}. Check your LendIt app for next steps.`;
    
    return this.sendSms(data.to, message);
  }
}

export const smsService = new SmsService({
  accountSid: process.env.VITE_TWILIO_ACCOUNT_SID || '',
  authToken: process.env.VITE_TWILIO_AUTH_TOKEN || '',
  fromNumber: process.env.VITE_TWILIO_FROM_NUMBER || ''
});
```

#### Step 3: Phone Number Verification Component
```typescript
// src/components/PhoneVerification.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export const PhoneVerification = ({ onVerified }: { onVerified: (phone: string) => void }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      if (response.ok) {
        setStep('otp');
        toast({ title: "OTP Sent", description: "Check your phone for verification code" });
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });

      if (response.ok) {
        onVerified(phone);
        toast({ title: "Phone Verified", description: "SMS notifications enabled" });
      } else {
        throw new Error('Invalid OTP');
      }
    } catch (error) {
      toast({ title: "Error", description: "Invalid OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'phone' ? (
        <>
          <Input
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button onClick={sendOtp} disabled={loading || !phone}>
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <Input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />
          <Button onClick={verifyOtp} disabled={loading || otp.length !== 6}>
            Verify Phone
          </Button>
        </>
      )}
    </div>
  );
};
```

### Phase 2: Push Notification System

#### Step 1: Service Worker Setup
```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New notification from LendIt',
    icon: '/lendit-icon-192.png',
    badge: '/lendit-badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'View in App',
        icon: '/lendit-checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/lendit-xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('LendIt P2P Lending', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://your-app.com/dashboard')
    );
  }
});
```

#### Step 2: Push Notification Service
```typescript
// src/utils/pushNotificationService.ts
class PushNotificationService {
  private vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || '';

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeUser(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendTestNotification() {
    if (Notification.permission === 'granted') {
      new Notification('LendIt Test', {
        body: 'Push notifications are working!',
        icon: '/lendit-icon-192.png'
      });
    }
  }
}

export const pushNotificationService = new PushNotificationService();
```

#### Step 3: Push Notification Component
```typescript
// src/components/PushNotificationSetup.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";
import { pushNotificationService } from "@/utils/pushNotificationService";

export const PushNotificationSetup = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const enableNotifications = async () => {
    const granted = await pushNotificationService.requestPermission();
    if (granted) {
      setPermission('granted');
      const subscription = await pushNotificationService.subscribeUser();
      setSubscribed(!!subscription);
    }
  };

  const testNotification = () => {
    pushNotificationService.sendTestNotification();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {permission === 'granted' ? (
            <Bell className="mr-2 h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="mr-2 h-5 w-5 text-gray-400" />
          )}
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'default' && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Enable push notifications to get instant alerts about your loans, payments, and important updates.
            </p>
            <Button onClick={enableNotifications}>
              Enable Push Notifications
            </Button>
          </div>
        )}

        {permission === 'granted' && subscribed && (
          <div>
            <p className="text-sm text-green-600 mb-3">
              ✅ Push notifications are enabled
            </p>
            <Button variant="outline" onClick={testNotification}>
              Send Test Notification
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <div>
            <p className="text-sm text-red-600">
              Push notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### Phase 3: Advanced Notification Scheduling

#### Step 1: Notification Scheduler Service
```typescript
// src/utils/notificationScheduler.ts
interface ScheduledNotification {
  id: string;
  userId: string;
  type: 'payment_reminder' | 'overdue_alert' | 'loan_expiry';
  scheduledFor: Date;
  data: any;
  channels: ('email' | 'sms' | 'push')[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class NotificationScheduler {
  private scheduled: Map<string, NodeJS.Timeout> = new Map();

  schedulePaymentReminder(data: {
    userId: string;
    loanId: string;
    amount: number;
    dueDate: Date;
    reminderDays: number;
  }) {
    const reminderDate = new Date(data.dueDate);
    reminderDate.setDate(reminderDate.getDate() - data.reminderDays);

    const notificationId = `payment_reminder_${data.loanId}_${data.reminderDays}d`;
    
    this.scheduleNotification({
      id: notificationId,
      userId: data.userId,
      type: 'payment_reminder',
      scheduledFor: reminderDate,
      data: {
        loanId: data.loanId,
        amount: data.amount,
        dueDate: data.dueDate,
        daysRemaining: data.reminderDays
      },
      channels: ['email', 'push'],
      priority: data.reminderDays <= 1 ? 'high' : 'medium'
    });
  }

  scheduleOverdueAlert(data: {
    userId: string;
    loanId: string;
    amount: number;
    daysPastDue: number;
  }) {
    const alertDate = new Date();
    alertDate.setHours(alertDate.getHours() + 1); // Send in 1 hour

    this.scheduleNotification({
      id: `overdue_alert_${data.loanId}_${data.daysPastDue}d`,
      userId: data.userId,
      type: 'overdue_alert',
      scheduledFor: alertDate,
      data,
      channels: ['email', 'sms', 'push'],
      priority: 'critical'
    });
  }

  private scheduleNotification(notification: ScheduledNotification) {
    const delay = notification.scheduledFor.getTime() - Date.now();
    
    if (delay <= 0) {
      // Send immediately if scheduled time has passed
      this.sendNotification(notification);
      return;
    }

    const timeout = setTimeout(() => {
      this.sendNotification(notification);
      this.scheduled.delete(notification.id);
    }, delay);

    this.scheduled.set(notification.id, timeout);
  }

  private async sendNotification(notification: ScheduledNotification) {
    const { channels, priority, data, type, userId } = notification;

    // Route based on priority and user preferences
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(notification);
            break;
          case 'sms':
            await this.sendSmsNotification(notification);
            break;
          case 'push':
            await this.sendPushNotification(notification);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }

    // Log to database
    await this.logNotification(notification);
  }

  cancelScheduledNotification(notificationId: string) {
    const timeout = this.scheduled.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduled.delete(notificationId);
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
```

### Phase 4: WhatsApp Business Integration

#### Step 1: WhatsApp Business API Setup
```typescript
// src/utils/whatsappService.ts
interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendMessage(to: string, message: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('WhatsApp message sending failed:', error);
      throw error;
    }
  }

  async sendTemplate(to: string, templateName: string, parameters: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en'
            },
            components: [
              {
                type: 'body',
                parameters: parameters
              }
            ]
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('WhatsApp template sending failed:', error);
      throw error;
    }
  }

  async sendDocument(to: string, documentUrl: string, caption: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'document',
          document: {
            link: documentUrl,
            caption: caption
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('WhatsApp document sending failed:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService({
  accessToken: process.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '',
  businessAccountId: process.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID || ''
});
```

## Environment Variables Required

```env
# SMS (Twilio)
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_FROM_NUMBER=+1234567890

# Push Notifications (VAPID)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key

# WhatsApp Business
VITE_WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
VITE_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

## Integration with Existing System

### Update Enhanced Notification System
1. Add SMS toggle to preferences
2. Add push notification setup
3. Add WhatsApp option for critical alerts
4. Integrate scheduling for automated reminders

### Update Loan Flow Triggers
1. Schedule payment reminders on loan acceptance
2. Send multi-channel notifications on status changes
3. Escalate overdue payments through multiple channels
4. Send contract documents via WhatsApp

## Testing Strategy

### Unit Tests
- SMS service functionality
- Push notification subscription
- Notification scheduling logic
- WhatsApp API integration

### Integration Tests
- End-to-end notification flow
- Multi-channel delivery
- Preference handling
- Error recovery

### User Acceptance Tests
- Notification delivery across channels
- Preference management UI
- Permission handling
- Message clarity and timing

## Production Deployment Checklist

### Service Setup
- [ ] Twilio account and phone number
- [ ] VAPID keys generated
- [ ] WhatsApp Business account verified
- [ ] Service worker deployed

### Security
- [ ] API keys secured in environment
- [ ] Rate limiting implemented
- [ ] User consent tracking
- [ ] Opt-out mechanisms

### Monitoring
- [ ] Delivery rate tracking
- [ ] Error rate monitoring
- [ ] User engagement metrics
- [ ] Cost monitoring for SMS/WhatsApp

This comprehensive enhancement will transform LendIt into a full-featured notification platform with multi-channel delivery, smart scheduling, and professional business communication capabilities!
