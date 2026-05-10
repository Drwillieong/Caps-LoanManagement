# TODO - Payroll deduction refactor (deferred + idempotency)

## Plan items
- [ ] 1) Implement DEFERRED deduction status classification
  - Update `LoanPaymentPostingService::applyMemberPayrollDeduction()` and/or `markMissed()` so that:
    - amount == 0 or blank deduction becomes `missed` by default
    - support an Excel marker (e.g., `remarks` contains `deferred`/`insufficient` or optional columns) to set `deduction_status='deferred'`
    - add `transaction_type` / `LoanTransaction` creation for deferred
- [ ] 2) Add idempotency to prevent double-processing across uploads
  - Add DB-level unique constraint (or optimistic check) for `deduction_records` and/or `loan_transactions` based on (`loan_amortization_id`, `cutoff_date`, `payroll_upload_id`) and/or (`loan_amortization_id`, `cutoff_date`) when payroll_upload_id is null.
  - Update `PayrollDeductionService::processRows()` to skip already-processed rows by querying existing `deduction_records`.
- [ ] 3) Update counters in `PayrollDeductionService::dashboardData()`
  - Ensure deferred counts are shown/updated.
- [ ] 4) Update GM dashboard UI to show deferred metrics/badges if needed
- [ ] 5) Add basic tests (optional)
  - At least unit/integration tests for idempotency and deferred status.


