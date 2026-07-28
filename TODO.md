# Refactor: Rename `employee_id` to `member_id` & Auto-Generate Sequential IDs

## Step-by-Step Implementation Plan

### Phase 1: Create Migration
- [ ] 1. Create migration to rename `employee_id` to `member_id` across all tables

### Phase 2: Update Backend Models
- [ ] 2. Update `app/Models/MemberProfile.php`
- [ ] 3. Update `app/Models/Beneficiary.php`
- [ ] 4. Update `app/Models/PayrollUploadRow.php`
- [ ] 5. Update `app/Models/ProfileUpdateRequest.php`
- [ ] 6. Update `app/Models/User.php`

### Phase 3: Update Controllers
- [ ] 7. Update `app/Http/Controllers/HrController/CreateMemberController.php`
- [ ] 8. Update `app/Http/Controllers/Member/MemberProfileController.php`
- [ ] 9. Update `app/Http/Controllers/HrController/MemberProfileViewController.php`
- [ ] 10. Update `app/Http/Controllers/GmController/GmController.php`
- [ ] 11. Update `app/Http/Controllers/GmController/BulkMemberUploadController.php`
- [ ] 12. Update `app/Http/Controllers/GmController/ProfileUpdateRequestController.php`

### Phase 4: Update Routes
- [ ] 13. Update `routes/web.php`

### Phase 5: Update Frontend
- [ ] 14. Update `resources/js/pages/dashboards/HR/Create.tsx`
- [ ] 15. Update `resources/js/pages/dashboards/HR/MembersProfile.tsx`
- [ ] 16. Update `resources/js/pages/dashboards/Member/UserProfile.tsx`
- [ ] 17. Update `resources/js/pages/dashboards/Gm/MemberValidate.tsx`
- [ ] 18. Update `resources/js/pages/dashboards/HR/SeeUsers.tsx`

### Phase 6: Run Migration
- [ ] 19. Run `php artisan migrate`

---

## ✅ Bug Fix: Missing Temporary Password in Welcome Email
- [x] Fixed `app/Http/Controllers/GmController/GmController.php::approveMember()` — now generates a temporary password on-the-fly for self-registered users (where `temporary_password` is null) before sending the welcome email.

