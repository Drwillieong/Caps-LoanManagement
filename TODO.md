# TODO: Add Monthly Payment Eligibility Check

## Task: Add eligibility check - monthly payment must not exceed 50% of basic salary

### Steps:
- [x] 1. Analyze the codebase and understand the current implementation
- [ ] 2. Update ApplyLoan.tsx (Frontend): Add eligibility check for monthly > 50% basic salary
- [ ] 3. Update LoanElegibilityService.php (Backend): Add validation for monthly <= 50% basic salary

### Details:
1. Frontend (ApplyLoan.tsx):
   - Add new eligibility check: if `computed.monthly > (basic_salary / 2)`, show error message
   - Update UI to display this eligibility condition
   - Disable submit button when monthly exceeds 50% of basic salary

2. Backend (LoanElegibilityService.php):
   - Add validation to ensure monthly payment <= 50% of basic salary
   - Use LoanComputationService to calculate monthly payment
