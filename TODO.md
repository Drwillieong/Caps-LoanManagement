## Task: Prevent loan application if member has pending loan after GM creation

**Status: In Progress** ✅

### Steps to Complete:
1. [x] Create TODO.md with plan breakdown
2. [✅] Edit `app/Http/Controllers/Member/LoanController.php` - Backend checks expanded to all pending statuses
3. [✅] Edit `resources/js/pages/dashboards/Member/ApplyLoan.tsx` - Frontend updated to use hasPendingLoan
4. [ ] Test GM loan creation → ApplyLoan block → Status change → Unblock
5. [ ] Run `php artisan route:clear && npm run build`
6. [ ] ✅ attempt_completion

**Pending Statuses to Block**: ['awaiting_comaker', 'pending_gm_review', 'pending_cc_review']

**Next Step**: Backend edit (LoanController.php)
