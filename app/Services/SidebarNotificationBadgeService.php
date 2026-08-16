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

    public const PROFILE_EDITS = 'profile_edits';

    public const COMAKER_REQUESTS = 'comaker_requests';

    public const GM_LOAN_VALIDATION = 'gm_loan_validation';

    public const CREDIT_COMMITTEE = 'credit_committee';

    public const GM_APPROVED_LOAN_ACTION = 'gm_approved_loan_action';

    public const MEMBER_STATUS_CHANGED = 'member_status_changed';

    public const UNREAD_NOTIFICATIONS = 'unread_notifications';

    public const KEYS = [
        self::MEMBER_VALIDATION,
        self::PROFILE_EDITS,
        self::COMAKER_REQUESTS,
        self::GM_LOAN_VALIDATION,
        self::CREDIT_COMMITTEE,
        self::GM_APPROVED_LOAN_ACTION,
        self::MEMBER_STATUS_CHANGED,
        self::UNREAD_NOTIFICATIONS,
    ];

    public function countsFor(User $user): array
    {
        return match ($user->role) {
            'gm' => [
                'pendingMemberSignupsCount' => $this->pendingMemberSignupsCount(),
                'pendingProfileEditsCount' => $this->pendingProfileEditsCount(),
                'pendingGmLoanValidationCount' => $this->pendingGmLoanValidationCount($user),
                'gmApprovedLoanActionCount' => $this->gmApprovedLoanActionCount($user),
            ],
            'hr', 'secretary' => [
                'pendingMemberSignupsCount' => $this->pendingMemberSignupsCount(),
                'pendingProfileEditsCount' => $this->pendingProfileEditsCount(),
                'unreadNotificationsCount' => $this->unreadNotificationsCount($user),
            ],
            'member' => [
                'pendingComakerRequestsCount' => $this->pendingComakerRequestsCount($user),
                'hasMemberStatusChanged' => $this->memberStatusChangedCount($user),
                'unreadNotificationsCount' => $this->unreadNotificationsCount($user),
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

        if ($badgeKey === self::UNREAD_NOTIFICATIONS) {
            NotificationLog::forUser($user)
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
            $user->role === 'gm' && $path === 'dashboards/Gm/PendingEdits' => self::PROFILE_EDITS,
            $user->role === 'gm' && $path === 'dashboards/Gm/LoanApplication' => self::GM_LOAN_VALIDATION,
            $user->role === 'gm' && $path === 'dashboards/Gm/ApprovedLoan' => self::GM_APPROVED_LOAN_ACTION,
            $user->role === 'member' && $path === 'dashboards/Member/CoMaker' => self::COMAKER_REQUESTS,
            $user->role === 'member' && $path === 'dashboards/Member/PendingApplication' => self::MEMBER_STATUS_CHANGED,
            $user->role === 'member' && $path === 'dashboards/Member/Notification' => self::UNREAD_NOTIFICATIONS,
            in_array($user->role, ['hr', 'secretary'], true) && $path === 'dashboards/HR/SeeUsers' => self::MEMBER_VALIDATION,
            in_array($user->role, ['hr', 'secretary'], true) && $path === 'dashboards/HR/SecActivityLog' => self::UNREAD_NOTIFICATIONS,
            $user->role === 'creditcom' && $path === 'dashboards/CreditCom/LoanApplication' => self::CREDIT_COMMITTEE,
            default => null,
        };

        if ($badgeKey) {
            $this->markRead($user, $badgeKey);
        }
    }

    private function pendingMemberSignupsCount(): int
    {
        return User::query()
            ->where('role', 'member')
            ->where('status', 'pending')
            ->count();
    }

    private function pendingProfileEditsCount(): int
    {
        return ProfileUpdateRequest::query()
            ->where('status', 'pending')
            ->count();
    }

    private function pendingComakerRequestsCount(User $user): int
    {
        return LoanCoMaker::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereHas('loan', fn (Builder $query) => $query->where('status', 'awaiting_comaker'))
            ->count();
    }

    private function pendingGmLoanValidationCount(User $user): int
    {
        return Loan::query()
            ->where('status', 'pending_gm_review')
            ->count();
    }

    private function pendingCreditCommitteeCount(User $user): int
    {
        return Loan::query()
            ->whereIn('status', ['pending_cc_review', 'endorsed_by_gm'])
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

    private function unreadNotificationsCount(User $user): int
    {
        return NotificationLog::forUser($user)
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
