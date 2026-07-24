<?php

namespace App\Imports;

use App\Models\User;
use App\Models\MemberProfile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\Importable;
use App\Mail\SendMembersPass;

class BulkMemberImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    use Importable;

    public int $successCount = 0;
    public int $sentEmailCount = 0;
    /** @var array<int, array{row: int, email: string, error: string}> */
    public array $failures = [];

    protected const REQUIRED_FIELDS = [
        'first_name',
        'last_name',
        'email',
        'employee_id',
        'date_of_birth',
        'sex',
        'civil_status',
        'mobile_number',
        'present_address',
        'position',
        'date_hired',
        'basic_salary',
    ];

    protected int|null $nextEmployeeIdCounter = null;

    /**
     * Generate a cryptographically secure temporary password.
     */
    protected function generateTemporaryPassword(int $length = 14): string
    {
        $groups = [
            'ABCDEFGHJKLMNPQRSTUVWXYZ',
            'abcdefghijkmnopqrstuvwxyz',
            '23456789',
            '!@#$%^&*',
        ];

        $characters = implode('', $groups);
        $password = [];

        foreach ($groups as $group) {
            $password[] = $group[random_int(0, strlen($group) - 1)];
        }

        while (count($password) < $length) {
            $password[] = $characters[random_int(0, strlen($characters) - 1)];
        }

        for ($i = count($password) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$password[$i], $password[$j]] = [$password[$j], $password[$i]];
        }

        return implode('', $password);
    }

    /**
     * Normalise heading keys to snake_case.
     */
    protected function normaliseHeaders(array $row): array
    {
        $normalised = [];
        foreach ($row as $key => $value) {
            $normalKey = str($key)
                ->lower()
                ->replaceMatches('/[\s\-]+/', '_')
                ->toString();

            // Map common variations
            $map = [
                'name_first' => 'first_name',
                'firstname' => 'first_name',
                'given_name' => 'first_name',
                'name_last' => 'last_name',
                'lastname' => 'last_name',
                'surname' => 'last_name',
                'family_name' => 'last_name',
                'name_middle' => 'middle_name',
                'middlename' => 'middle_name',
                'email_address' => 'email',
                'e_mail' => 'email',
                'member_id' => 'employee_id',
                'employeeid' => 'employee_id',
                'id_number' => 'employee_id',
                'payrollid' => 'payroll_id',
                'birth_date' => 'date_of_birth',
                'birthdate' => 'date_of_birth',
                'dob' => 'date_of_birth',
                'place_of_birth' => 'place_of_birth',
                'birth_place' => 'place_of_birth',
                'civilstatus' => 'civil_status',
                'marital_status' => 'civil_status',
                'educational_attainment' => 'educational_attainment',
                'education' => 'educational_attainment',
                'permanent_address' => 'permanent_address',
                'provincial_address' => 'permanent_address',
                'permanent_zip' => 'permanent_zip_code',
                'permanent_zipcode' => 'permanent_zip_code',
                'permanent_phone' => 'permanent_mobile_number',
                'permanent_mobile' => 'permanent_mobile_number',
                'present_address' => 'present_address',
                'current_address' => 'present_address',
                'present_zip' => 'present_zip_code',
                'present_zipcode' => 'present_zip_code',
                'mobile_number' => 'mobile_number',
                'cellphone_number' => 'mobile_number',
                'phone' => 'mobile_number',
                'contact_number' => 'mobile_number',
                'position' => 'position',
                'job_title' => 'position',
                'designation' => 'position',
                'date_hired' => 'date_hired',
                'hired_date' => 'date_hired',
                'start_date' => 'date_hired',
                'basic_salary' => 'basic_salary',
                'gross_income' => 'basic_salary',
                'salary' => 'basic_salary',
                'income_type' => 'income_type',
                'net_income' => 'net_income',
                'take_home_pay' => 'net_income',
                'share_capital' => 'share_capital_balance',
                'share_capital_balance' => 'share_capital_balance',
                'capital_balance' => 'share_capital_balance',
                'other_income' => 'other_source_of_income',
                'other_source_of_income' => 'other_source_of_income',
                'facebook' => 'facebook_account_name',
                'facebook_account' => 'facebook_account_name',
                'spouse_occupation' => 'spouse_occupation',
                'spouse_gross' => 'spouse_gross_income',
                'spouse_gross_income' => 'spouse_gross_income',
                'spouse_income_type' => 'spouse_income_type',
                'spouse_net' => 'spouse_net_income',
                'spouse_net_income' => 'spouse_net_income',
                'beneficiary' => 'legal_beneficiary_1_name',
                'legal_beneficiary' => 'legal_beneficiary_1_name',
                'beneficiary_name' => 'legal_beneficiary_1_name',
                'real_properties' => 'real_properties_owned',
                'properties_owned' => 'real_properties_owned',
                'payroll_id' => 'payroll_id',
            ];

            $normalised[$map[$normalKey] ?? $normalKey] = is_string($value) ? trim($value) : $value;
        }

        return $normalised;
    }

    /**
     * Resolve or auto-generate a unique employee_id for the incoming row.
     *
     * If a value is provided in the spreadsheet it is returned as-is (duplicate
     * validation is handled separately). If the value is blank the system will
     * generate the next sequential ID (EMP-XXX) based on the highest existing
     * value already stored in the database.
     */
    protected function resolveEmployeeId(?string $provided): string
    {
        if (filled($provided)) {
            return $provided;
        }

        if ($this->nextEmployeeIdCounter === null) {
            $max = MemberProfile::query()
                ->where('employee_id', 'like', 'EMP-%')
                ->selectRaw("MAX(SUBSTR(employee_id, INSTR(employee_id, '-') + 1) + 0) as max_num")
                ->value('max_num');

            $this->nextEmployeeIdCounter = (int) ($max ?: 0);
        }

        $this->nextEmployeeIdCounter++;

        return 'EMP-'.str_pad((string) $this->nextEmployeeIdCounter, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Validate a single row.
     *
     * @return string[] Array of error messages
     */
    protected function validateRow(array $row, int $rowNumber): array
    {
        $errors = [];

        $row['employee_id'] = $this->resolveEmployeeId($row['employee_id'] ?? null);

        // Required field presence check
        foreach (self::REQUIRED_FIELDS as $field) {
            if (! isset($row[$field]) || (is_string($row[$field]) && trim($row[$field]) === '')) {
                $errors[] = "Missing required field: {$field}";
            }
        }

        if (! empty($errors)) {
            return $errors;
        }

        // Email format
        if (! filter_var($row['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Invalid email format: {$row['email']}";
        }

        // Unique email (check DB)
        if (User::where('email', strtolower($row['email']))->exists()) {
            $errors[] = "Duplicate email: {$row['email']} (already exists)";
        }

        // Unique employee_id
        if (MemberProfile::where('employee_id', $row['employee_id'])->exists()) {
            $errors[] = "Duplicate Employee ID: {$row['employee_id']} (already exists)";
        }

        // Sex validation
        if (isset($row['sex']) && ! in_array(strtolower($row['sex']), ['male', 'female'])) {
            $errors[] = "Invalid sex value: {$row['sex']} (must be 'male' or 'female')";
        }

        // Civil status validation
        if (isset($row['civil_status']) && ! in_array(strtolower($row['civil_status']), ['single', 'married', 'widowed', 'separated'])) {
            $errors[] = "Invalid civil_status value: {$row['civil_status']} (must be single, married, widowed, or separated)";
        }

        // Income type validation
        if (! empty($row['income_type']) && ! in_array(strtolower($row['income_type']), ['monthly', 'daily', 'yearly'])) {
            $errors[] = "Invalid income_type value: {$row['income_type']} (must be monthly, daily, or yearly)";
        }

        // Numeric validations
        $numericFields = [
            'basic_salary' => 'Basic Salary',
            'net_income' => 'Net Income',
            'share_capital_balance' => 'Share Capital Balance',
            'spouse_gross_income' => 'Spouse Gross Income',
            'spouse_net_income' => 'Spouse Net Income',
        ];

        foreach ($numericFields as $field => $label) {
            if (! empty($row[$field]) && ! is_numeric($row[$field])) {
                $errors[] = "{$label} must be a number, got: {$row[$field]}";
            }
        }

        // Date validations
        $dateFields = ['date_of_birth', 'date_hired'];
        foreach ($dateFields as $field) {
            if (! empty($row[$field])) {
                $ts = strtotime($row[$field]);
                if ($ts === false) {
                    $errors[] = "Invalid date format for {$field}: {$row[$field]} (use YYYY-MM-DD)";
                }
            }
        }

        return $errors;
    }

    /**
     * Cast row values to correct types for DB insertion.
     */
    protected function castRow(array $row): array
    {
        // Normalise sex
        if (isset($row['sex'])) {
            $row['sex'] = strtolower($row['sex']);
        }

        // Normalise civil_status
        if (isset($row['civil_status'])) {
            $row['civil_status'] = strtolower($row['civil_status']);
        }

        // Normalise income_type
        if (isset($row['income_type'])) {
            $row['income_type'] = strtolower($row['income_type']);
        }

        if (isset($row['spouse_income_type'])) {
            $row['spouse_income_type'] = strtolower($row['spouse_income_type']);
        }

        // Numeric casts
        $numericFields = [
            'basic_salary', 'net_income', 'share_capital_balance',
            'spouse_gross_income', 'spouse_net_income',
        ];
        foreach ($numericFields as $field) {
            if (isset($row[$field]) && $row[$field] !== '' && $row[$field] !== null) {
                $row[$field] = (float) $row[$field];
            } else {
                $row[$field] = null;
            }
        }

        // Ensure default for share_capital_balance
        if ($row['share_capital_balance'] === null || $row['share_capital_balance'] === 0) {
            $row['share_capital_balance'] = 0.00;
        }

        return $row;
    }

    /**
     * Process a single row: create user + profile, send email.
     */
    protected function processRow(array $row, int $rowNumber): void
    {
        $row = $this->castRow($row);
        $temporaryPassword = $this->generateTemporaryPassword();

        DB::transaction(function () use ($row, $temporaryPassword) {
            $user = User::create([
                'first_name' => $row['first_name'],
                'middle_name' => $row['middle_name'] ?? null,
                'last_name' => $row['last_name'],
                'email' => strtolower($row['email']),
                'role' => 'member',
                'password' => Hash::make($temporaryPassword),
                'status' => 'active',
                'temporary_password' => $temporaryPassword,
                'is_active' => true,
            ]);

            $user->memberProfile()->create([
                'employee_id' => $row['employee_id'],
                'payroll_id' => $row['payroll_id'] ?? null,
                'first_name' => $row['first_name'],
                'middle_name' => $row['middle_name'] ?? null,
                'last_name' => $row['last_name'],
                'place_of_birth' => $row['place_of_birth'] ?? null,
                'date_of_birth' => $row['date_of_birth'],
                'civil_status' => $row['civil_status'],
                'sex' => $row['sex'],
                'educational_attainment' => $row['educational_attainment'] ?? null,
                'mobile_number' => $row['mobile_number'],
                'permanent_mobile_number' => $row['permanent_mobile_number'] ?? null,
                'present_address' => $row['present_address'],
                'present_zip_code' => $row['present_zip_code'] ?? null,
                'permanent_address' => $row['permanent_address'] ?? null,
                'permanent_zip_code' => $row['permanent_zip_code'] ?? null,
                'position' => $row['position'],
                'date_hired' => $row['date_hired'],
                'basic_salary' => $row['basic_salary'],
                'income_type' => $row['income_type'] ?? 'monthly',
                'net_income' => $row['net_income'] ?? null,
                'share_capital_balance' => $row['share_capital_balance'] ?? 0,
                'other_source_of_income' => $row['other_source_of_income'] ?? null,
                'facebook_account_name' => $row['facebook_account_name'] ?? null,
                'spouse_occupation' => $row['spouse_occupation'] ?? null,
                'spouse_gross_income' => $row['spouse_gross_income'] ?? null,
                'spouse_income_type' => $row['spouse_income_type'] ?? 'monthly',
                'spouse_net_income' => $row['spouse_net_income'] ?? null,
                'legal_beneficiary_1_name' => $row['legal_beneficiary_1_name'] ?? null,
                'real_properties_owned' => $row['real_properties_owned'] ?? null,
            ]);

            // Send welcome email immediately (legacy members)
            try {
                Mail::to($user->email)->send(new SendMembersPass(
                    $user->email,
                    $temporaryPassword,
                    $user->name
                ));
                $this->sentEmailCount++;
            } catch (\Exception $e) {
                Log::error("Failed to send welcome email to {$user->email}: ".$e->getMessage());
            }

            return $user;
        });

        $this->successCount++;
    }

    /**
     * Main collection handler — called by Laravel Excel.
     */
    public function collection(Collection $rows): void
    {
        $rowIndex = 1; // 1-based for display (row 1 = header in Excel)

        foreach ($rows as $row) {
            $rowIndex++;
            $normalised = $this->normaliseHeaders($row->toArray());

            // Skip entirely empty rows
            if (empty(array_filter($normalised, fn ($v) => $v !== null && $v !== ''))) {
                continue;
            }

            // Validate
            $validationErrors = $this->validateRow($normalised, $rowIndex);

            if (! empty($validationErrors)) {
                $this->failures[] = [
                    'row' => $rowIndex,
                    'email' => $normalised['email'] ?? 'N/A',
                    'error' => implode('; ', $validationErrors),
                ];
                continue;
            }

            // Process
            try {
                $this->processRow($normalised, $rowIndex);
            } catch (\Exception $e) {
                $this->failures[] = [
                    'row' => $rowIndex,
                    'email' => $normalised['email'] ?? 'N/A',
                    'error' => 'Database error: '.$e->getMessage(),
                ];
                Log::error("Bulk member import failed on row {$rowIndex}: ".$e->getMessage());
            }
        }
    }
}

