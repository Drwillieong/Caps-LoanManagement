<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\MemberProfile;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MemberProfileController extends Controller
{
    use \App\Traits\HasNotificationCount;

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
    public function editMember(Request $request, $userId)
    {
        $targetUser = User::with(['memberProfile', 'memberProfile.beneficiaries'])->findOrFail($userId);
        $memberProfile = $targetUser->memberProfile;

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
            'targetUserId' => $targetUser->id,
            'targetUserName' => $targetUser->first_name.' '.$targetUser->last_name,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount($request),
        ]);
    }

    /**
     * Store or update the user's profile.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Identity
            'employee_id' => 'required|string|max:255|unique:member_profiles,employee_id,'.($request->user()->memberProfile?->id ?? 'NULL'),
            'payroll_id' => 'nullable|string|max:255|unique:member_profiles,payroll_id,'.($request->user()->memberProfile?->id ?? 'NULL'),
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'sex' => 'required|in:male,female',
            'civil_status' => 'required|in:single,married,widowed,separated',
            'spouse_name' => 'nullable|string|max:255',

            // Contact & Address
            'mobile_number' => 'required|string|max:20',
            'present_address' => 'required|string',
            'permanent_address' => 'nullable|string',

            // Employment
            'position' => 'required|string|max:255',
            'date_hired' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',

            // Financials
            'share_capital_balance' => 'nullable|numeric|min:0',
            'bank_account_number' => 'nullable|string|max:50',
            'tin_number' => 'nullable|string|max:50',

            // Beneficiaries - now optional
            'beneficiaries' => 'nullable|array',
            'beneficiaries.*.full_name' => 'nullable|string|max:255',
            'beneficiaries.*.relationship' => 'nullable|string|max:255',
            'beneficiaries.*.date_of_birth' => 'nullable|date|before:today',
        ]);

        $user = $request->user();

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
    public function updateMember(Request $request, $userId)
    {
        $targetUser = User::with('memberProfile')->findOrFail($userId);

        // Check if current user is HR
        $adminRoles = ['hr', 'gm', 'creditcom'];
        $isAdmin = in_array($request->user()->role, $adminRoles);

        if (! $isAdmin) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            // Identity
            'employee_id' => 'required|string|max:255|unique:member_profiles,employee_id,'.($targetUser->memberProfile?->id ?? 'NULL').',id',
            'payroll_id' => 'nullable|string|max:255|unique:member_profiles,payroll_id,'.($targetUser->memberProfile?->id ?? 'NULL').',id',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'sex' => 'required|in:male,female',
            'civil_status' => 'required|in:single,married,widowed,separated',
            'spouse_name' => 'nullable|string|max:255',

            // Contact & Address
            'mobile_number' => 'required|string|max:20',
            'present_address' => 'required|string',
            'permanent_address' => 'nullable|string',

            // Employment
            'position' => 'required|string|max:255',
            'date_hired' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',

            // Financials
            'share_capital_balance' => 'nullable|numeric|min:0',
            'bank_account_number' => 'nullable|string|max:50',
            'tin_number' => 'nullable|string|max:50',

            // Beneficiaries - now optional
            'beneficiaries' => 'nullable|array',
            'beneficiaries.*.full_name' => 'nullable|string|max:255',
            'beneficiaries.*.relationship' => 'nullable|string|max:255',
            'beneficiaries.*.date_of_birth' => 'nullable|date|before:today',
        ]);

        if ($request->hasFile('profile_picture')) {
            $memberProfile = MemberProfile::firstOrNew(['user_id' => $targetUser->id]);
            if ($memberProfile->profile_picture) {
                Storage::disk('public')->delete('profiles/'.$memberProfile->profile_picture);
            }
            $filename = $targetUser->id.'_'.time().'.'.$request->file('profile_picture')->getClientOriginalExtension();
            $request->file('profile_picture')->storeAs('profiles', $filename, 'public');
            $validated['profile_picture'] = $filename;
        }

        // Update member profile
        $memberProfile = MemberProfile::updateOrCreate(
            ['user_id' => $targetUser->id],
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
