# Task: Clear Rejection Status/Reason upon Approval

## Steps

- [x] **Step 0**: Understand the code flow (completed)
  - Read `ProfileUpdateRequestController.php`, `CreateMemberController.php`, `MembersProfile.tsx`, `SeeUsers.tsx`
  - Identified that rejected requests persist with `rejection_reason` even after a new request is approved

- [x] **Step 1**: Edit `ProfileUpdateRequestController@approve()` 
  - After approving the current request, clear `rejection_reason` on all other rejected requests for the same member_id

- [x] **Step 2**: Edit `CreateMemberController@index()`
  - Add `->whereNotNull('rejection_reason')` as a safety net to prevent stale rejected requests from showing the badge

- [x] **Step 3**: Verify the edits are correct

