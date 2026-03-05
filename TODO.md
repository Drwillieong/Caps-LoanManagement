# TODO - Co-Maker Availability Feature Update

## Objective
A member can only be a Co-maker if they're not currently bound to another loan. Once the loan is finished (rejected or paid_off), they can be selected as co-maker again.

## Tasks

### 1. Update chooseComaker() method in LoanController.php
- [x] Modify the query to check for all non-final loan statuses
- [x] Statuses to check as "bound": awaiting_comaker, pending_gm_review, pending_cc_review, approved, released
- [x] Statuses that make available again: rejected, paid_off

### 2. Update create() method in LoanController.php
- [x] Update eligibleCoMakers query to use same logic as chooseComaker()

### 3. Update edit() method in LoanController.php  
- [x] Update eligibleCoMakers query to use same logic as chooseComaker()

### 4. Update store() validation method in LoanController.php
- [x] Update co-maker validation to use same logic

### 5. Test the implementation
- [ ] Verify ChooseComaker page shows correct availability status
- [ ] Verify ApplyLoan page shows correct eligible co-makers
- [ ] Verify co-maker becomes available again after loan is rejected/paid_off

