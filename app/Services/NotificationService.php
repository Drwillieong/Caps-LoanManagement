<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\NotificationLog;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationService
{
    public function createNotification(
        User $user,
        string $title,
        string $message,
        string $type = 'general',
        ?int $relatedId = null,
        ?string $relatedType = null
    ): NotificationLog {
        return NotificationLog::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'related_id' => $relatedId,
            'related_type' => $relatedType,
            'is_read' => false,
        ]);
    }

    public function getNotificationsForUser(User $user, int $limit = 50): LengthAwarePaginator
    {
        $notifications = NotificationLog::forUser($user)
            ->recent()
            ->get()
            ->map(fn ($notif) => [
                'id' => $notif->id,
                'loan_type' => $this->getLoanTypeFromNotification($notif),
                'date' => $notif->created_at->format('Y-m-d H:i:s'),
                'from' => $this->getNotificationFrom($notif),
                'description' => $notif->title,
                'comment' => $notif->message,
                'status' => $notif->type,
                'is_read' => $notif->is_read,
                'target_url' => $this->getTargetUrl($notif),
            ]);

        return new LengthAwarePaginator($notifications, $notifications->count(), $limit);
    }

    public function getDashboardNotifications(User $user, int $limit = 10): array
    {
        return NotificationLog::forUser($user)
            ->recent()
            ->limit($limit)
            ->get()
            ->map(fn ($notif) => [
                'id' => $notif->id,
                'loan_type' => $this->getLoanTypeFromNotification($notif),
                'date' => $notif->created_at->format('Y-m-d H:i:s'),
                'from' => $this->getNotificationFrom($notif),
                'description' => $notif->title,
                'comment' => $notif->message,
                'status' => $notif->type,
                'is_read' => $notif->is_read,
                'target_url' => $this->getTargetUrl($notif),
            ])
            ->toArray();
    }

    public function getUnreadCount(User $user): int
    {
        return NotificationLog::forUser($user)
            ->unread()
            ->count();
    }

    public function markAllRead(User $user): int
    {
        $updated = NotificationLog::forUser($user)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return $updated;
    }

    protected function getNotificationFrom(NotificationLog $notif): string
    {
        return match ($notif->type) {
            'comaker_request' => 'Co-Maker System',
            'loan_status' => 'Loan System',
            'payment_due' => 'Payment Reminder',
            'salary_deduction' => 'Payroll Deduction',
            'gm_profile_decision' => 'GM Decision',
            'system' => 'System',
            default => 'LEIMCO System',
        };
    }

    protected function getLoanTypeFromNotification(NotificationLog $notif): string
    {
        // For backward compatibility, map type or related to loan_type
        return match ($notif->type) {
            'loan_status' => 'Loan Update',
            'comaker_request' => 'Co-Maker',
            'salary_deduction' => 'Salary Deduction',
            default => $notif->type,
        };
    }

    protected function getTargetUrl(NotificationLog $notif): ?string
    {
        if ($notif->related_type === Loan::class && $notif->related_id) {
            return "/dashboards/Member/active-loans/{$notif->related_id}/view";
        }

        return match ($notif->type) {
            'salary_deduction', 'payment_due', 'loan_status' => $notif->related_id
                ? "/dashboards/Member/active-loans/{$notif->related_id}/view"
                : '/dashboards/Member/ShowActiveLoans',
            'comaker_request' => '/dashboards/Member/CoMaker',
            default => null,
        };
    }
}
