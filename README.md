# Lendit - P2P Lending Platform

A fully functional peer-to-peer lending platform built with React, TypeScript, and Supabase.

## Features

- **User Authentication**: Secure signup/login with Supabase Auth
- **Loan Management**: Create, accept, reject, and manage loan agreements
- **Transaction Tracking**: Complete transaction history and payment tracking
- **Notifications System**: Real-time notifications for all loan activities
- **Dashboard**: Comprehensive overview of lending and borrowing activities
- **Reputation System**: User reputation scoring based on loan history
- **Multiple Payment Methods**: Support for UPI, bank transfers, wallets, crypto, and cash

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks

## Database Schema

### Core Tables
- `profiles` - User profiles and reputation scores
- `loan_agreements` - Loan contracts between lenders and borrowers
- `transactions` - Payment records and transaction history
- `invitations` - Invitations for non-registered users
- `notifications` - System notifications and alerts

## Setup Instructions

### 1. Database Setup

**IMPORTANT**: The notifications table needs to be created manually in Supabase.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `NOTIFICATIONS_MIGRATION.sql`
4. Execute the script

This will create:
- The notifications table with proper RLS policies
- Trigger functions for automatic notifications
- Database indexes for performance
- Sample data (optional)

### 2. Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. The Supabase configuration is already set up in `src/integrations/supabase/client.ts`

### 3. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or next available port).

### 4. Database Verification

After starting the app:
1. Sign up for a new account or log in
2. Go to the "Setup" tab in the dashboard
3. Click "Check Database Setup" to verify all tables are working correctly

## Features Overview

### Dashboard
- **Overview Tab**: Quick stats and actions
- **Agreements Tab**: Manage all loan agreements
- **Transactions Tab**: View payment history
- **Notifications Tab**: Real-time alerts and updates
- **Requests Tab**: Pending loan requests
- **Setup Tab**: Database verification and setup

### Loan Agreements
- Create loan requests with customizable terms
- Accept/reject incoming loan requests
- Track loan status (pending → accepted → active → completed)
- Make payments with automatic transaction recording
- View detailed loan information and progress

### Notifications System
- Automatic notifications for loan status changes
- Payment received/sent alerts
- Loan completion notifications
- Mark as read/unread functionality
- Real-time updates via Supabase subscriptions

### Transaction History
- Complete payment tracking
- Filter by transaction type and status
- Payment method tracking
- Reference number storage
- Automatic categorization

## File Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── AgreementList.tsx    # Loan agreement management
│   ├── Dashboard.tsx        # Main dashboard with tabs
│   ├── NotificationSystem.tsx # Notifications component
│   ├── TransactionHistory.tsx # Transaction tracking
│   ├── DatabaseSetup.tsx     # Database verification
│   └── ...
├── hooks/
│   ├── useAuth.tsx      # Authentication hook
│   └── ...
├── integrations/
│   └── supabase/        # Supabase client and types
├── utils/
│   ├── currency.ts      # Currency formatting
│   └── ...
└── ...
```

## Security Features

- Row Level Security (RLS) on all tables
- User-specific data access policies
- Secure authentication with Supabase
- Input validation and sanitization
- Protected API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Notifications Not Working
- Ensure the `NOTIFICATIONS_MIGRATION.sql` has been executed
- Check the "Setup" tab for database status
- Verify Supabase connection in the browser console

### Authentication Issues
- Check Supabase project URL and anon key
- Verify email confirmation settings in Supabase Auth
- Check browser console for auth errors

### Performance Issues
- Ensure database indexes are created (included in migration)
- Check network tab for slow queries
- Monitor Supabase dashboard for usage metrics

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the database setup instructions
3. Check the browser console for errors
4. Verify Supabase configuration

---

**Note**: This is a demo application. For production use, implement additional security measures, data validation, and error handling as needed.
