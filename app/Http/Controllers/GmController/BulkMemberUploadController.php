<?php

namespace App\Http\Controllers\GmController;

use App\Exports\MemberTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\BulkMemberImport;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Excel as ExcelFormat;
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
     * Download a sample Excel (.xlsx) template pre-formatted with all required columns.
     */
    public function template()
    {
        return Excel::download(
            new MemberTemplateExport,
            'member_bulk_import_template.xlsx',
            ExcelFormat::XLSX
        );
    }

    /**
     * Process the uploaded Excel/CSV file.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:10240',
        ]);

        $import = new BulkMemberImport;

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
