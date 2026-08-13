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

    private function profileRules(?string $employeeId = null, ?int $userId = null): array
    {
        return [
            'employee_id' => ['required', 'string', 'max:255', Rule::unique('member_profiles', 'employee_id')->ignore($employeeId, 'employee_id')],
            'payroll_id' => ['nullable', 'string', 'max:255', Rule::unique('member_profiles', 'payroll_id')->ignore($employeeId, 'employee_id')],
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
    public function editMember(Request $request, $employeeId)
    {
        $memberProfile = MemberProfile::with(['user', 'beneficiaries'])->findOrFail($employeeId);
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
            'targetEmployeeId' => $memberProfile->employee_id,
            'targetUserName' => $targetUser->first_name.' '.$targetUser->last_name,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount($request),
        ]);
    }

    /**
     * Store or update the user's profile.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate($this->profileRules($user->memberProfile?->employee_id, $user->id));

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

        // Create or update member profile
        $memberProfile = MemberProfile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        // Handle beneficiaries - only save if they have at least a full_name
        if (isset($validated['beneficiaries']) && is_array($validated['beneficiaries'])) {
            // Delete existing beneficiaries
            $memberProfile->beneficiaries()->delete();

            // Filter out empty beneficiaries (no full_name)
            $validBeneficiaries = array_filter($validated['beneficiaries'], function ($beneficiary) {
                return ! empty($beneficiary['full_name']);
            });

            // Create only valid beneficiaries
            foreach ($validBeneficiaries as $beneficiaryData) {
                $memberProfile->beneficiaries()->create($beneficiaryData);
            }
        }

        return Redirect::route('dashboard')->with('success', 'Profile updated successfully!');
    }

    /**
     * Update a specific member's profile (for HR).
     */
    public function updateMember(Request $request, $employeeId)
    {
        $memberProfile = MemberProfile::with('user')->findOrFail($employeeId);
        $targetUser = $memberProfile->user;

        // Check if current user is HR
        $adminRoles = ['hr', 'gm', 'creditcom'];
        $isAdmin = in_array($request->user()->role, $adminRoles);

        if (! $isAdmin) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate($this->profileRules($employeeId, $targetUser->id));

        if (! empty($validated['email']) && $validated['email'] !== $targetUser->email) {
            $targetUser->email = $validated['email'];
            $targetUser->save();
        }

        if ($request->hasFile('profile_picture')) {
            $memberProfile = MemberProfile::firstOrNew(['employee_id' => $employeeId]);
            if ($memberProfile->profile_picture) {
                Storage::disk('public')->delete('profiles/'.$memberProfile->profile_picture);
            }
            $filename = $employeeId.'_'.time().'.'.$request->file('profile_picture')->getClientOriginalExtension();
            $request->file('profile_picture')->storeAs('profiles', $filename, 'public');
            $validated['profile_picture'] = $filename;
        }

        // Update member profile
        $memberProfile = MemberProfile::updateOrCreate(
            ['employee_id' => $employeeId],
            $validated
        );

        // Handle beneficiaries - only save if they have at least a full_name
        if (isset($validated['beneficiaries']) && is_array($validated['beneficiaries'])) {
            // Delete existing beneficiaries
            $memberProfile->beneficiaries()->delete();

            // Filter out empty beneficiaries (no full_name)
            $validBeneficiaries = array_filter($validated['beneficiaries'], function ($beneficiary) {
                return ! empty($beneficiary['full_name']);
            });

            // Create only valid beneficiaries
            foreach ($validBeneficiaries as $beneficiaryData) {
                $memberProfile->beneficiaries()->create($beneficiaryData);
            }
        }

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
