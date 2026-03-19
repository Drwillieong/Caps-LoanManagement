<?php

namespace App\Traits;

use App\Services\LoanService;
use Illuminate\Http\Request;

trait HasNotificationCount
{
    protected function getMemberUnreadNotificationCount(Request $request): int
    {
        $user = $request->user();
        $loanService = app(LoanService::class);
        return $loanService->getUnreadNotificationsCount($user);
    }
}
