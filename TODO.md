# TODO - Member Profile Completion Feature

## Plan Steps:

- [ ] 1. Create middleware `EnsureProfileCompleted.php`
- [ ] 2. Update HandleInertiaRequests middleware to share profile completion status
- [ ] 3. Update web.php to apply the new middleware to member routes
- [ ] 4. Modify MemberProfileController to redirect properly after profile save
- [ ] 5. Update UserProfile.tsx to force completion and prevent navigation away
