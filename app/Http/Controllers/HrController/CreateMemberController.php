<?php

namespace App\Http\Controllers\HrController;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use App\Http\Controllers\Controller;

class CreateMemberController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');
        $filter = $request->get('filter', 'all');
        $role   = $request->get('role', 'all');

        $query = User::query();

        // 🔍 Search by ID, name, or email
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', $search)
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
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
                'secretary',
                'hr',
                'chairman',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('dashboards/HR/Create', [
            'roles' => [
                'member',
                'gm',
                'secretary',
                'hr',
                'chairman',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:member,gm,secretary,hr,chairman',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make($request->password),
        ]);

        return redirect()->route('users')->with('success', 'User created successfully.');

       
    }
}
