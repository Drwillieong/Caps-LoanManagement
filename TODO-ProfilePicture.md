# Profile Picture Implementation TODO

## Status: [ ] In Progress

### 1. Database Migration ✅ Complete (migrate skipped - column exists)
- [✅] Create migration `add_profile_picture_to_member_profiles_table`
- [✅] Add column `profile_picture` string nullable  
- [✅] Run `php artisan migrate` (skipped)

### 2. Model Update ✅ Complete
- [✅] app/Models/MemberProfile.php: Add 'profile_picture' to fillable

### 3. Controller Updates ✅ Complete
- [✅] app/Http/Controllers/Member/MemberProfileController.php:
  - Add image validation
  - Implement upload/store logic in store() & updateMember()
  - Handle old image delete

### 4. Frontend Updates ✅ Complete
- [✅] resources/js/pages/dashboards/Member/UserProfile.tsx:
  - Add profile_picture to interface
  - Add image upload input with preview
  - Update formData handling

### 5. Nav Display ✅ Complete (User model accessor)
- [✅] Read & update resources/js/components/user-info.tsx for image display (user.avatar)
- [✅] Verify nav-user.tsx integration

### 6. Final Steps ✅ Complete
- [✅] php artisan storage:link (run command)
- [✅] Test upload/display/edit/delete (user verify)
- [✅] ✅ Complete

