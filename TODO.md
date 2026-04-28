<<<<<<< HEAD
# Collapsible Application Section in Member Sidebar
=======
# ValidateLoan.tsx Enhancement TODO

## Steps
1. [x] Analyze existing files (ValidateLoan.tsx, ApplyLoan.tsx, GmController, types)
2. [x] Create plan for eligibility analysis card and UI improvements
3. [x] Edit ValidateLoan.tsx — add Eligibility Analysis card with progress bars
4. [x] Edit ValidateLoan.tsx — add additional improvements (risk badge, DTI, tenure, days pending, collapsible past loans, quick-reject remarks)
5. [ ] Verify build with `npm run build`
>>>>>>> origin/dev

## Steps:
1. [x] Create/update NavItem type to support nesting (inline or types file)
2. [x] Update `resources/js/components/nav-main.tsx` to render nested items with Collapsible (fixed TS errors)
3. [x] Update `resources/js/components/app-sidebar.tsx` memberNavItems to nested structure with Application group
4. [x] Test collapsible functionality, active states, links (verified via code review: Collapsible uses Radix, active logic covers groups/children, paths match existing pages)
5. [x] Complete task
