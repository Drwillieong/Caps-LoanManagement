# TODO: Maker-Checker Profile Edit & GM Approval Workflow

## Backend Tasks
- [x] 1. Create migration `create_profile_update_requests_table`
- [x] 2. Create model `ProfileUpdateRequest.php`
- [x] 3. Create controller `ProfileUpdateRequestController.php`
- [x] 4. Update routes in `routes/web.php`

## Frontend Tasks
- [x] 5. Update TypeScript types in `types/index.d.ts`
- [x] 6. Modify `MembersProfile.tsx` — Submit to staging, add pending alert banner
- [x] 7. Modify `SeeUsers.tsx` — Add "Pending Edit Approval" badge
- [x] 8. Create `PendingEdits.tsx` — GM diff review page with approve/reject

## Testing
- [x] 9. Run `php artisan migrate` — ✅ 2026_08_01_000001_create_profile_update_requests_table migrated successfully
- [x] 10. Workflow implementation complete

