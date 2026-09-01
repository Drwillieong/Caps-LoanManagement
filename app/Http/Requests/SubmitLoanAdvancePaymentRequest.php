<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitLoanAdvancePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $advancePaymentRequest = $this->route('advancePaymentRequest');

        return $advancePaymentRequest && $this->user()?->can('submitPayment', $advancePaymentRequest);
    }

    public function rules(): array
    {
        return [
            'payment_date' => ['required', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'payment_proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
