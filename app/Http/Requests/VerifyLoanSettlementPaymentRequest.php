<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyLoanSettlementPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $settlementRequest = $this->route('settlementRequest');

        return $settlementRequest && $this->user()?->can('verifyPayment', $settlementRequest);
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'in:cash,gcash,bank_transfer,adjustment'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
