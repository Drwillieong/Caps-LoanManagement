<?php

namespace App\Services\Payroll;

use App\Imports\PayrollDeductionImport;
use App\Models\DeductionRecord;
use App\Models\Loan;
use App\Models\LoanAmortization;
use App\Models\MemberProfile;
use App\Models\PayrollUpload;
use App\Models\PayrollUploadRow;
use App\Models\User;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Throwable;

class PayrollDeductionService
{
    public function __construct(
        protected LoanPaymentPostingService $postingService,
        protected SystemSettingService $systemSettingService,
    ) {}

    public function expectedColumns(): array
    {
        $hasPayrollId = Schema::hasColumn('member_profiles', 'payroll_id');

        return [
            'required_identifier' => $hasPayrollId
                ? 'employee_id preferred; payroll_id accepted as fallback'
                : 'employee_id is required',
            'required_amount' => 'deduction_amount',
            'required_cutoff' => 'cutoff_date can be supplied per row, otherwise the upload cutoff date is used',
            'accepted_columns' => [
                'employee_id',
                'payroll_id',
                'employee_name',
                'cutoff_date',
                'deduction_amount',
                'remarks',
            ],
            'matching_order' => $hasPayrollId
                ? ['employee_id', 'payroll_id']
                : ['employee_id'],
        ];
    }

    public function processUpload(
        UploadedFile $file,
        Carbon $defaultCutoffDate,
        User $processedBy,
        ?string $remarks = null,
    ): PayrollUpload {
        $hash = hash_file('sha256', $file->getRealPath());

        $existingUpload = PayrollUpload::query()
            ->where('file_hash', $hash)
            ->whereDate('cutoff_date', $defaultCutoffDate->toDateString())
            ->where('status', 'processed')
            ->first();

        if ($existingUpload) {
            throw ValidationException::withMessages([
                'payroll_file' => "This payroll file was already processed for {$defaultCutoffDate->toDateString()} as upload #{$existingUpload->id}.",
            ]);
        }

        $storedFileName = $file->store('payroll-uploads');

        $upload = PayrollUpload::create([
            'uploaded_by' => $processedBy->id,
            'original_file_name' => $file->getClientOriginalName(),
            'stored_file_name' => $storedFileName,
            'file_hash' => $hash,
            'cutoff_date' => $defaultCutoffDate->toDateString(),
            'status' => 'processing',
            'remarks' => $remarks,
            'started_at' => now(),
        ]);

        $this->systemSettingService->startPayrollProcessing($upload->id);

        try {
            $rows = $this->readRows($file);
            $this->assertSupportedHeadings($rows);

            $stats = $this->processRows($upload, $rows, $defaultCutoffDate, $processedBy);

            $upload->update([
                ...$stats,
                'status' => 'processed',
                'finished_at' => now(),
            ]);

            return $upload->fresh(['rows' => fn ($query) => $query->latest('row_number')]);
        } catch (Throwable $exception) {
            $upload->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
                'finished_at' => now(),
            ]);

