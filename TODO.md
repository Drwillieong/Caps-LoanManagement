# Feature: Deferred Email Trigger & GM Member Validation

## Implementation Steps

- [x] **Step 1:** Create database migration — add `status`, `rejection_reason`, `temporary_password` to `users` table
- [x] **Step 2:** Update `User.php` model — add fillable fields, casts, helper methods
- [x] **Step 3:** Update `CreateMemberController.php` — defer email, store password, set `status=pending`
- [x] **Step 4:** Update `Create.tsx` — remove email defer logic, update success messaging
- [x] **Step 5:** Add GM member validation methods to `GmController.php` (approve/reject/pendingMembers)
- [x] **Step 6:** Register GM member validation routes in `web.php`
- [x] **Step 7:** Build `MemberValidate.tsx` — full GM member validation dashboard
- [x] **Step 8:** Update `SeeUsers.tsx` — show `status` badges (pending/active/rejected)
- [x] **Step 9:** Update `MembersProfile.tsx` — show status badge + rejection reason
- [x] **Step 10:** Create email template for HR rejection notification (`member-rejected.blade.php`)

## Summary of Changes

### Database
- New migration: `add_status_and_rejection_fields_to_users_table`
  - `status` ENUM('pending', 'active', 'rejected') DEFAULT 'pending'
  - `rejection_reason` TEXT nullable
  - `temporary_password` VARCHAR nullable

### Backend (Laravel)
- **User.php**: Added `status`, `rejection_reason`, `temporary_password` to fillable; added `isPending()`, `isActiveStatus()`, `isRejected()` helpers
- **CreateMemberController.php**: 
  - Member creation now sets `status='pending'`, `is_active=false`, stores `temporary_password` in DB
  - Email dispatch REMOVED from `store()` — deferred to GM approval
  - Success message updated to reflect pending validation
- **GmController.php**: Added 3 new methods:
  - `pendingMembers()` — lists pending members
  - `approveMember()` — sets active, sends `SendMembersPass` email, logs activity
  - `rejectMember()` — sets rejected, notifies HR via in-app + email notification

### Routes
- `GET /dashboards/Gm/MemberValidate` → `pendingMembers`
- `POST /dashboards/Gm/Member/{user}/approve` → `approveMember`
- `POST /dashboards/Gm/Member/{user}/reject` → `rejectMember`

### Frontend (React/TypeScript)
- **Create.tsx**: Removed `canSendEmail` / internet-check logic; updated UI messages
- **MemberValidate.tsx**: New GM dashboard with accept/reject flow + rejection dialog
- **SeeUsers.tsx**: Status badges now show Pending (yellow), Active (green), Rejected (red)
- **MembersProfile.tsx**: Shows status badge + rejection reason alert + pending validation alert

### Email
- New `member-rejected.blade.php` — HR notification template for member rejection

