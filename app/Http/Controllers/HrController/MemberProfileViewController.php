<?php

namespace App\Http\Controllers\HrController;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MemberProfileViewController extends Controller
{
    public function show($userId)
    {
        $user = User::with(['memberProfile', 'memberProfile.beneficiaries'])
            ->findOrFail($userId);

        return Inertia::render('dashboards/HR/MembersProfile', [
            'user' => $user,
            'memberProfile' => $user->memberProfile,
            'beneficiaries' => $user->memberProfile ? $user->memberProfile->beneficiaries : [],
        ]);
    }
}
