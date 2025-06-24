# Loan Status Flow Documentation

## Status Definitions

### 1. `pending`
- **Definition**: Loan offer has been created by lender, waiting for borrower acceptance
- **Triggers**: 
  - Lender creates loan offer via CreateLoanModal
  - Borrower creates loan request (lender_id = null initially)
- **Next States**: `accepted`, `rejected`
- **Who can see**: Lender, Borrower (if email matches), Public (for browse functionality)

### 2. `accepted`
- **Definition**: Borrower has accepted the loan terms, ready for funding
- **Triggers**: 
  - Borrower clicks "Accept & Sign Agreement" in LoanAcceptanceModal
  - borrower_signature timestamp is recorded
- **Next States**: `funded`, `cancelled`
- **Actions Required**: Lender needs to transfer funds to borrower

### 3. `funded` / `active`
- **Definition**: Lender has transferred funds to borrower, loan is now active
- **Triggers**: 
  - Lender confirms fund transfer (manual process or payment integration)
  - System records funding_date and transaction details
- **Next States**: `repaid`, `overdue`, `defaulted`
- **Actions Required**: Borrower needs to make repayments according to schedule

### 4. `repaid` / `completed`
- **Definition**: Borrower has fully repaid the loan including principal + interest
- **Triggers**: 
  - Final repayment is recorded
  - System validates total repayment amount
- **Next States**: None (terminal state)
- **Actions**: Both parties receive completion notifications, reputation scores updated

### 5. `rejected`
- **Definition**: Borrower has declined the loan offer
- **Triggers**: 
  - Borrower clicks "Decline Offer" in LoanAcceptanceModal
  - borrower_signature timestamp records rejection
- **Next States**: None (terminal state)
- **Actions**: Lender is notified of rejection

### 6. `cancelled`
- **Definition**: Agreement was cancelled before funding (by either party)
- **Triggers**: 
  - Lender withdraws offer before funding
  - Borrower cancels after acceptance but before funding
- **Next States**: None (terminal state)
- **Actions**: Both parties notified

### 7. `overdue`
- **Definition**: Borrower has missed payment deadline(s)
- **Triggers**: 
  - Automated system check for missed payments
  - Grace period expired
- **Next States**: `active` (if caught up), `defaulted`
- **Actions**: Overdue notifications, potential penalties

### 8. `defaulted`
- **Definition**: Loan is in serious default, collection may be required
- **Triggers**: 
  - Extended overdue period
  - Multiple missed payments
- **Next States**: `repaid` (if resolved), legal action
- **Actions**: Collection process, reputation impact

## Status Transitions

```
pending -> accepted (borrower accepts)
pending -> rejected (borrower declines)

accepted -> funded (lender transfers funds)
accepted -> cancelled (either party cancels)

funded -> repaid (successful completion)
funded -> overdue (missed payments)

overdue -> funded (payments caught up)
overdue -> defaulted (continued default)

defaulted -> repaid (full settlement)
```

## Implementation Notes

### Database Fields
- `status`: Primary status field
- `borrower_signature`: Timestamp when borrower takes action
- `lender_signature`: Timestamp when lender creates/funds
- `funding_date`: When funds were transferred
- `due_date`: Next payment due date
- `completion_date`: When loan was fully repaid

### Dashboard Calculations
- **Active Loans**: `status IN ('funded', 'active', 'overdue')`
- **Completed Loans**: `status IN ('repaid', 'completed')`
- **Pending Requests**: `status = 'pending' AND lender_id = current_user`

### Notification Triggers
- Loan created -> Notify borrower
- Loan accepted -> Notify lender
- Loan funded -> Notify borrower
- Payment due -> Notify borrower
- Payment overdue -> Notify both parties
- Loan completed -> Notify both parties

## Next Implementation Steps

1. **Payment Integration**: Add status transitions for funding (`accepted` -> `funded`)
2. **Repayment Tracking**: Add repayment recording and status updates
3. **Automated Notifications**: Implement status-based notification system
4. **Payment Reminders**: Add scheduled reminders for due dates
5. **Default Management**: Add overdue/default detection and handling
