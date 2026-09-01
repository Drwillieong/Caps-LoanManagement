<?php

namespace App\Http\Requests;

use App\Models\LoanAdvancePaymentRequest;
use Illuminate\Foundation\Http\FormRequest;

class StoreLoanAdvancePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $loan = $this->route('loan');

        return $loan && $this->user()?->can('create', [LoanAdvancePaymentRequest::class, $loan]);
    }

    public function rules(): array
    {
        return [
            'requested_amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bank_transfer,salary_deduction'],
            'expected_payment_date' => ['nullable', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'payment_proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
