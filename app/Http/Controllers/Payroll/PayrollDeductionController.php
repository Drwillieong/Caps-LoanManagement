<?php

namespace App\Http\Controllers\Payroll;

use App\Exports\SalaryDeductionReportExport;
use App\Http\Controllers\Controller;
use App\Jobs\SendPayrollDeductionNotifications;
use App\Models\Loan;
use App\Services\ActivityLogService;
use App\Services\Payroll\LoanPaymentPostingService;
use App\Services\Payroll\PayrollDeductionService;
use App\Services\Payroll\SalaryDeductionReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PayrollDeductionController extends Controller
{
    public function index(PayrollDeductionService $payrollDeductionService)
    {
        return Inertia::render('dashboards/Gm/UploadSalaryDeduct', $payrollDeductionService->dashboardData());
    }

    public function exportSalaryDeductions(
        Request $request,
        SalaryDeductionReportService $reportService
    ) {
        $validated = $request->validate([
            'cutoff_date' => 'required|date',
        ]);

        $cutoffDate = Carbon::parse($validated['cutoff_date']);

        return Excel::download(
            new SalaryDeductionReportExport($cutoffDate, $reportService),
            'salary_deduction_report_'.$cutoffDate->toDateString().'.xlsx',
            ExcelWriter::XLSX
        );
    }

    public function store(Request $request, PayrollDeductionService $payrollDeductionService)
    {
        $validated = $request->validate([
            'payroll_file' => 'required|file|mimes:xlsx,xls,csv,ods|max:10240',
            'cutoff_date' => 'required|date',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $upload = $payrollDeductionService->processUpload(
            $validated['payroll_file'],
            Carbon::parse($validated['cutoff_date']),
            $request->user(),
            $validated['remarks'] ?? null,
        );

        SendPayrollDeductionNotifications::dispatch($upload->id);

        $cutoffDate = $upload->cutoff_date?->toDateString() ?? 'N/A';

        app(ActivityLogService::class)->logActivity(
            'payroll_upload_processed',
            null,
            'Processed payroll upload #'.$upload->id.' ('.$upload->original_file_name.') for cutoff '.$cutoffDate.'. '.$upload->processed_rows.' row(s) applied, '.$upload->failed_rows.' failed.'
        );

        return redirect()
            ->route('gm.payroll-deductions')
            ->with('success', "Payroll upload #{$upload->id} processed. {$upload->processed_rows} row(s) applied, {$upload->failed_rows} failed. Member emails are being sent in the background.");
    }

    public function manualPayment(Request $request, LoanPaymentPostingService $postingService)
    {
        $validated = $request->validate([
            'loan_id' => 'required|exists:loans,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,gcash,bank_transfer,adjustment',
            'reference_number' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $loan = Loan::query()
            ->whereIn('status', ['approved', 'released'])
            ->findOrFail($validated['loan_id']);

        $result = DB::transaction(fn () => $postingService->applyManualPayment(
            $loan,
            (float) $validated['amount'],
            Carbon::parse($validated['payment_date']),
            $request->user(),
            [
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'remarks' => $validated['remarks'] ?? 'Manual payment recorded by GM/Admin.',
                'paid_by' => trim($loan->user->first_name.' '.$loan->user->last_name),
            ],
        ), 3);

        if ($result['applied_amount'] <= 0) {
            return back()->withErrors([
                'loan_id' => $result['message'],
            ]);
        }

        app(ActivityLogService::class)->logActivity(
            'manual_payment_recorded',
            $loan->id,
            'Recorded manual payment of PHP '.number_format((float) $result['applied_amount'], 2).' for loan #'.$loan->id.'.'
        );

        return redirect()
            ->route('gm.payroll-deductions')
            ->with('success', 'Manual payment recorded successfully.');
    }

    public function template(PayrollDeductionService $payrollDeductionService): StreamedResponse
    {
        return response()->streamDownload(function () use ($payrollDeductionService) {
            echo $payrollDeductionService->payrollTemplateCsv();
        }, 'payroll_deduction_template.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function startPayrollMaintenance(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'remarks' => 'nullable|string|max:1000',
        ]);

        app(\App\Services\Payroll\SystemSettingService::class)->startPayrollProcessing(null);

        app(ActivityLogService::class)->logActivity(
            'payroll_maintenance_started',
            null,
            'Started payroll maintenance mode.'.($request->filled('remarks') ? ' Remarks: '.$request->string('remarks') : '')
        );

        return redirect()
            ->route('gm.payroll-deductions')
            ->with('success', 'Member pages are now locked for payroll maintenance.');
    }

    public function stopPayrollMaintenance(): \Illuminate\Http\RedirectResponse
    {
        app(\App\Services\Payroll\SystemSettingService::class)->stopPayrollProcessing();

        app(ActivityLogService::class)->logActivity(
            'payroll_maintenance_stopped',
            null,
            'Stopped payroll maintenance mode.'
        );

        return redirect()
            ->route('gm.payroll-deductions')
            ->with('success', 'Member pages are now unlocked.');
    }
}
