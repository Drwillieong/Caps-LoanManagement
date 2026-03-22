<?php

namespace App\Traits;

use App\Services\LoanService;
use Illuminate\Http\Request;

trait HasNotificationCount
{
    protected function getMemberUnreadNotificationCount(Request $request): int
    {
        $user = $request->user();
        $notificationService = app(\App\Services\NotificationService::class);
        return $notificationService->getUnreadCount($user);
    }
}
