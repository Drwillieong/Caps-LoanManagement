<?php

namespace App\Http\Controllers\HrController;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendMembersPass;

class MemberExportController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');
        $filter = $request->get('filter', 'all');
        $role   = $request->get('role', 'all');
        $export = $request->get('export', false);

        $query = User::query()->with('memberProfile');

        // Search by ID, name, or email
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', $search)
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by new / old
        if ($filter === 'new') {
            $query->where('created_at', '>=', now()->subDays(30));
        } elseif ($filter === 'old') {
            $query->where('created_at', '<', now()->subDays(30));
        }

        // Filter by role
        if ($role !== 'all') {
            $query->where('role', $role);
        }

        // If export requested, get all records without pagination
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
                            'date_of_birth' => $user->memberProfile->date_of_birth,
                            'sex' => $user->memberProfile->sex,
                            'civil_status' => $user->memberProfile->civil_status,
                            'spouse_name' => $user->memberProfile->spouse_name,
                            'mobile_number' => $user->memberProfile->mobile_number,
                            'present_address' => $user->memberProfile->present_address,
                            'permanent_address' => $user->memberProfile->permanent_address,
                            'position' => $user->memberProfile->position,
                            'date_hired' => $user->memberProfile->date_hired,
                            'basic_salary' => $user->memberProfile->basic_salary,
                            'share_capital_balance' => $user->memberProfile->share_capital_balance,
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

        return Inertia::render('dashboards/HR/SeeUsers', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'filter' => $filter,
                'role'   => $role,
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
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:member,gm,creditcom,hr',
            
            // Employee ID
            'employee_id' => 'required|string|max:255|unique:member_profiles,employee_id',
            
            // Employment fields
            'position' => 'required|string|max:255',
            'date_hired' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'share_capital_balance' => 'nullable|numeric|min:0',
            'bank_account_number' => 'nullable|string|max:50',
            'tin_number' => 'nullable|string|max:50',
        ]);

        // Create the user first
        $user = User::create([
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make($request->password),
        ]);

        // Create the member profile with employment information
        $user->memberProfile()->create([
            'employee_id' => $request->employee_id,
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'position' => $request->position,
            'date_hired' => $request->date_hired,
            'basic_salary' => $request->basic_salary,
            'share_capital_balance' => $request->share_capital_balance ?? 0,
            'bank_account_number' => $request->bank_account_number,
            'tin_number' => $request->tin_number,
            'mobile_number' => '',
            'present_address' => '',
            'civil_status' => 'single',
            'sex' => 'male',
            'date_of_birth' => '1990-01-01',
        ]);

        // Send email with credentials
        Mail::to($request->email)->send(new SendMembersPass($request->email, $request->password));

        return redirect()->route('users')->with('success', 'User created successfully.');
    }
}

