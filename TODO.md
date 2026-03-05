# Credit Coordinator Loan Validation Feature - TODO

## Phase 1: Backend Changes - COMPLETED ✅

- [x] 1.1 Modify GmController.php - Change GM approval to set `pending_cc_review` status
- [x] 1.2 Create CreditComController.php - New controller with all required functions
- [x] 1.3 Add routes in web.php for CreditCom

## Phase 2: Frontend - CrCoorLoanApplication.tsx - COMPLETED ✅

- [x] 2.1 Fix breadcrumb path
- [x] 2.2 Fix title and description
- [x] 2.3 Fix View link to point to CreditCom routes
- [x] 2.4 Add pending_cc_review status to status config

## Phase 3: Frontend - CrCoorValidateLoan.tsx - COMPLETED ✅

- [x] 3.1 Fix breadcrumb path
- [x] 3.2 Fix status badge to show "Pending CC Review"
- [x] 3.3 Fix API endpoints to point to CreditCom routes

## Phase 4: CreditComDashboard Updates - COMPLETED ✅

- [x] 4.1 Add CreditCom data in web.php dashboard route
- [x] 4.2 Update CreditComDashboard with navigation cards and stats

## Phase 5: Testing

- [ ] 5.1 Test the full workflow end-to-end

## Flow Summary:

1. Member applies for loan → status: `pending`
2. Co-Maker accepts → status: `pending_gm_review`
3. GM approves → status: `pending_cc_review` (Credit Coordinator Review)
4. Credit Coordinator approves → status: `approved` + generates amortization schedule
5. Credit Coordinator rejects → status: `rejected`

