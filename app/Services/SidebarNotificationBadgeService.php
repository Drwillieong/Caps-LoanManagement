<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\LoanCoMaker;
use App\Models\NotificationLog;
use App\Models\ProfileUpdateRequest;
use App\Models\SidebarNotificationRead;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class SidebarNotificationBadgeService
{
    public const MEMBER_VALIDATION = 'member_validation';

    public const COMAKER_REQUESTS = 'comaker_requests';

    public const GM_LOAN_VALIDATION = 'gm_loan_validation';

    public const CREDIT_COMMITTEE = 'credit_committee';

    public const GM_APPROVED_LOAN_ACTION = 'gm_approved_loan_action';

    public const MEMBER_STATUS_CHANGED = 'member_status_changed';

    public const KEYS = [
        self::MEMBER_VALIDATION,
        self::COMAKER_REQUESTS,
        self::GM_LOAN_VALIDATION,
        self::CREDIT_COMMITTEE,
        self::GM_APPROVED_LOAN_ACTION,
        self::MEMBER_STATUS_CHANGED,
    ];

    public function countsFor(User $user): array
    {
        return match ($user->role) {
            'gm' => [
                'unreadMemberValidationCount' => $this->memberValidationCount($user),
                'pendingGmLoanValidationCount' => $this->pendingGmLoanValidationCount($user),
                'gmApprovedLoanActionCount' => $this->gmApprovedLoanActionCount($user),
            ],
            'member' => [
                'pendingComakerRequestsCount' => $this->pendingComakerRequestsCount($user),
                'hasMemberStatusChanged' => $this->memberStatusChangedCount($user),
            ],
            'creditcom' => [
                'pendingCreditCommitteeCount' => $this->pendingCreditCommitteeCount($user),
            ],
            default => [],
        };
    }

    public function markRead(User $user, string $badgeKey): void
    {
        if (! in_array($badgeKey, self::KEYS, true)) {
            abort(422, 'Unknown sidebar notification badge.');
        }

        SidebarNotificationRead::updateOrCreate(
            [
                'user_id' => $user->id,
                'badge_key' => $badgeKey,
            ],
            ['read_at' => now()]
        );

        if ($badgeKey === self::MEMBER_STATUS_CHANGED) {
            NotificationLog::forUser($user)
                ->where('type', 'loan_status')
                ->unread()
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);
        }
    }

    public function markCurrentRouteRead(User $user, string $path): void
    {
        $badgeKey = match (true) {
            $user->role === 'gm' && $path === 'dashboards/Gm/MemberValidate' => self::MEMBER_VALIDATION,
            $user->role === 'gm' && $path === 'dashboards/Gm/LoanApplication' => self::GM_LOAN_VALIDATION,
            $user->role === 'gm' && $path === 'dashboards/Gm/ApprovedLoan' => self::GM_APPROVED_LOAN_ACTION,
            $user->role === 'member' && $path === 'dashboards/Member/CoMaker' => self::COMAKER_REQUESTS,
            $user->role === 'member' && $path === 'dashboards/Member/PendingApplication' => self::MEMBER_STATUS_CHANGED,
            $user->role === 'creditcom' && $path === 'dashboards/CreditCom/LoanApplication' => self::CREDIT_COMMITTEE,
            default => null,
        };

        if ($badgeKey) {
            $this->markRead($user, $badgeKey);
        }
    }

    private function memberValidationCount(User $user): int
    {
        $lastReadAt = $this->lastReadAt($user, self::MEMBER_VALIDATION);

        $pendingMembers = User::query()
            ->where('role', 'member')
            ->where('status', 'pending')
            ->when($lastReadAt, fn (Builder $query) => $query->where('updated_at', '>', $lastReadAt))
            ->count();

        $pendingProfileEdits = ProfileUpdateRequest::query()
            ->where('status', 'pending')
            ->when($lastReadAt, fn (Builder $query) => $query->where('updated_at', '>', $lastReadAt))
            ->count();

        return $pendingMembers + $pendingProfileEdits;
    }

    private function pendingComakerRequestsCount(User $user): int
    {
        return LoanCoMaker::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->when($this->lastReadAt($user, self::COMAKER_REQUESTS), fn (Builder $query, Carbon $lastReadAt) => $query->where('updated_at', '>', $lastReadAt))
            ->count();
    }

    private function pendingGmLoanValidationCount(User $user): int
    {
        return Loan::query()
            ->where('status', 'pending_gm_review')
            ->when($this->lastReadAt($user, self::GM_LOAN_VALIDATION), fn (Builder $query, Carbon $lastReadAt) => $query->where('updated_at', '>', $lastReadAt))
            ->count();
    }

    private function pendingCreditCommitteeCount(User $user): int
    {
        return Loan::query()
            ->whereIn('status', ['pending_cc_review', 'endorsed_by_gm'])
            ->when($this->lastReadAt($user, self::CREDIT_COMMITTEE), fn (Builder $query, Carbon $lastReadAt) => $query->where('updated_at', '>', $lastReadAt))
            ->count();
    }

    private function gmApprovedLoanActionCount(User $user): int
    {
        $lastReadAt = $this->lastReadAt($user, self::GM_APPROVED_LOAN_ACTION);

        return Loan::query()
            ->where(function (Builder $query) use ($lastReadAt) {
                $query->where(function (Builder $approvedQuery) use ($lastReadAt) {
                    $approvedQuery->where('status', 'approved')
                        ->when($lastReadAt, fn (Builder $query) => $query->where('updated_at', '>', $lastReadAt));
                })->orWhereHas('amortizations', function (Builder $amortizationQuery) use ($lastReadAt) {
                    $amortizationQuery->whereIn('status', ['missed', 'partial'])
                        ->when($lastReadAt, fn (Builder $query) => $query->where('updated_at', '>', $lastReadAt));
                });
            })
            ->count();
    }

    private function memberStatusChangedCount(User $user): int
    {
        return NotificationLog::forUser($user)
            ->where('type', 'loan_status')
            ->unread()
            ->count();
    }

    private function lastReadAt(User $user, string $badgeKey): ?Carbon
    {
        $readAt = SidebarNotificationRead::query()
            ->where('user_id', $user->id)
            ->where('badge_key', $badgeKey)
            ->value('read_at');

        return $readAt ? Carbon::parse($readAt) : null;
    }
}
