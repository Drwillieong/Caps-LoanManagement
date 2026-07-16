<?php

namespace App\Exports;

use App\Services\Payroll\SalaryDeductionReportService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalaryDeductionReportExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        protected Carbon $cutoffDate,
        protected SalaryDeductionReportService $service,
    ) {}

    public function headings(): array
    {
        return $this->service->headingRow();
    }

    public function title(): string
    {
        // Match template sheet name requirement.
        // Template layout/sheet name wasn’t implemented as Excel in this codebase,
        // but we standardize it to the expected upload-compatible name.
        return 'Salary Deductions';
    }

    public function map($row): array
    {
        // Ensure strict column order.
        return [
            $row['employee_id'],
            $row['payroll_id'],
            $row['member_id'],
            $row['employee_name'],
            $row['cutoff_date'],
            $row['deduction_amount'],
            $row['remarks'],
        ];
    }

    public function collection(): Collection
    {
        $lazy = $this->service->rowsForCutoff($this->cutoffDate);

        // For correctness we aggregate/dedupe by upload dedupe rules.
        // This may still be large; for huge datasets, we’d push aggregation to SQL.
        $rows = iterator_to_array($lazy);

        $aggregated = $this->service->aggregateRows($rows);

        return collect($aggregated);
    }

    public function styles(Worksheet $sheet): array
    {
        // Basic formatting to keep the export Excel-like.
        // If the system’s existing Excel template has specific formatting,
        // this style block can be adjusted to match exactly.
        $headingRange = 'A1:G1';

        $sheet->getStyle($headingRange)->applyFromArray([
            'font' => [
                'bold' => true,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E5E7EB'], // gray-200-ish
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'bottom' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '9CA3AF'],
                ],
            ],
        ]);

        // Deduction amount column formatting (F).
        $sheet->getStyle('F:F')->getNumberFormat()->setFormatCode('#,##0.00');

        return [];

    }
}
