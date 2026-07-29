<?php

namespace App\Http\Controllers;

use App\Services\SidebarNotificationBadgeService;
use Illuminate\Http\Request;

class SidebarNotificationBadgeController extends Controller
{
    public function markRead(Request $request, SidebarNotificationBadgeService $badgeService)
    {
        $validated = $request->validate([
            'badge_key' => ['required', 'string'],
        ]);

        $badgeService->markRead($request->user(), $validated['badge_key']);

        return back(303);
    }
}
