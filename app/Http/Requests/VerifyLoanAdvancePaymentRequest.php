<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyLoanAdvancePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $advancePaymentRequest = $this->route('advancePaymentRequest');

        return $advancePaymentRequest && $this->user()?->can('verifyPayment', $advancePaymentRequest);
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
