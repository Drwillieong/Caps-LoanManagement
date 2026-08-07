<?php

namespace App\Jobs;

use App\Mail\PayrollDeductionNotificationMail;
use App\Models\DeductionRecord;
use App\Models\PayrollUploadRow;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendPayrollDeductionNotifications implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $payrollUploadId) {}

    public function handle(): void
    {
        PayrollUploadRow::query()
            ->with(['user', 'deductionRecords.loan.loanType'])
            ->where('payroll_upload_id', $this->payrollUploadId)
            ->where('status', 'processed')
            ->whereNotNull('matched_user_id')
            ->whereIn('deduction_status', ['paid', 'partial', 'missed'])
            ->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    if (! $row->user?->email) {
                        continue;
                    }

                    Mail::to($row->user->email)->send(
                        new PayrollDeductionNotificationMail($row, $this->summaryFor($row))
                    );
                }
            });
    }

    private function summaryFor(PayrollUploadRow $row): array
    {
        $records = $row->deductionRecords;
        $status = $this->deductionStatus($records, (float) $row->deduction_amount);
        $lastRecord = $records->sortByDesc('id')->first();

        return [
            'member_name' => $row->user?->name ?? $row->employee_name ?? 'Member',
            'cutoff_date' => $row->cutoff_date?->format('F j, Y') ?? now()->format('F j, Y'),
            'expected_amount' => (float) $records->sum('expected_amount'),
            'deducted_amount' => (float) $row->applied_amount,
            'status' => $status,
            'remaining_balance' => (float) ($lastRecord?->balance_after ?? 0),
            'loan_name' => $lastRecord?->loan?->loanType?->name ?? 'Loan',
        ];
    }

    private function deductionStatus($records, float $deductedAmount): string
    {
        if ($deductedAmount <= 0 || $records->contains(fn (DeductionRecord $record) => $record->status === 'missed')) {
            return 'Missed';
        }

        if ($records->contains(fn (DeductionRecord $record) => $record->status === 'partial')) {
            return 'Partial';
        }

        return 'Complete';
    }
}
