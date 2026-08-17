<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MemberTemplateExport implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function headings(): array
    {
        return [
            'first_name',
            'middle_name',
            'last_name',
            'email',
            'members_id',
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
    }

    public function title(): string
    {
        return 'Member Template';
    }

    public function collection(): Collection
    {
        return collect([
            [
                'Juan',
                'Dela Cruz',
                'Santos',
                'kcbolado@ccc.edu.ph',
                '005',
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
            ],
        ]);
    }

    public function styles(Worksheet $sheet): array
    {
        $lastColumn = $sheet->getHighestColumn();
        $headingRange = "A1:{$lastColumn}1";

        $sheet->getStyle($headingRange)->applyFromArray([
            'font' => [
                'bold' => true,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E5E7EB'],
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

        return [];
    }
}