            throw $exception;
        } finally {
            $this->systemSettingService->stopPayrollProcessing();
        }
    }

    public function dashboardData(): array
    {
        $recentUpload = PayrollUpload::query()
            ->with('uploader:id,first_name,last_name')
            ->latest('cutoff_date')
            ->latest()
            ->first();

        return [
            'processing' => $this->systemSettingService->payrollProcessingState(),
            'expectedColumns' => $this->expectedColumns(),
            'stats' => [
                'missed_deductions' => DeductionRecord::query()->where('status', 'missed')->count(),
                'partial_deductions' => DeductionRecord::query()->where('status', 'partial')->count(),
                'overdue_loans' => LoanAmortization::query()
                    ->whereIn('status', ['overdue', 'missed', 'partial'])
                    ->whereDate('due_date', '<', now()->toDateString())
                    ->distinct('loan_id')
                    ->count('loan_id'),
                'consecutive_missed_loans' => $this->consecutiveMissedLoans()->count(),
                'payroll_uploads' => PayrollUpload::query()->count(),
                'failed_rows' => PayrollUploadRow::query()->where('status', 'failed')->count(),
            ],
            'recentUpload' => $recentUpload ? $this->formatUpload($recentUpload) : null,
            'uploadHistory' => PayrollUpload::query()
                ->with('uploader:id,first_name,last_name')
                ->latest('cutoff_date')
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn (PayrollUpload $upload) => $this->formatUpload($upload))
                ->values(),
            'failedRows' => PayrollUploadRow::query()
                ->with('upload:id,cutoff_date,original_file_name')
                ->whereIn('status', ['failed', 'duplicate'])
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn (PayrollUploadRow $row) => $this->formatRow($row))
                ->values(),
            'exceptionLoans' => $this->exceptionLoans(),
            'manualPaymentLoans' => $this->manualPaymentLoans(),
        ];
    }

    public function payrollTemplateCsv(): string
    {
        return implode(',', [
            'employee_id',
            'payroll_id',
            'employee_name',
            'cutoff_date',
            'deduction_amount',
            'remarks',
        ])."\n";
    }

    private function readRows(UploadedFile $file): Collection
    {
        $sheets = Excel::toCollection(new PayrollDeductionImport, $file);
        $rows = $sheets->first() ?? collect();

        return $rows
            ->filter(fn ($row) => collect($row)->filter(fn ($value) => filled($value))->isNotEmpty())
            ->values();
    }

    private function assertSupportedHeadings(Collection $rows): void
    {
        if ($rows->isEmpty()) {
            throw ValidationException::withMessages([
                'payroll_file' => 'The uploaded payroll file does not contain any data rows.',
            ]);
        }

        $headings = array_keys($rows->first()->toArray());
        $aliases = $this->columnAliases();

        $hasIdentifier = collect(['employee_id', 'payroll_id'])
            ->contains(fn ($column) => $this->hasAnyHeading($headings, $aliases[$column]));
        $hasAmount = $this->hasAnyHeading($headings, $aliases['deduction_amount']);

        if (! $hasIdentifier || ! $hasAmount) {
            throw ValidationException::withMessages([
                'payroll_file' => 'The file must include at least one member identifier column and a deduction_amount column.',
            ]);
        }
    }

    private function processRows(
        PayrollUpload $upload,
        Collection $rows,
        Carbon $defaultCutoffDate,
        User $processedBy,
    ): array {
        $stats = [
            'total_rows' => $rows->count(),
            'processed_rows' => 0,
            'failed_rows' => 0,
            'duplicate_rows' => 0,
            'paid_count' => 0,
            'partial_count' => 0,
            'missed_count' => 0,
            'deferred_count' => 0,
            'total_expected_amount' => 0,
            'total_deducted_amount' => 0,
        ];

        $seenKeys = [];

        DB::transaction(function () use ($upload, $rows, $defaultCutoffDate, $processedBy, &$stats, &$seenKeys) {
            foreach ($rows as $index => $rawRow) {
                $rowNumber = $index + 2;
                $payload = $this->extractPayload($rawRow->toArray());
                $deductionAmount = $this->parseMoney($payload['deduction_amount'] ?? null);
                $rawCutoffDate = $payload['cutoff_date'] ?? null;
                $parsedCutoffDate = $this->parseDate($rawCutoffDate);
                $cutoffDate = $parsedCutoffDate ?? $defaultCutoffDate;

                $uploadRowPayload = [
                    'payroll_upload_id' => $upload->id,
                    'row_number' => $rowNumber,
                    'employee_id' => $payload['employee_id'] ?? null,
                    'payroll_id' => $payload['payroll_id'] ?? null,
                    'employee_name' => $payload['employee_name'] ?? null,
                    'cutoff_date' => $cutoffDate->toDateString(),
                    'deduction_amount' => $deductionAmount,
                    'raw_payload' => $rawRow->toArray(),
                    'remarks' => $payload['remarks'] ?? null,
                ];

                if (Schema::hasColumn('payroll_upload_rows', 'member_id')) {
                    $uploadRowPayload['member_id'] = null;
                }

                $uploadRow = PayrollUploadRow::create($uploadRowPayload);

                $errors = $this->validatePayload($payload, $deductionAmount, $rawCutoffDate, $parsedCutoffDate);
                $dedupeKey = $this->dedupeKey($payload, $cutoffDate);

                if ($dedupeKey && isset($seenKeys[$dedupeKey])) {
                    $uploadRow->update([
                        'status' => 'duplicate',
                        'errors' => ['Duplicate member identifier and cutoff inside the uploaded file.'],
                        'processed_at' => now(),
                    ]);

                    $stats['duplicate_rows']++;

                    continue;
                }

                if ($dedupeKey) {
                    $seenKeys[$dedupeKey] = true;
                }

                if ($errors !== []) {
                    $this->failRow($uploadRow, $errors);
                    $stats['failed_rows']++;

                    continue;
                }

                $memberProfile = $this->matchMemberProfile($payload);

                if (! $memberProfile) {
                    $this->failRow($uploadRow, ['No member profile matched the provided payroll identifier.']);
                    $stats['failed_rows']++;

                    continue;
                }

                $uploadRow->update([
                    'matched_user_id' => $memberProfile->user_id,
                    'matched_member_profile_id' => $memberProfile->employee_id,
                ]);

                try {
                    $result = $this->postingService->applyMemberPayrollDeduction(
                        $memberProfile,
                        $deductionAmount,
                        $cutoffDate,
                        $processedBy,
                        [
                            'payroll_upload_id' => $upload->id,
                            'payroll_upload_row_id' => $uploadRow->id,
                            'member_profile_id' => $memberProfile->employee_id,
                            'cutoff_date' => $cutoffDate,
                            'reference_number' => 'PAYROLL-'.$upload->id.'-'.$rowNumber,
                            'remarks' => $payload['remarks'] ?? 'Payroll deduction upload.',
                        ],
                    );

                    if ($result['status'] === 'skipped' && $deductionAmount > 0) {
                        $this->failRow($uploadRow, [$result['message']], [
                            'applied_amount' => 0,
                            'unapplied_amount' => $deductionAmount,
                        ]);
                        $stats['failed_rows']++;

                        continue;
                    }

                    $uploadRow->update([
                        'status' => $result['status'] === 'skipped' ? 'skipped' : 'processed',
                        'deduction_status' => $result['status'] === 'skipped' ? null : $result['status'],
                        'applied_amount' => $result['applied_amount'],
                        'unapplied_amount' => $result['unapplied_amount'],
                        'remarks' => $result['message'],
                        'processed_at' => now(),
                    ]);

                    if ($result['status'] !== 'skipped') {
                        $stats['processed_rows']++;
                        $stats[$result['status'].'_count'] = ($stats[$result['status'].'_count'] ?? 0) + 1;
                        $stats['total_expected_amount'] += $result['expected_amount'];
                        $stats['total_deducted_amount'] += $result['applied_amount'];
                    }
                } catch (Throwable $exception) {
                    $this->failRow($uploadRow, [$exception->getMessage()]);
                    $stats['failed_rows']++;
                }
            }
        }, 3);

        return $stats;
    }

    private function failRow(PayrollUploadRow $row, array $errors, array $extra = []): void
    {
        $row->update([
            ...$extra,
            'status' => 'failed',
            'errors' => $errors,
            'processed_at' => now(),
        ]);
    }

    private function validatePayload(array $payload, float $deductionAmount, mixed $rawCutoffDate, ?Carbon $parsedCutoffDate): array
    {
        $errors = [];

        if (! filled($payload['employee_id'] ?? null)
            && ! filled($payload['payroll_id'] ?? null)) {
            $errors[] = 'Provide employee_id or payroll_id.';
        }

        if ($deductionAmount < 0) {
            $errors[] = 'Deduction amount cannot be negative.';
        }

        if (filled($rawCutoffDate) && ! $parsedCutoffDate) {
            $errors[] = 'Cutoff date is invalid.';
        }

        return $errors;
    }

    private function matchMemberProfile(array $payload): ?MemberProfile
    {
        if (filled($payload['employee_id'] ?? null)) {
            $profile = MemberProfile::query()
                ->where('employee_id', trim((string) $payload['employee_id']))
                ->first();

            if ($profile) {
                return $profile;
            }
        }

        if (Schema::hasColumn('member_profiles', 'payroll_id') && filled($payload['payroll_id'] ?? null)) {
            $profile = MemberProfile::query()
                ->where('payroll_id', trim((string) $payload['payroll_id']))
                ->first();

            if ($profile) {
                return $profile;
            }
        }

        return null;
    }

    private function extractPayload(array $row): array
    {
        $aliases = $this->columnAliases();

        return collect($aliases)
            ->map(fn (array $columnAliases) => $this->firstValue($row, $columnAliases))
            ->map(fn ($value) => is_string($value) ? trim($value) : $value)
            ->all();
    }

    private function firstValue(array $row, array $aliases): mixed
    {
        foreach ($aliases as $alias) {
            if (array_key_exists($alias, $row) && filled($row[$alias])) {
                return $row[$alias];
            }
        }

        return null;
    }

    private function columnAliases(): array
    {
        return [
            'employee_id' => ['employee_id', 'employee_no', 'employee_number', 'emp_id', 'id_number'],
            'payroll_id' => ['payroll_id', 'payroll_no', 'payroll_number', 'payroll_code'],
            'employee_name' => ['employee_name', 'member_name', 'full_name', 'name'],
            'cutoff_date' => ['cutoff_date', 'payroll_date', 'deduction_date', 'date'],
            'deduction_amount' => ['deduction_amount', 'loan_deduction', 'salary_deduction', 'deducted_amount', 'payment_amount', 'amount'],
            'remarks' => ['remarks', 'remark', 'notes', 'note'],
        ];
    }

    private function hasAnyHeading(array $headings, array $aliases): bool
    {
        return collect($aliases)->intersect($headings)->isNotEmpty();
    }

    private function dedupeKey(array $payload, Carbon $cutoffDate): ?string
    {
        foreach (['employee_id', 'payroll_id'] as $identifier) {
            if (filled($payload[$identifier] ?? null)) {
                return $identifier.':'.strtolower((string) $payload[$identifier]).':'.$cutoffDate->toDateString();
            }
        }

        return null;
    }

    private function parseMoney(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        if (is_numeric($value)) {
            return round((float) $value, 2);
        }

        $normalized = preg_replace('/[^\d.\-]/', '', (string) $value);

        if ($normalized === '' || $normalized === '-') {
            return 0.0;
        }

        return round((float) $normalized, 2);
    }

    private function parseDate(mixed $value): ?Carbon
    {
        if ($value instanceof Carbon) {
            return $value;
        }

        if ($value instanceof DateTimeInterface) {
            return Carbon::instance($value);
        }

        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value));
        }

        $value = trim((string) $value);

        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y', 'm-d-Y'] as $format) {
            try {
                $date = Carbon::createFromFormat($format, $value);

                if ($date && $date->format($format) === $value) {
                    return $date;
                }
            } catch (Throwable) {
                // Try the next supported spreadsheet/user-entered date format.
            }
        }

        try {
            return Carbon::parse($value);
        } catch (Throwable) {
            return null;
        }
    }

    private function formatUpload(PayrollUpload $upload): array
    {
        return [
            'id' => $upload->id,
            'original_file_name' => $upload->original_file_name,
            'cutoff_date' => $upload->cutoff_date?->format('Y-m-d'),
            'status' => $upload->status,
            'total_rows' => $upload->total_rows,
            'processed_rows' => $upload->processed_rows,
            'failed_rows' => $upload->failed_rows,
            'duplicate_rows' => $upload->duplicate_rows,
            'paid_count' => $upload->paid_count,
            'partial_count' => $upload->partial_count,
            'missed_count' => $upload->missed_count,
            'total_expected_amount' => (float) $upload->total_expected_amount,
            'total_deducted_amount' => (float) $upload->total_deducted_amount,
            'uploaded_by' => $upload->uploader
                ? trim($upload->uploader->first_name.' '.$upload->uploader->last_name)
                : 'System',
            'started_at' => $upload->started_at?->format('Y-m-d H:i:s'),
            'finished_at' => $upload->finished_at?->format('Y-m-d H:i:s'),
            'error_message' => $upload->error_message,
        ];
    }

    private function formatRow(PayrollUploadRow $row): array
    {
        $formatted = [
            'id' => $row->id,
            'upload_id' => $row->payroll_upload_id,
            'row_number' => $row->row_number,
            'employee_id' => $row->employee_id,
            'payroll_id' => $row->payroll_id,
            'employee_name' => $row->employee_name,
            'cutoff_date' => $row->cutoff_date?->format('Y-m-d'),
            'deduction_amount' => (float) $row->deduction_amount,
            'status' => $row->status,
            'deduction_status' => $row->deduction_status,
            'errors' => $row->errors ?? [],
            'file_name' => $row->upload?->original_file_name,
        ];

        if (Schema::hasColumn('payroll_upload_rows', 'member_id')) {
            $formatted['member_id'] = $row->member_id;
        }

        return $formatted;
    }

    private function exceptionLoans(): Collection
    {
        return Loan::query()
            ->whereIn('status', ['approved', 'released'])
            ->with([
                'user.memberProfile',
                'loanType',
                'amortizations' => fn ($query) => $query
                    ->whereIn('status', ['missed', 'partial', 'overdue', 'deferred'])
                    ->orderBy('due_date'),
                'payments',
            ])
            ->whereHas('amortizations', fn ($query) => $query->whereIn('status', ['missed', 'partial', 'overdue', 'deferred']))
            ->limit(12)
            ->get()
            ->map(function (Loan $loan) {
                $totalPaid = (float) $loan->payments->sum('amount');

                return [
                    'id' => $loan->id,
                    'member_name' => trim($loan->user->first_name.' '.$loan->user->last_name),
                    'employee_id' => $loan->user->memberProfile?->employee_id,
                    'loan_type' => $loan->loanType?->name ?? 'Loan',
                    'status' => $loan->status,
                    'remaining_balance' => max(0, (float) $loan->total_amount_due - $totalPaid),
                    'next_exception' => $loan->amortizations->first()?->due_date?->format('Y-m-d'),
                    'exception_status' => $loan->amortizations->first()?->status,
                ];
            })
            ->values();
    }

    private function manualPaymentLoans(): Collection
    {
        return Loan::query()
            ->whereIn('status', ['approved', 'released'])
            ->with([
                'user.memberProfile',
                'loanType',
                'payments',
                'amortizations' => fn ($query) => $query
                    ->whereIn('status', LoanPaymentPostingService::OPEN_AMORTIZATION_STATUSES)
                    ->orderBy('due_date'),
            ])
            ->orderByDesc('release_date')
            ->limit(50)
            ->get()
            ->map(function (Loan $loan) {
                $totalPaid = (float) $loan->payments->sum('amount');
                $memberName = trim($loan->user->first_name.' '.($loan->user->middle_name ?? '').' '.$loan->user->last_name);

                return [
                    'id' => $loan->id,
                    'label' => '#'.$loan->id.' - '.$memberName.' - '.($loan->loanType?->name ?? 'Loan'),
                    'member_name' => $memberName,
                    'employee_id' => $loan->user->memberProfile?->employee_id,
                    'loan_type' => $loan->loanType?->name ?? 'Loan',
                    'remaining_balance' => max(0, (float) $loan->total_amount_due - $totalPaid),
                    'next_due_amount' => (float) ($loan->amortizations->first()?->amount_due ?? 0),
                    'next_due_date' => $loan->amortizations->first()?->due_date?->format('Y-m-d'),
                ];
            })
            ->values();
    }

    private function consecutiveMissedLoans(): Collection
    {
        return Loan::query()
            ->whereIn('status', ['approved', 'released'])
            ->with(['amortizations' => fn ($query) => $query->latest('due_date')])
            ->get()
            ->filter(function (Loan $loan) {
                $recent = $loan->amortizations->take(2);

                return $recent->count() >= 2 && $recent->every(fn (LoanAmortization $amortization) => $amortization->status === 'missed');
            })
            ->values();
    }
}
