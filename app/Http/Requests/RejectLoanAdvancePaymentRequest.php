<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectLoanAdvancePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $advancePaymentRequest = $this->route('advancePaymentRequest');

        return $advancePaymentRequest && $this->user()?->can('review', $advancePaymentRequest);
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
