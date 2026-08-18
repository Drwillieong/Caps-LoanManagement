<?php

namespace App\Services\Payroll;

use Illuminate\Support\Facades\Cache;

class SystemSettingService
{
    public const PAYROLL_PROCESSING_KEY = 'payroll.processing';

    public function payrollProcessingState(): array
    {
        $value = Cache::get(self::PAYROLL_PROCESSING_KEY, []);

        return [
            'active' => (bool) ($value['active'] ?? false),
            'message' => $value['message'] ?? null,
            'started_at' => $value['started_at'] ?? null,
            'upload_id' => $value['upload_id'] ?? null,
        ];
    }

    public function isPayrollProcessing(): bool
    {
        return $this->payrollProcessingState()['active'];
    }

    public function startPayrollProcessing(?int $uploadId = null): void
    {
        Cache::forever(self::PAYROLL_PROCESSING_KEY, [
            'active' => true,
            'message' => 'Payroll deductions are currently being updated. Please wait.',
            'started_at' => now()->toIso8601String(),
            'upload_id' => $uploadId,
        ]);
    }

    public function stopPayrollProcessing(): void
    {
        Cache::forever(self::PAYROLL_PROCESSING_KEY, [
            'active' => false,
            'message' => null,
            'started_at' => null,
            'upload_id' => null,
        ]);
    }
}
