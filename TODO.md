# Bug Fix: Blank Screen on `/dashboards/HR/create`

## Status: ✅ COMPLETED

## Summary
1. ✅ **Diagnosed root cause** — `Create.tsx` was a copy-paste of `MembersProfile.tsx` expecting `user`, `memberProfile`, `beneficiaries` props that the controller (`CreateMemberController@create`) doesn't pass. The component crashed immediately at `user.status === 'rejected'` since `user` was `undefined`.
2. ✅ **Rewrote `Create.tsx`** as a proper new-member creation form that:
   - Only expects `roles: string[]` from props (matches controller)
   - Has all fields matching the `store()` validation rules
   - Uses proper `POST` action to `/dashboards/HR/SeeUsers`
   - No dependency on `user`, `memberProfile`, `beneficiaries` from props
   - Includes: Identity, Contact & Address, Employment, Spouse/Assets, and Beneficiaries sections
3. ✅ **No backend changes needed** — controller was already correct

