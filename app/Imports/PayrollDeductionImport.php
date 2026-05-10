<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class PayrollDeductionImport implements ToCollection, WithHeadingRow
{
    public function __construct(
        protected Collection $rows = new Collection,
    ) {}

    public function collection(Collection $rows): void
    {
        $this->rows = $rows;
    }

    public function rows(): Collection
    {
        return $this->rows;
    }
}
