<?php

namespace App\Services\Payroll;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Schema;

class SystemSettingService
{
    public const PAYROLL_PROCESSING_KEY = 'payroll.processing';

    public function payrollProcessingState(): array
    {
        if (! Schema::hasTable('system_settings')) {
            return [
                'active' => false,
                'message' => null,
                'started_at' => null,
                'upload_id' => null,
            ];
        }

        $value = SystemSetting::getValue(self::PAYROLL_PROCESSING_KEY, []);

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
        SystemSetting::setValue(self::PAYROLL_PROCESSING_KEY, [
            'active' => true,
            'message' => 'Payroll deductions are currently being updated. Please wait.',
            'started_at' => now()->toIso8601String(),
            'upload_id' => $uploadId,
        ], 'Temporarily locks member-facing loan pages while payroll deductions are being processed.');
    }

    public function stopPayrollProcessing(): void
    {
        SystemSetting::setValue(self::PAYROLL_PROCESSING_KEY, [
            'active' => false,
            'message' => null,
            'started_at' => null,
            'upload_id' => null,
        ], 'Temporarily locks member-facing loan pages while payroll deductions are being processed.');
    }
}
