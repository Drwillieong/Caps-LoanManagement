# GM Dashboard Improvement Plan

## Task
Remove hardcoded values from GM Dashboard and make it dynamic

## Steps to Complete:

- [x] 1. Update `routes/web.php` - Add GM-specific data fetching in dashboard route
- [x] 2. Update `resources/js/pages/dashboards/Gm/GmDashboard.tsx` - Accept props and display dynamic data
- [ ] 3. Create GM Active Loans page (`GMActiveLoan.tsx`)
- [ ] 4. Add route and controller for GM Active Loans in web.php

## Details:

### Step 1: Update web.php (DONE)
- Add GM data fetching when role === 'gm'
- Include:
  - Total loan portfolio
  - Active members count
  - Pending GM approvals count
  - Recent pending GM review loans
  - Loan health metrics

### Step 2: Update GmDashboard.tsx (DONE)
- Add TypeScript interfaces for props
- Replace hardcoded values with props
- Add proper currency formatting

### Step 3: Create GMActiveLoan.tsx
- Display list of active loans with:
  - Member information
  - Loan details (type, principal, terms)
  - Payment status
  - Balance remaining
  - Action buttons (view details)

### Step 4: Add route for GM Active Loans
- Add controller method to fetch active loans data
- Add route in web.php

