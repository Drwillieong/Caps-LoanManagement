# TODO: Make Pending Application Section More Visible in MemberDashboard

## Task
Move the "View Pending Application" section to a more visible area in MemberDashboard.tsx and include a status icon.

## Steps to Complete

### Step 1: Update routes/web.php
- [x] Add `hasPendingLoan` data to member dashboard by checking for loans with status: 'pending', 'pending_gm_review', 'pending_cc_review', 'awaiting_comaker'

### Step 2: Update MemberDashboard.tsx
- [x] Add `has_pending_loan` prop to the interface
- [x] Add status icon import (Clock, CheckCircle2, AlertCircle)
- [x] Create a prominent "Pending Application" card/section near the top (after Co-maker banner or alongside it)
- [x] Include status icon showing if there's a pending application

## Implementation Notes
- Check for pending loan statuses: 'pending', 'pending_gm_review', 'pending_cc_review', 'awaiting_comaker'
- Display with appropriate status icon (yellow/clock for pending, green for none)

