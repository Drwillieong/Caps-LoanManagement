<?php

namespace App\Http\Controllers\HrController;

use App\Http\Controllers\Controller;
use App\Models\ProfileUpdateRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class CreateMemberController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');
        $filter = $request->get('filter', 'all');
        $role = $request->get('role', 'all');
        $export = $request->get('export', false);

        $query = User::query()->with('memberProfile');

        // 🔍 Search by ID, name, or email
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', $search)
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('memberProfile', function ($query) use ($search) {
                        $query->where('employee_id', 'like', "%{$search}%")
                            ->orWhere('payroll_id', 'like', "%{$search}%");
                    });
            });
        }

        // 🕒 Filter by new / old
        if ($filter === 'new') {
            $query->where('created_at', '>=', now()->subDays(30));
        } elseif ($filter === 'old') {
            $query->where('created_at', '<', now()->subDays(30));
        }

        // 🎭 Filter by role
        if ($role !== 'all') {
            $query->where('role', $role);
        }

        // If export requested, return JSON response
        if ($export) {
            $allUsers = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'users' => $allUsers->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'first_name' => $user->first_name,
                        'middle_name' => $user->middle_name,
                        'last_name' => $user->last_name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'is_active' => $user->is_active,
                        'created_at' => $user->created_at,
                        'member_profile' => $user->memberProfile ? [
                            'employee_id' => $user->memberProfile->employee_id,
                            'payroll_id' => $user->memberProfile->payroll_id,
                            'date_of_birth' => $user->memberProfile->date_of_birth,
                            'sex' => $user->memberProfile->sex,
                            'civil_status' => $user->memberProfile->civil_status,
                            'spouse_name' => $user->memberProfile->spouse_name,
                            'mobile_number' => $user->memberProfile->mobile_number,
                            'present_address' => $user->memberProfile->present_address,
                            'present_zip_code' => $user->memberProfile->present_zip_code,
                            'permanent_address' => $user->memberProfile->permanent_address,
                            'permanent_zip_code' => $user->memberProfile->permanent_zip_code,
                            'permanent_mobile_number' => $user->memberProfile->permanent_mobile_number,
                            'place_of_birth' => $user->memberProfile->place_of_birth,
                            'educational_attainment' => $user->memberProfile->educational_attainment,
                            'position' => $user->memberProfile->position,
                            'date_hired' => $user->memberProfile->date_hired,
                            'basic_salary' => $user->memberProfile->basic_salary,
                            'income_type' => $user->memberProfile->income_type,
                            'net_income' => $user->memberProfile->net_income,
                            'share_capital_balance' => $user->memberProfile->share_capital_balance,
                            'other_source_of_income' => $user->memberProfile->other_source_of_income,
                            'facebook_account_name' => $user->memberProfile->facebook_account_name,
                            'spouse_occupation' => $user->memberProfile->spouse_occupation,
                            'spouse_gross_income' => $user->memberProfile->spouse_gross_income,
                            'spouse_income_type' => $user->memberProfile->spouse_income_type,
                            'spouse_net_income' => $user->memberProfile->spouse_net_income,
                            'legal_beneficiary_1_name' => $user->memberProfile->legal_beneficiary_1_name,
                            'real_properties_owned' => $user->memberProfile->real_properties_owned,
                            'bank_account_number' => $user->memberProfile->bank_account_number,
                            'tin_number' => $user->memberProfile->tin_number,
                        ] : null,
                    ];
                }),
            ]);
        }

        $users = $query
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Attach pending update request status for each user
        $pendingRequestMemberIds = ProfileUpdateRequest::where('status', 'pending')
            ->pluck('member_id')
            ->toArray();

        $users->getCollection()->transform(function ($user) use ($pendingRequestMemberIds) {
            $memberProfile = $user->memberProfile;
            $user->has_pending_update_request = $memberProfile && in_array($memberProfile->employee_id, $pendingRequestMemberIds);
            return $user;
        });

        return Inertia::render('dashboards/HR/SeeUsers', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'filter' => $filter,
                'role' => $role,
            ],
            'roles' => [
                'member',
                'gm',
                'creditcom',
                'hr',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('dashboards/HR/Create', [
            'roles' => [
                'member',
                'gm',
                'creditcom',
                'hr',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'role' => 'required|in:member',

            // Employee ID
            'employee_id' => 'required|string|max:255|unique:member_profiles,employee_id',
            'payroll_id' => 'nullable|string|max:255|unique:member_profiles,payroll_id',

            // Personal fields
            'place_of_birth' => 'required|string|max:255',
            'date_of_birth' => 'required|date|before:today',
            'civil_status' => 'required|in:single,married,widowed',
            'sex' => 'required|in:male,female',
            'educational_attainment' => 'required|string|max:255',

            // Contact and address fields
            'permanent_address' => 'required|string|max:1000',
            'permanent_zip_code' => 'required|string|max:20',
            'permanent_mobile_number' => 'required|string|max:20',
            'present_address' => 'required|string|max:1000',
            'present_zip_code' => 'required|string|max:20',
            'mobile_number' => 'required|string|max:20',

            // Employment fields
            'position' => 'required|string|max:255',
            'date_hired' => 'required|date',
            'basic_salary' => 'required|numeric|min:10000',
            'income_type' => 'required|in:monthly,daily,yearly',
            'net_income' => 'required|numeric|min:0',
            'share_capital_balance' => 'required|numeric|min:10000',
            'other_source_of_income' => 'nullable|string|max:255',
            'facebook_account_name' => 'nullable|string|max:255',
            'spouse_occupation' => 'nullable|string|max:255',
            'spouse_gross_income' => 'nullable|numeric|min:0',
            'spouse_income_type' => 'required|in:monthly,daily,yearly',
            'spouse_net_income' => 'nullable|numeric|min:0',
            'legal_beneficiary_1_name' => 'nullable|string|max:255',
            'real_properties_owned' => 'nullable|string|max:2000',
        ], [
            'basic_salary.min' => 'Income (Gross) must be at least 10,000.',
            'share_capital_balance.min' => 'Share capital balance must be at least 10,000.',
        ]);

        $temporaryPassword = $this->generateTemporaryPassword();

        $user = DB::transaction(function () use ($validated, $temporaryPassword) {
            $user = User::create([
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'email' => strtolower($validated['email']),
                'role' => 'member',
                'password' => Hash::make($temporaryPassword),
                'status' => 'pending',
                'temporary_password' => $temporaryPassword,
                'is_active' => false,
            ]);

            $user->memberProfile()->create([
                'employee_id' => $validated['employee_id'],
                'payroll_id' => $validated['payroll_id'] ?? null,
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'place_of_birth' => $validated['place_of_birth'],
                'date_of_birth' => $validated['date_of_birth'],
                'civil_status' => $validated['civil_status'],
                'sex' => $validated['sex'],
                'educational_attainment' => $validated['educational_attainment'],
                'mobile_number' => $validated['mobile_number'],
                'permanent_mobile_number' => $validated['permanent_mobile_number'],
                'present_address' => $validated['present_address'],
                'present_zip_code' => $validated['present_zip_code'],
                'permanent_address' => $validated['permanent_address'],
                'permanent_zip_code' => $validated['permanent_zip_code'],
                'position' => $validated['position'],
                'date_hired' => $validated['date_hired'],
                'basic_salary' => $validated['basic_salary'],
                'income_type' => $validated['income_type'],
                'net_income' => $validated['net_income'],
                'share_capital_balance' => $validated['share_capital_balance'],
                'other_source_of_income' => $validated['other_source_of_income'] ?? null,
                'facebook_account_name' => $validated['facebook_account_name'] ?? null,
                'spouse_occupation' => $validated['spouse_occupation'] ?? null,
                'spouse_gross_income' => $validated['spouse_gross_income'] ?? null,
                'spouse_income_type' => $validated['spouse_income_type'],
                'spouse_net_income' => $validated['spouse_net_income'] ?? null,
                'legal_beneficiary_1_name' => $validated['legal_beneficiary_1_name'] ?? null,
                'real_properties_owned' => $validated['real_properties_owned'] ?? null,
            ]);

            return $user;
        });

        app(ActivityLogService::class)->logActivity(
            'user_created',
            null,
            'Created '.$user->role.' user '.$user->name.' (ID #'.$user->id.').'
        );

        // Email dispatch is deferred — will be sent when GM approves the member
        return redirect()->route('users')->with('success', 'Member created successfully. The application has been submitted for GM validation. The welcome email with credentials will be sent upon GM approval.');
    }

    private function generateTemporaryPassword(int $length = 14): string
    {
        $groups = [
            'ABCDEFGHJKLMNPQRSTUVWXYZ',
            'abcdefghijkmnopqrstuvwxyz',
            '23456789',
            '!@#$%^&*',
        ];

        $characters = implode('', $groups);
        $password = [];

        foreach ($groups as $group) {
            $password[] = $group[random_int(0, strlen($group) - 1)];
        }

        while (count($password) < $length) {
            $password[] = $characters[random_int(0, strlen($characters) - 1)];
        }

        for ($i = count($password) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$password[$i], $password[$j]] = [$password[$j], $password[$i]];
        }

        return implode('', $password);
    }

    public function updateStatus(Request $request, User $user)
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $previousStatus = $user->is_active ? 'active' : 'inactive';

        $user->update([
            'is_active' => $validated['is_active'],
        ]);

        $newStatus = $user->is_active ? 'active' : 'inactive';

        app(ActivityLogService::class)->logActivity(
            'user_status_updated',
            null,
            'Updated user status for '.$user->name.' (ID #'.$user->id.') from '.$previousStatus.' to '.$newStatus.'.'
        );

        return redirect()->route('users')->with('success', 'User status updated successfully.');
    }
}
