<?php

namespace App\Http\Middleware;

use App\Services\Payroll\SystemSettingService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (! auth()->check()) {
            abort(403);
        }

        if (! in_array(auth()->user()->role, $roles)) {
            abort(403, 'Unauthorized.');
        }

        if (auth()->user()->role === 'member' && in_array('member', $roles)) {
            $processingState = app(SystemSettingService::class)->payrollProcessingState();

            if ($processingState['active']) {
                return Inertia::render('dashboards/Member/PayrollMaintenance', [
                    'processing' => $processingState,
                ])->toResponse($request);
            }
        }

        return $next($request);
    }
}
