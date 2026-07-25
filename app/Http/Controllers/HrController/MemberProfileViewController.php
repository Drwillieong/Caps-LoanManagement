<?php

namespace App\Http\Controllers\HrController;

use App\Http\Controllers\Controller;
use App\Models\MemberProfile;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class MemberProfileViewController extends Controller
{
    public function show($employeeId)
    {
        try {
            $memberProfile = MemberProfile::with(['user', 'beneficiaries'])
                ->findOrFail($employeeId);
        } catch (ModelNotFoundException $e) {
            return Redirect::route('users')
                ->with('error', 'Member profile not found for Employee ID: '.$employeeId);
        }

        $user = $memberProfile->user;

        if (! $user) {
            return Redirect::route('users')
                ->with('error', 'User account not found for this profile.');
        }

        return Inertia::render('dashboards/HR/MembersProfile', [
            'user' => $user,
            'memberProfile' => $memberProfile,
            'beneficiaries' => $memberProfile ? $memberProfile->beneficiaries : [],
            'isAdmin' => true,
            'isNewUser' => false,
            'profileCompleted' => $user->hasCompletedProfile(),
            'targetEmployeeId' => $memberProfile->employee_id,
            'targetUserName' => $user->first_name.' '.$user->last_name,
        ]);
    }
}
