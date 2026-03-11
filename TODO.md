# TODO: Add Notification Section to MemberDashboard

## Plan
1. [x] Update routes/web.php - Add loan notifications query (co-maker, GM, Credit Com decisions on YOUR loan)
2. [x] Update MemberDashboard.tsx - Add notification section UI with date, from, description, and comment
3. [x] Update TypeScript types - Add notification interfaces (added inline in component)

## Implementation Details

### 1. routes/web.php
- Added query to fetch loan notifications for the member's own loans
- Include statuses:
  - `rejected_by_co_maker` - Co-maker declined your loan
  - `pending_gm_review` - Co-maker accepted, now pending GM
  - `rejected_by_gm` - GM rejected your loan
  - `pending_cc_review` - GM approved, now pending CC
  - `rejected_by_credit_com` - CC rejected your loan
  - `approved` - CC approved your loan
  - `released` - Loan has been released
- Fetch: date, from (Co-Maker/GM/CC/System), description, comment (remarks)

### 2. MemberDashboard.tsx
- Added LoanNotification interface
- Added notifications prop to DashboardProps
- Created notification section UI with:
  - Date column
  - From column (who made the decision)
  - Loan Type column
  - Description column (status with colored badges)
  - Comment column (reason for decision)
- Added styling:
  - Red for rejected (co-maker, GM, CC)
  - Green for approved
  - Blue for released
  - Yellow for pending (pending_gm_review, pending_cc_review)

