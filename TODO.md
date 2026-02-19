# TODO - UserProfile Mandatory Profile Completion

## Backend - Database:
- [ ] Create migration for member_profiles table
- [ ] Create migration for beneficiaries table

## Backend - Models:
- [ ] Create MemberProfile model with relationships
- [ ] Create Beneficiary model with relationships
- [ ] Update User model with memberProfile relationship and hasCompletedProfile helper

## Backend - Controller:
- [ ] Create MemberProfileController with store, update methods

## Backend - Middleware/Routing:
- [ ] Update routes/web.php with MemberProfileController routes
- [ ] Add profile completion check in dashboard route

## Frontend - UserProfile Page:
- [ ] Update UserProfile.tsx with comprehensive form
- [ ] Add identity section (employee_id, names, dob, sex, civil_status)
- [ ] Add contact & address section
- [ ] Add employment data section (position, date_hired, basic_salary)
- [ ] Add financials section
- [ ] Add beneficiaries section with add/remove functionality
- [ ] Add validation and error handling
- [ ] Add mandatory field indicators

## Testing:
- [ ] Test new user redirect to profile page
- [ ] Test form validation
- [ ] Test profile completion flow
