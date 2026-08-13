<?php

namespace App\Http\Controllers\GmController;

use App\Http\Controllers\Controller;
use App\Imports\BulkMemberImport;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class BulkMemberUploadController extends Controller
{
    /**
     * Show the bulk upload page.
     */
    public function index()
    {
        return Inertia::render('dashboards/Gm/BulkUploadMembers');
    }

    /**
     * Download a sample Excel template pre-formatted with all required columns.
     */
    public function template()
    {
        $headers = [
            'first_name',
            'middle_name',
            'last_name',
            'email',
            'employee_id',
            'payroll_id',
            'date_of_birth',
            'sex',
            'civil_status',
            'place_of_birth',
            'educational_attainment',
            'mobile_number',
            'permanent_mobile_number',
            'present_address',
            'present_zip_code',
            'permanent_address',
            'permanent_zip_code',
            'position',
            'basic_salary',
            'income_type',
            'net_income',
            'share_capital_balance',
            'other_source_of_income',
            'facebook_account_name',
            'spouse_occupation',
            'spouse_gross_income',
            'spouse_income_type',
            'spouse_net_income',
            'legal_beneficiary_1_name',
            'real_properties_owned',
        ];

        $exampleRow = [
            'Juan',
            'Dela Cruz',
            'Santos',
            'juan.santos@example.com',
            '',
            'PAY-001',
            '1990-01-15',
            'male',
            'married',
            'Manila City',
            'College',
            '09171234567',
            '09189876543',
            '123 Rizal St, Brgy. 1, Manila City',
            '1000',
            '456 Mabini St, Batangas City',
            '4200',
            'Staff',
            '2020-06-01',
            '25000.00',
            'monthly',
            '22000.00',
            '15000.00',
            'Freelance Photography',
            'Juan Santos FB',
            'Teacher',
            '18000.00',
            'monthly',
            '16000.00',
            'Maria Santos',
            'Residential lot in Batangas',
        ];

        // Build CSV content
        $csv = implode(',', array_map(fn ($h) => '"'.$h.'"', $headers))."\n";
        $csv .= implode(',', array_map(fn ($v) => '"'.str_replace('"', '""', $v).'"', $exampleRow));

        return response()->streamDownload(function () use ($csv) {
            echo $csv;
        }, 'member_bulk_import_template.csv', [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="member_bulk_import_template.csv"',
        ]);
    }

    /**
     * Process the uploaded Excel/CSV file.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:10240',
        ]);

        $import = new BulkMemberImport();

        try {
            Excel::import($import, $validated['file']);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse the uploaded file: '.$e->getMessage(),
            ], 422);
        }

        // Log activity
        if ($import->successCount > 0) {
            app(ActivityLogService::class)->logActivity(
                'bulk_member_import',
                null,
                "GM bulk imported {$import->successCount} member(s) via Excel upload. ".
                ($import->sentEmailCount > 0 ? "Welcome emails sent to {$import->sentEmailCount} member(s)." : 'No welcome emails sent.').
                ($import->failures !== [] ? ' '.count($import->failures).' row(s) failed.' : '')
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully imported {$import->successCount} member(s).",
            'data' => [
                'success_count' => $import->successCount,
                'sent_email_count' => $import->sentEmailCount,
                'failed_count' => count($import->failures),
                'failures' => $import->failures,
            ],
        ]);
    }
}

