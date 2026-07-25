# Fix Plan - Navigation & Form Submission Errors

## Tasks

### 1. Fix UserProfile.tsx - Form action and breadcrumbs
- [x] Change form action from `member.userProfile.store.url()` to relative URL `/dashboards/Member/UserProfile`
- [x] Change breadcrumb href from `member.userProfile.url()` to relative URL
- [x] Remove unused import of `member` from `@/routes/member`

### 2. Fix MemberProfileViewController.php - Better error handling
- [x] Add try-catch or existence check for `findOrFail`
- [x] Return proper Inertia redirect with error message instead of 404

### 3. Test the fixes
- [x] Clear route/optimization cache
- [ ] Verify navigation from SeeUsers to MembersProfile
- [ ] Verify form submission on UserProfile

