<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use App\Models\MemberProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class MemberProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $memberProfile = $user->memberProfile;
        
        // Check if user is an admin (hr, gm, chairman, secretary roles)
        $adminRoles = ['hr', 'gm', 'chairman', 'secretary'];
        $isAdmin = in_array($user->role, $adminRoles);
        
        return Inertia::render('dashboards/Member/UserProfile', [
            'memberProfile' => $memberProfile,
            'beneficiaries' => $memberProfile?->beneficiaries ?? [],
            'isNewUser' => !$user->hasCompletedProfile(),
            'isAdmin' => $isAdmin,
        ]);
    }

    /**
     * Store or update the user's profile.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Identity
            'employee_id' => 'required|string|max:255|unique:member_profiles,employee_id,' . ($request->user()->memberProfile?->id ?? 'NULL'),
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
            
            // Beneficiaries
            'beneficiaries' => 'nullable|array',
            'beneficiaries.*.full_name' => 'required|string|max:255',
            'beneficiaries.*.relationship' => 'required|string|max:255',
            'beneficiaries.*.date_of_birth' => 'nullable|date|before:today',
        ]);

        $user = $request->user();

        // Create or update member profile
        $memberProfile = MemberProfile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        // Handle beneficiaries
        if (isset($validated['beneficiaries'])) {
            // Delete existing beneficiaries
            $memberProfile->beneficiaries()->delete();
            
            // Create new beneficiaries
            foreach ($validated['beneficiaries'] as $beneficiaryData) {
                $memberProfile->beneficiaries()->create($beneficiaryData);
            }
        }

        return Redirect::route('dashboard')->with('success', 'Profile updated successfully!');
    }

    /**
     * Update the user's profile.
     */
    public function update(Request $request)
    {
        return $this->store($request);
    }
}