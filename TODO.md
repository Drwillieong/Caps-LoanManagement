# TODO: Update Amortization Schedule to Bi-Monthly (10th and 25th)

## Task
Modify the amortization schedule generation to create two payments per month (10th and 25th) instead of one payment per month.

## Steps Completed:
- [x] 1. Update GmController::generateAmortizationSchedule() method
- [x] 2. Update CreditComController::generateAmortizationSchedule() method

## Changes Summary:
- Each loan term month will have 2 installments (10th and 25th)
- Payment amount per installment = monthly_amortization / 2
- Total number of installments = terms_months * 2

