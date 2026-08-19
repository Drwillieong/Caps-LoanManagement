<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\MemberProfile;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MemberProfileController extends Controller
{
    use \App\Traits\HasNotificationCount;

    private function profileRules(?string $membersId = null, ?int $userId = null): array
    {
        return [
            'members_id' => ['required', 'string', 'max:255', Rule::unique('member_profiles', 'members_id')->ignore($membersId, 'members_id')],
            'payroll_id' => ['nullable', 'string', 'max:255', Rule::unique('member_profiles', 'payroll_id')->ignore($membersId, 'members_id')],
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'place_of_birth' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'sex' => 'required|in:male,female',
            'civil_status' => 'required|in:single,married,widowed,separated',
            'educational_attainment' => 'required|string|max:255',
            'spouse_name' => 'nullable|string|max:255',
            'mobile_number' => 'required|string|max:20',
            'permanent_mobile_number' => 'required|string|max:20',
            'present_address' => 'required|string|max:2000',
            'present_zip_code' => 'required|string|max:20',
            'permanent_address' => 'required|string|max:2000',
            'permanent_zip_code' => 'required|string|max:20',
            'position' => 'required|string|max:255',
            'basic_salary' => 'required|numeric|min:10000',
            'income_type' => 'required|in:monthly,daily,yearly',
            'net_income' => 'required|numeric|min:10000',
            'share_capital_balance' => 'required|numeric|min:10000',
            'other_source_of_income' => 'nullable|string|max:255',
            'facebook_account_name' => 'required|string|max:255',
            'spouse_occupation' => 'nullable|string|max:255',
            'spouse_gross_income' => 'required_with:spouse_occupation|nullable|numeric|min:0',
            'spouse_income_type' => 'required_with:spouse_occupation|nullable|in:monthly,daily,yearly',
            'spouse_net_income' => 'required_with:spouse_occupation|nullable|numeric|min:0',
            'real_properties_owned' => 'nullable|string|max:2000',
            'bank_account_number' => 'nullable|string|max:50',
            'tin_number' => 'nullable|string|max:50',
            'beneficiaries' => 'nullable|array',
            'beneficiaries.*.full_name' => 'nullable|string|max:255',
            'beneficiaries.*.relationship' => 'nullable|string|max:255',
            'beneficiaries.*.date_of_birth' => 'nullable|date|before:today',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
        ];
    }

    /**
     * Display the user's profile form.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $memberProfile = $user->memberProfile;

        // Check if user is an admin (hr, gm, creditcom roles)
        $adminRoles = ['hr', 'gm', 'creditcom'];
        $isAdmin = in_array($user->role, $adminRoles);

        return Inertia::render('dashboards/Member/UserProfile', [
            'memberProfile' => $memberProfile,
            'beneficiaries' => $memberProfile?->beneficiaries ?? [],
            'isNewUser' => ! $user->hasCompletedProfile(),
            'isAdmin' => $isAdmin,
            'profileCompleted' => $user->hasCompletedProfile(),
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount($request),
        ]);
    }

    /**
     * Display a specific member's profile form (for HR).
     */
    public function editMember(Request $request, $membersId)
    {
        $memberProfile = MemberProfile::with(['user', 'beneficiaries'])->findOrFail($membersId);
        $targetUser = $memberProfile->user;

        // Check if current user is HR
        $adminRoles = ['hr', 'gm', 'creditcom'];
        $isAdmin = in_array($request->user()->role, $adminRoles);

        if (! $isAdmin) {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('dashboards/Member/UserProfile', [
            'memberProfile' => $memberProfile,
            'beneficiaries' => $memberProfile?->beneficiaries ?? [],
            'isNewUser' => false,
            'isAdmin' => true,
            'profileCompleted' => $targetUser->hasCompletedProfile(),
            'targetMembersId' => $memberProfile->members_id,
            'targetUserName' => $targetUser->first_name.' '.$targetUser->last_name,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount($request),
        ]);
    }

    /**
     * Employment & Financial Assessment fields that members are not allowed to
     * modify once their profile exists. Only HR (admins) may change these, and
     * members may still set them on initial profile creation.
     */
    private const LOCKED_EMPLOYMENT_FIELDS = [
        'position',
        'basic_salary',
        'income_type',
        'net_income',
        'share_capital_balance',
        'other_source_of_income',
    ];

    /**
     * Store or update the user's profile.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate($this->profileRules($user->memberProfile?->members_id, $user->id));

        // Members may not modify Employment & Financial Assessment fields on an
        // existing profile. Strip them so a direct POST cannot change them; they
        // are still allowed during the initial profile creation.
        $adminRoles = ['hr', 'gm', 'creditcom'];
        if (! in_array($user->role, $adminRoles, true)) {
            $existingProfile = MemberProfile::where('user_id', $user->id)->first();
            if ($existingProfile) {
                foreach (self::LOCKED_EMPLOYMENT_FIELDS as $lockedField) {
                    unset($validated[$lockedField]);
                }
            }
        }

        if (! empty($validated['email']) && $validated['email'] !== $user->email) {
            $user->email = $validated['email'];
            $user->save();
        }

        if ($request->hasFile('profile_picture')) {
            $memberProfile = MemberProfile::firstOrNew(['user_id' => $user->id]);
            if ($memberProfile->profile_picture) {
                Storage::disk('public')->delete('profiles/'.$memberProfile->profile_picture);
            }
            $filename = $user->id.'_'.time().'.'.$request->file('profile_picture')->getClientOriginalExtension();
            $request->file('profile_picture')->storeAs('profiles', $filename, 'public');
            $validated['profile_picture'] = $filename;
        }

        // Beneficiaries are synced separately; keep them out of updateOrCreate.
        $beneficiaries = $validated['beneficiaries'] ?? null;
        unset($validated['beneficiaries']);

        // Create or update member profile
        $memberProfile = MemberProfile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        $this->syncBeneficiaries($memberProfile, $beneficiaries);

        return Redirect::route('dashboard')->with('success', 'Profile updated successfully!');
    }

    /**
     * Validate and (re)create beneficiary records.
     *
     * The beneficiaries.relationship column is NOT NULL. Any item that is missing
     * a full_name is skipped, and relationship/date_of_birth are coerced to safe
     * non-null values so a profile-picture-only update can never trigger a
     * "NOT NULL constraint failed" SQL error.
     */
    private function syncBeneficiaries(MemberProfile $memberProfile, ?array $beneficiaries): void
    {
        // Always replace the whole set so deletes/re-inserts stay consistent.
        $memberProfile->beneficiaries()->delete();

        if (! is_array($beneficiaries)) {
            return;
        }

        foreach ($beneficiaries as $beneficiary) {
            if (! is_array($beneficiary)) {
                continue;
            }

            $fullName = trim((string) ($beneficiary['full_name'] ?? ''));
            // A beneficiary must have at least a full name to be stored.
            if ($fullName === '') {
                continue;
            }

            $memberProfile->beneficiaries()->create([
                'full_name' => $fullName,
                // relationship is NOT NULL — guarantee a non-null string.
                'relationship' => trim((string) ($beneficiary['relationship'] ?? '')),
                'date_of_birth' => ! empty($beneficiary['date_of_birth'])
                    ? $beneficiary['date_of_birth']
                    : null,
            ]);
        }
    }

    /**
     * Update a specific member's profile (for HR).
     */
    public function updateMember(Request $request, $membersId)
    {
        $memberProfile = MemberProfile::with('user')->findOrFail($membersId);
        $targetUser = $memberProfile->user;

        // Check if current user is HR
        $adminRoles = ['hr', 'gm', 'creditcom'];
        $isAdmin = in_array($request->user()->role, $adminRoles);

        if (! $isAdmin) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate($this->profileRules($membersId, $targetUser->id));

        if (! empty($validated['email']) && $validated['email'] !== $targetUser->email) {
            $targetUser->email = $validated['email'];
            $targetUser->save();
        }

        if ($request->hasFile('profile_picture')) {
            $memberProfile = MemberProfile::firstOrNew(['members_id' => $membersId]);
            if ($memberProfile->profile_picture) {
                Storage::disk('public')->delete('profiles/'.$memberProfile->profile_picture);
            }
            $filename = $membersId.'_'.time().'.'.$request->file('profile_picture')->getClientOriginalExtension();
            $request->file('profile_picture')->storeAs('profiles', $filename, 'public');
            $validated['profile_picture'] = $filename;
        }

        // Beneficiaries are synced separately; keep them out of updateOrCreate.
        $beneficiaries = $validated['beneficiaries'] ?? null;
        unset($validated['beneficiaries']);

        // Update member profile
        $memberProfile = MemberProfile::updateOrCreate(
            ['members_id' => $membersId],
            $validated
        );

        $this->syncBeneficiaries($memberProfile, $beneficiaries);

        if (in_array($request->user()->role, ['gm', 'hr'], true)) {
            app(ActivityLogService::class)->logActivity(
                'member_profile_updated',
                null,
                'Updated member profile for '.$targetUser->name.' (ID #'.$targetUser->id.').'
            );
        }

        return Redirect::route('users')->with('success', 'Member profile updated successfully!');
    }

    /**
     * Update the user's profile.
     */
    public function update(Request $request)
    {
        return $this->store($request);
    }
}
