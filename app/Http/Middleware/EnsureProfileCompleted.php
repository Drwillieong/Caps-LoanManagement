<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileCompleted
{
    /**
     * Handle an incoming request.
     * Redirects members to complete their profile if not done yet.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Only apply to authenticated users with member role
        if ($user && $user->role === 'member') {
            // Load the memberProfile relationship to ensure it's available
            $user->load('memberProfile');

            // Check if profile is not completed
            if (! $user->hasCompletedProfile()) {
                // Allow access only to profile page and profile store
                $allowedRoutes = [
                    'member.user-profile',
                    'member.user-profile.store',
                    'logout',
                ];

                $currentRoute = $request->route()->getName();

                // If not on an allowed route, redirect to profile
                if (! in_array($currentRoute, $allowedRoutes)) {
                    return redirect()->route('member.user-profile')
                        ->with('warning', 'Please complete your profile before accessing other pages.');
                }
            }
        }

        return $next($request);
    }
}
